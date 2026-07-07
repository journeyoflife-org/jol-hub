"""
Donation views.
GDPR Article 30 - Audit logging for all financial operations.
SOC2 CC6.1 - Rate limiting on financial endpoints.
SOC2 CC7.2 - Tamper-evident audit logging for financial transactions.
PCI-DSS Requirement 10 - Track and monitor all access to cardholder data.
"""

import logging
from django.db import transaction as db_transaction
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.core.throttling import DonationCreateThrottle, DonationRefundThrottle
from apps.crm.models import AuditEntry
from .models import Donation
from .serializers import DonationSerializer, DonationCreateSerializer

logger = logging.getLogger(__name__)


class DonationListCreateView(generics.ListCreateAPIView):
    """
    GET / POST /api/v1/donations/
    
    SOC2 CC6.1 - Rate limited to prevent fraud.
    POST rate: 20/hour per user.
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return DonationCreateSerializer if self.request.method == 'POST' else DonationSerializer

    def get_queryset(self):
        return Donation.objects.filter(
            donor=self.request.user, is_deleted=False,
        ).select_related('organization')
    
    def get_throttles(self):
        """Apply stricter throttling for POST requests."""
        if self.request.method == 'POST':
            return [DonationCreateThrottle()]
        return []


class DonationDetailView(generics.RetrieveAPIView):
    """GET /api/v1/donations/{id}/"""

    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Donation.objects.filter(is_deleted=False)


class DonationRefundView(APIView):
    """
    POST /api/v1/donations/{id}/refund/
    
    GDPR Article 30(1)(c) - Records of processing activities.
    SOC2 CC7.2 - Tamper-evident audit logging for financial transactions.
    SOC2 CC6.1 - Rate limited to prevent financial abuse.
    PCI-DSS Requirement 10 - Track all access to cardholder data.
    Rate: 10/hour per user.
    
    Audit Trail Requirements:
    - WHO authorized the refund (actor_user, actor_ip)
    - WHEN the refund occurred (created_at timestamp)
    - WHAT changed (field_changes with old/new values)
    - Hash chain for tamper detection (entry_hash, previous_hash)
    - Sequence number for gap detection
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [DonationRefundThrottle]

    def post(self, request, pk):
        """
        Process a donation refund with full audit trail.
        
        GDPR Article 30 / SOC2 CC7.2 / PCI-DSS Requirement 10:
        - Creates tamper-evident audit entry with hash chain
        - Records who authorized the refund
        - Records when the refund occurred
        - Records what changed (before/after state)
        """
        try:
            donation = Donation.objects.select_related('organization', 'donor').get(pk=pk, is_deleted=False)
        except Donation.DoesNotExist:
            return Response(
                {'error': 'not_found', 'message': 'Donation not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        if donation.status != Donation.STATUS_COMPLETED:
            return Response(
                {'error': 'invalid_state', 'message': 'Only completed donations can be refunded.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Store previous state for audit trail
        previous_status = donation.status
        previous_amount = str(donation.amount)
        refund_reason = request.data.get('reason', 'Not specified')
        
        # Get actor information for compliance tracking
        actor_ip = self._get_client_ip(request)
        actor_user_agent = request.META.get('HTTP_USER_AGENT', '')[:512]
        
        # Use atomic transaction for refund + audit entry
        # This ensures we never have a refund without an audit trail
        with db_transaction.atomic():
            # Process the refund
            donation.status = Donation.STATUS_REFUNDED
            donation.save(update_fields=['status', 'updated_at'])
            
            # GDPR Article 30 / SOC2 CC7.2 / PCI-DSS Req 10
            # Create tamper-evident audit entry with hash chain
            # This provides:
            # - WHO: actor_user, actor_ip
            # - WHEN: created_at (auto-generated)
            # - WHAT: details with before/after state
            # - INTEGRITY: entry_hash, previous_hash, sequence_number
            audit_entry = AuditEntry.objects.create(
                organization=donation.organization,
                event_type=AuditEntry.EventType.FINANCIAL_TRANSACTION,
                operation='donation_refund',
                entity_type='donation',
                entity_id=str(donation.id),
                details={
                    # WHAT changed
                    'field_changes': {
                        'status': {'old': previous_status, 'new': Donation.STATUS_REFUNDED},
                    },
                    # Financial details
                    'amount': previous_amount,
                    'currency': donation.currency,
                    'donor_email': donation.donor_email,
                    # Authorization details
                    'refund_reason': refund_reason,
                    'authorized_by': str(request.user.id),
                    'authorized_by_email': getattr(request.user, 'email', None),
                    # Organization context
                    'organization_id': str(donation.organization_id),
                    'organization_name': donation.organization.name,
                },
                actor_user=request.user,
                actor_ip=actor_ip,
                actor_user_agent=actor_user_agent,
                # GDPR legal basis for processing
                gdpr_basis='Art. 6(1)(b) - Contract performance',
            )
        
        # Log for monitoring and alerting
        logger.info(
            f"REFUND_AUDIT: id={donation.id}, "
            f"amount={previous_amount} {donation.currency}, "
            f"authorized_by={request.user.id}, "
            f"authorized_at={audit_entry.created_at.isoformat()}, "
            f"audit_entry_id={audit_entry.id}, "
            f"sequence={audit_entry.sequence_number}, "
            f"organization={donation.organization_id}"
        )
        
        return Response(DonationSerializer(donation).data)

    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
