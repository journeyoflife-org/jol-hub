"""
GDPR Article 9 Hardened CRM API Views

Security Controls:
- Tenant isolation enforcement
- Rate limiting for sensitive operations
- Input validation and sanitization
- PII exposure controls
- Comprehensive audit logging
"""

import csv
import io
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.http import HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action, api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from apps.core.permissions import IsOrganizationMember
from ..models import (
    Contact, Deal, AuditEntry, DataSubjectRequest,
    DataClassification, ConsentStatus,
)
from ..middleware import (
    get_current_tenant_id, get_current_tenant_context,
    TenantDataAccessValidator, log_tenant_access,
)
from .serializers import (
    ContactSerializer, ContactMinimalSerializer,
    DealSerializer, DealMinimalSerializer, DealPaymentSerializer,
    AuditEntrySerializer, DataSubjectRequestSerializer,
    DataExportSerializer, ConsentSerializer, Bitrix24SyncSerializer,
)

logger = logging.getLogger('jolhub.crm.views')


# ============================================================================
# CUSTOM THROTTLE CLASSES FOR GDPR COMPLIANCE
# ============================================================================

class GDPRExportThrottle(UserRateThrottle):
    """Strict rate limit for GDPR data exports."""
    rate = '5/hour'


class GDPRDeleteThrottle(UserRateThrottle):
    """Strict rate limit for GDPR data deletion."""
    rate = '3/hour'


class FinancialThrottle(UserRateThrottle):
    """Rate limit for financial operations."""
    rate = '20/hour'


class CRMThrottle(UserRateThrottle):
    """Standard rate limit for CRM operations."""
    rate = '100/hour'


# ============================================================================
# TENANT ISOLATION MIXIN
# ============================================================================

class TenantIsolatedViewSetMixin:
    """
    Mixin for automatic tenant isolation in ViewSets.
    
    Provides:
    - QuerySet filtering by tenant
    - Object-level tenant validation
    - Audit logging for all operations
    """
    
    def get_queryset(self):
        """Filter queryset by current tenant."""
        queryset = super().get_queryset()
        
        tenant_id = get_current_tenant_id()
        if tenant_id:
            queryset = queryset.filter(organization_id=tenant_id)
        else:
            # No tenant context - return empty queryset
            queryset = queryset.none()
        
        return queryset
    
    def perform_create(self, serializer):
        """Inject tenant context on create."""
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            raise PermissionDenied("Tenant context required")
        
        serializer.save(organization_id=tenant_id)
    
    def check_object_permissions(self, request, obj):
        """Validate object belongs to current tenant."""
        super().check_object_permissions(request, obj)
        
        if not TenantDataAccessValidator.validate_organization(obj):
            log_tenant_access(
                operation='unauthorized_access_attempt',
                entity_type=obj.__class__.__name__,
                entity_id=str(obj.id),
                success=False,
            )
            raise PermissionDenied("Access to this resource is forbidden")


# ============================================================================
# CONTACT VIEWSET
# ============================================================================

@extend_schema(
    tags=['CRM - Contacts'],
    description="""
    Contact management with GDPR Article 9 compliance.
    
    Handles Special Category Data (religious affiliation, sacraments)
    with consent-aware data exposure.
    """
)
class ContactViewSet(TenantIsolatedViewSetMixin, viewsets.ModelViewSet):
    """
    API endpoint for CRM contacts with GDPR compliance.
    
    list:
    Return a list of contacts for the current tenant.
    
    create:
    Create a new contact (requires tenant context).
    
    retrieve:
    Return a specific contact (validates tenant ownership).
    
    update:
    Update a contact (validates tenant ownership).
    
    destroy:
    Delete a contact (checks for legal hold).
    """
    
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    throttle_classes = [CRMThrottle]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'data_classification', 'consent_status', 'is_deceased',
    ]
    search_fields = ['first_name', 'last_name', 'email', 'envelope_number']
    ordering_fields = ['last_name', 'first_name', 'created_at']
    ordering = ['last_name', 'first_name']
    
    def get_serializer_class(self):
        """Use minimal serializer for list views."""
        if self.action == 'list':
            return ContactMinimalSerializer
        return ContactSerializer
    
    def get_queryset(self):
        """Filter contacts by tenant with optional filters."""
        queryset = super().get_queryset()
        
        # Filter by special category data
        has_religious = self.request.query_params.get('has_religious_data')
        if has_religious:
            queryset = queryset.filter(
                ~Q(religious_affiliation='')
            ).exclude(religious_affiliation__isnull=True)
        
        # Filter by date range
        created_after = self.request.query_params.get('created_after')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """Delete contact with legal hold check."""
        instance = self.get_object()
        
        if instance.is_legal_hold_active():
            return Response(
                {"error": "Cannot delete contact with active legal hold"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @extend_schema(
        description="Grant GDPR consent for contact",
        request=ConsentSerializer,
        responses={200: ContactSerializer}
    )
    @action(detail=True, methods=['post'])
    def grant_consent(self, request, pk=None):
        """Grant GDPR consent for a contact."""
        contact = self.get_object()
        serializer = ConsentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        contact.grant_consent(
            version=serializer.validated_data.get('consent_version', '1.0')
        )
        
        log_tenant_access(
            operation='consent_granted',
            entity_type='contact',
            entity_id=str(contact.id),
            details={'version': contact.consent_version},
        )
        
        return Response(ContactSerializer(contact).data)
    
    @extend_schema(
        description="Withdraw GDPR consent for contact",
        responses={200: ContactSerializer}
    )
    @action(detail=True, methods=['post'])
    def withdraw_consent(self, request, pk=None):
        """Withdraw GDPR consent (Art. 7(3))."""
        contact = self.get_object()
        contact.withdraw_consent()
        
        log_tenant_access(
            operation='consent_withdrawn',
            entity_type='contact',
            entity_id=str(contact.id),
        )
        
        return Response(ContactSerializer(contact).data)
    
    @extend_schema(
        description="Export contact data (GDPR Art. 15)",
        responses={200: OpenApiResponse(description="Contact data export")}
    )
    @action(detail=True, methods=['get'], throttle_classes=[GDPRExportThrottle])
    def export(self, request, pk=None):
        """Export contact data for GDPR Art. 15 request."""
        contact = self.get_object()
        
        # Get related data
        deals = contact.deals.all()
        
        export_data = {
            'contact': ContactSerializer(contact).data,
            'related_deals': DealMinimalSerializer(deals, many=True).data,
            'export_date': timezone.now().isoformat(),
            'export_format_version': '1.0',
        }
        
        log_tenant_access(
            operation='data_export',
            entity_type='contact',
            entity_id=str(contact.id),
        )
        
        return Response(export_data)


# ============================================================================
# DEAL VIEWSET
# ============================================================================

@extend_schema(
    tags=['CRM - Deals'],
    description="""
    Deal management with PCI-DSS financial compliance.
    
    Handles donations, contracts, and financial transactions
    with comprehensive audit logging.
    """
)
class DealViewSet(TenantIsolatedViewSetMixin, viewsets.ModelViewSet):
    """
    API endpoint for CRM deals with financial compliance.
    """
    
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    throttle_classes = [CRMThrottle]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['deal_type', 'stage', 'payment_method']
    search_fields = ['title', 'deal_number', 'contact__first_name', 'contact__last_name']
    ordering_fields = ['created_at', 'amount', 'closed_at']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """Use minimal serializer for list views."""
        if self.action == 'list':
            return DealMinimalSerializer
        return DealSerializer
    
    def get_queryset(self):
        """Filter deals by tenant with optional filters."""
        queryset = super().get_queryset()
        
        # Filter by contact
        contact_id = self.request.query_params.get('contact')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)
        
        # Filter by date range
        created_after = self.request.query_params.get('created_after')
        if created_after:
            queryset = queryset.filter(created_at__gte=created_after)
        
        # Filter by amount range
        min_amount = self.request.query_params.get('min_amount')
        max_amount = self.request.query_params.get('max_amount')
        if min_amount:
            queryset = queryset.filter(amount__gte=min_amount)
        if max_amount:
            queryset = queryset.filter(amount__lte=max_amount)
        
        return queryset
    
    @extend_schema(
        description="Mark deal as paid",
        request=DealPaymentSerializer,
        responses={200: DealSerializer}
    )
    @action(detail=True, methods=['post'], throttle_classes=[FinancialThrottle])
    def mark_paid(self, request, pk=None):
        """Mark deal as paid with financial audit logging."""
        deal = self.get_object()
        serializer = DealPaymentSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        deal.mark_paid(
            transaction_id=serializer.validated_data.get('transaction_id', '')
        )
        
        return Response(DealSerializer(deal).data)
    
    @extend_schema(
        description="Process refund for deal",
        responses={200: DealSerializer}
    )
    @action(detail=True, methods=['post'], throttle_classes=[FinancialThrottle])
    def refund(self, request, pk=None):
        """Process refund with PCI-DSS audit logging."""
        deal = self.get_object()
        reason = request.data.get('reason', '')
        
        if deal.stage not in [Deal.DealStage.PAID, Deal.DealStage.COMPLETED]:
            return Response(
                {"error": "Only paid/completed deals can be refunded"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        with transaction.atomic():
            deal.stage = Deal.DealStage.REFUNDED
            deal.save()
            
            # Create audit entry
            AuditEntry.objects.create(
                organization=deal.organization,
                event_type=AuditEntry.EventType.FINANCIAL_TRANSACTION,
                operation='refund_processed',
                entity_type='deal',
                entity_id=str(deal.id),
                details={
                    'deal_number': deal.deal_number,
                    'amount': str(deal.amount),
                    'currency': deal.currency,
                    'reason': reason,
                },
            )
        
        return Response(DealSerializer(deal).data)
    
    @extend_schema(
        description="Send donation receipt",
        responses={200: DealSerializer}
    )
    @action(detail=True, methods=['post'])
    def send_receipt(self, request, pk=None):
        """Send donation receipt email."""
        deal = self.get_object()
        
        if deal.receipt_sent:
            return Response(
                {"error": "Receipt already sent"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Integrate with email service
        deal.receipt_sent = True
        deal.receipt_sent_at = timezone.now()
        deal.save()
        
        return Response(DealSerializer(deal).data)
    
    @extend_schema(
        description="Get deal statistics for tenant",
        responses={200: OpenApiResponse(description="Deal statistics")}
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get aggregated deal statistics."""
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            return Response({"error": "Tenant context required"}, status=400)
        
        queryset = self.get_queryset()
        
        stats = queryset.aggregate(
            total_deals=Count('id'),
            total_amount=Sum('amount'),
            total_paid=Sum('paid_amount'),
        )
        
        by_type = queryset.values('deal_type').annotate(
            count=Count('id'),
            total=Sum('amount'),
        )
        
        by_stage = queryset.values('stage').annotate(
            count=Count('id'),
        )
        
        return Response({
            'total_deals': stats['total_deals'] or 0,
            'total_amount': float(stats['total_amount'] or 0),
            'total_paid': float(stats['total_paid'] or 0),
            'by_type': list(by_type),
            'by_stage': list(by_stage),
        })


# ============================================================================
# DATA SUBJECT REQUEST VIEWSET
# ============================================================================

@extend_schema(
    tags=['CRM - GDPR'],
    description="""
    GDPR Data Subject Request management.
    
    Handles Art. 15-22 requests with proper tracking and audit.
    """
)
class DataSubjectRequestViewSet(TenantIsolatedViewSetMixin, viewsets.ModelViewSet):
    """API endpoint for GDPR data subject requests."""
    
    serializer_class = DataSubjectRequestSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    throttle_classes = [CRMThrottle]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['request_type', 'status']
    ordering = ['-created_at']
    
    @extend_schema(
        description="Process data subject request",
        responses={200: DataSubjectRequestSerializer}
    )
    @action(detail=True, methods=['post'])
    def process(self, request, pk=None):
        """Process a data subject request."""
        dsr = self.get_object()
        
        if dsr.status != DataSubjectRequest.Status.PENDING:
            return Response(
                {"error": "Request already processed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process based on type
        if dsr.request_type == DataSubjectRequest.RequestType.ACCESS:
            # Export data
            return self._process_access_request(dsr)
        elif dsr.request_type == DataSubjectRequest.RequestType.ERASURE:
            # Delete data (with legal hold check)
            return self._process_erasure_request(dsr)
        else:
            dsr.status = DataSubjectRequest.Status.IN_PROGRESS
            dsr.save()
            return Response(DataSubjectRequestSerializer(dsr).data)
    
    def _process_access_request(self, dsr):
        """Process GDPR Art. 15 access request."""
        if not dsr.contact:
            return Response(
                {"error": "No contact linked to request"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contact = dsr.contact
        deals = contact.deals.all()
        
        export_data = {
            'contact': ContactSerializer(contact).data,
            'deals': DealSerializer(deals, many=True).data,
        }
        
        dsr.complete(response_data=export_data)
        
        return Response(DataSubjectRequestSerializer(dsr).data)
    
    def _process_erasure_request(self, dsr):
        """Process GDPR Art. 17 erasure request."""
        if not dsr.contact:
            return Response(
                {"error": "No contact linked to request"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        contact = dsr.contact
        
        # Check for legal hold
        if contact.is_legal_hold_active():
            dsr.status = DataSubjectRequest.Status.REJECTED
            dsr.rejection_reason = "Legal hold active on this record"
            dsr.save()
            return Response(DataSubjectRequestSerializer(dsr).data)
        
        # Anonymize instead of delete for audit trail
        contact.first_name = "[REDACTED]"
        contact.last_name = "[REDACTED]"
        contact.email = ""
        contact.phone = ""
        contact.save()
        
        dsr.complete()
        
        return Response(DataSubjectRequestSerializer(dsr).data)


# ============================================================================
# AUDIT LOG VIEWSET
# ============================================================================

@extend_schema(
    tags=['CRM - Audit'],
    description="Read-only audit log access for compliance."
)
class AuditEntryViewSet(TenantIsolatedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    """API endpoint for audit log access."""
    
    serializer_class = AuditEntrySerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['event_type', 'entity_type']
    ordering = ['-created_at']
    pagination_class = None  # Limit to last 1000 entries
    
    def get_queryset(self):
        """Limit to last 1000 entries for performance."""
        return super().get_queryset()[:1000]
    
    @extend_schema(
        description="Verify audit log integrity",
        responses={200: OpenApiResponse(description="Integrity check results")}
    )
    @action(detail=False, methods=['get'])
    def verify_integrity(self, request):
        """Verify the integrity of the audit hash chain."""
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            return Response({"error": "Tenant context required"}, status=400)
        
        result = AuditEntry.verify_chain(tenant_id)
        
        return Response(result)
    
    @extend_schema(
        description="Export audit log for compliance reporting",
        responses={200: OpenApiResponse(description="Audit log export")}
    )
    @action(detail=False, methods=['get'], throttle_classes=[GDPRExportThrottle])
    def export(self, request):
        """Export audit log for compliance reporting."""
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            return Response({"error": "Tenant context required"}, status=400)
        
        # Get query parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        event_types = request.query_params.getlist('event_type')
        
        queryset = AuditEntry.objects.filter(organization_id=tenant_id)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        if event_types:
            queryset = queryset.filter(event_type__in=event_types)
        
        # Verify integrity before export
        integrity = AuditEntry.verify_chain(tenant_id)
        
        entries = queryset.order_by('sequence_number')[:5000]
        
        export_data = {
            'organization_id': tenant_id,
            'export_date': timezone.now().isoformat(),
            'total_entries': entries.count(),
            'integrity_status': 'valid' if integrity['valid'] else 'compromised',
            'integrity_errors': integrity.get('errors', []),
            'entries': AuditEntrySerializer(entries, many=True).data,
        }
        
        # Log the export
        log_tenant_access(
            operation='audit_log_exported',
            entity_type='audit_entry',
            entity_id='export',
            details={
                'entry_count': entries.count(),
                'start_date': start_date,
                'end_date': end_date,
            },
        )
        
        return Response(export_data)
    
    @extend_schema(
        description="Get audit log statistics",
        responses={200: OpenApiResponse(description="Audit statistics")}
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get audit log statistics for dashboard."""
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            return Response({"error": "Tenant context required"}, status=400)
        
        queryset = AuditEntry.objects.filter(organization_id=tenant_id)
        
        # Total counts
        total = queryset.count()
        last_24h = queryset.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()
        last_7d = queryset.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # By event type
        by_type = queryset.values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # By entity type
        by_entity = queryset.values('entity_type').annotate(
            count=Count('id')
        ).order_by('-count')[:10]
        
        # Security events
        security_events = queryset.filter(
            event_type__in=['access', 'delete', 'gdpr_request']
        ).filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Financial events (PCI-DSS)
        financial_events = queryset.filter(
            event_type='financial_transaction'
        ).filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        # Integrity status
        integrity = AuditEntry.verify_chain(tenant_id)
        
        return Response({
            'total_entries': total,
            'last_24h': last_24h,
            'last_7d': last_7d,
            'by_event_type': list(by_type),
            'by_entity_type': list(by_entity),
            'security_events_last_7d': security_events,
            'financial_events_last_30d': financial_events,
            'integrity_status': 'valid' if integrity['valid'] else 'compromised',
        })
    
    @extend_schema(
        description="Get chain info for verification",
        responses={200: OpenApiResponse(description="Chain info")}
    )
    @action(detail=False, methods=['get'])
    def chain_info(self, request):
        """Get hash chain information."""
        tenant_id = get_current_tenant_id()
        if not tenant_id:
            return Response({"error": "Tenant context required"}, status=400)
        
        # Get first and last entries
        first_entry = AuditEntry.objects.filter(
            organization_id=tenant_id
        ).order_by('sequence_number').first()
        
        last_entry = AuditEntry.objects.filter(
            organization_id=tenant_id
        ).order_by('-sequence_number').first()
        
        total_entries = AuditEntry.objects.filter(
            organization_id=tenant_id
        ).count()
        
        return Response({
            'total_entries': total_entries,
            'first_entry': {
                'sequence': first_entry.sequence_number if first_entry else None,
                'hash': first_entry.entry_hash if first_entry else None,
                'created_at': first_entry.created_at.isoformat() if first_entry else None,
            },
            'last_entry': {
                'sequence': last_entry.sequence_number if last_entry else None,
                'hash': last_entry.entry_hash if last_entry else None,
                'created_at': last_entry.created_at.isoformat() if last_entry else None,
            },
        })


# ============================================================================
# BITRIX24 SYNC VIEWSET
# ============================================================================

@extend_schema(
    tags=['CRM - Bitrix24'],
    description="Bitrix24 CRM synchronization operations."
)
class Bitrix24SyncViewSet(viewsets.ViewSet):
    """API endpoint for Bitrix24 synchronization."""
    
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    
    @extend_schema(
        request=Bitrix24SyncSerializer,
        responses={200: OpenApiResponse(description="Sync results")}
    )
    @action(detail=False, methods=['post'])
    def sync(self, request):
        """Sync entities to Bitrix24 CRM."""
        serializer = Bitrix24SyncSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        entity_type = serializer.validated_data['entity_type']
        entity_ids = serializer.validated_data['entity_ids']
        force_resync = serializer.validated_data['force_resync']
        
        # TODO: Implement actual sync logic with Bitrix24 abstraction layer
        
        return Response({
            'status': 'queued',
            'entity_type': entity_type,
            'count': len(entity_ids),
        })
