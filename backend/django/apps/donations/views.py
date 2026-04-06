"""
Donation views.
GDPR Article 30 - Audit logging for all financial operations.
SOC2 CC6.1 - Rate limiting on financial endpoints.
"""

import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.core.models import AuditLog
from apps.core.throttling import DonationCreateThrottle, DonationRefundThrottle
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
    SOC2 CC7.2 - Audit logging for financial transactions.
    SOC2 CC6.1 - Rate limited to prevent financial abuse.
    Rate: 10/hour per user.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [DonationRefundThrottle]

    def post(self, request, pk):
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
        
        # Store previous state for audit
        previous_status = donation.status
        previous_amount = str(donation.amount)
        
        # Trigger refund via payment gateway (integration delegated to apps.integrations)
        donation.status = Donation.STATUS_REFUNDED
        donation.save(update_fields=['status', 'updated_at'])
        
        # GDPR Article 30 / SOC2 CC7.2 - Create immutable audit record
        AuditLog.objects.create(
            user_id=request.user.id,
            action=AuditLog.ACTION_REFUND,
            entity_type='donation',
            entity_id=str(donation.id),
            field_changes={
                'status': {'old': previous_status, 'new': Donation.STATUS_REFUNDED},
                'refund_reason': request.data.get('reason', 'Not specified'),
            },
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            extra={
                'operation': 'refund',
                'organization_id': str(donation.organization_id),
                'organization_name': donation.organization.name,
                'amount': previous_amount,
                'currency': donation.currency,
                'donor_email': donation.donor_email,
            },
        )
        
        logger.info(
            f"AUDIT: Donation refund processed - id={donation.id}, "
            f"amount={previous_amount} {donation.currency}, "
            f"by_user={request.user.id}, "
            f"organization={donation.organization_id}"
        )
        
        return Response(DonationSerializer(donation).data)
    
    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
