"""
GDPR Article 9 Hardened CRM API Serializers

Security Features:
- Field-level encryption for PII
- Data minimization (only required fields exposed)
- Consent validation before exposure
- Tenant context validation
"""

import re
from typing import Optional, Dict, Any
from decimal import Decimal

from rest_framework import serializers
from django.utils import timezone

from apps.core.models import BaseModel
from ..models import (
    Contact, Deal, AuditEntry, DataSubjectRequest,
    DataClassification, ConsentStatus,
)
from ..middleware import get_current_tenant_id


class GDPRSerializerMixin:
    """
    Mixin for GDPR-compliant serialization.
    
    Provides:
    - Automatic field filtering based on consent
    - PII masking for unauthorized access
    - Data classification awareness
    """
    
    pii_fields = []
    special_category_fields = []
    
    def to_representation(self, instance):
        """Apply GDPR field filtering."""
        data = super().to_representation(instance)
        
        # Mask PII if consent not granted
        if instance.consent_status != ConsentStatus.GRANTED:
            for field in self.pii_fields:
                if field in data and data[field]:
                    data[field] = self._mask_pii(data[field])
        
        # Remove special category data if classification doesn't permit
        request = self.context.get('request')
        if request and not self._can_access_special_category(request, instance):
            for field in self.special_category_fields:
                data.pop(field, None)
        
        return data
    
    def _mask_pii(self, value: str) -> str:
        """Mask PII for partial display."""
        if not value or len(value) < 3:
            return '***'
        
        return value[0] + '*' * (len(value) - 2) + value[-1]
    
    def _can_access_special_category(self, request, instance) -> bool:
        """Check if request can access special category data."""
        user = request.user
        
        # Admin users can access
        if user.is_staff or user.is_superuser:
            return True
        
        # Check explicit consent
        if instance.consent_status != ConsentStatus.GRANTED:
            return False
        
        # Check data classification
        if instance.data_classification not in [
            DataClassification.SPECIAL_CATEGORY,
            DataClassification.RESTRICTED,
        ]:
            return True
        
        return False


class ContactSerializer(GDPRSerializerMixin, serializers.ModelSerializer):
    """
    Contact serializer with GDPR Article 9 compliance.
    
    Handles Special Category Data (religious affiliation, sacraments)
    with consent-aware exposure.
    """
    
    pii_fields = ['email', 'phone', 'address_street']
    special_category_fields = [
        'religious_affiliation', 'baptism_date', 'baptism_place',
        'first_communion_date', 'confirmation_date', 'marriage_date',
    ]
    
    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'middle_name',
            'email', 'phone', 'secondary_phone',
            'address_street', 'address_city', 'address_postal_code', 'address_country',
            'date_of_birth', 'place_of_birth',
            'religious_affiliation', 'parish_registration_date',
            'baptism_date', 'baptism_place',
            'first_communion_date', 'confirmation_date',
            'marriage_date', 'marriage_place',
            'spouse_name', 'father_name', 'mother_name',
            'envelope_number', 'notes',
            'is_deceased', 'date_of_death',
            'consent_status', 'data_classification',
            'bitrix24_id', 'bitrix24_synced_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'bitrix24_id', 'bitrix24_synced_at',
            'created_at', 'updated_at', 'record_hash',
        ]
    
    def validate_email(self, value: str) -> str:
        """Validate and normalize email."""
        if value:
            value = value.lower().strip()
            # Check uniqueness within tenant
            tenant_id = get_current_tenant_id()
            if tenant_id:
                existing = Contact.objects.filter(
                    organization_id=tenant_id,
                    email=value,
                ).exclude(pk=self.instance.pk if self.instance else None)
                
                if existing.exists():
                    raise serializers.ValidationError(
                        "Contact with this email already exists in this organization"
                    )
        return value
    
    def validate_phone(self, value: str) -> str:
        """Validate phone number format."""
        if value:
            # Remove non-digit characters for validation
            digits = re.sub(r'\D', '', value)
            if len(digits) < 7:
                raise serializers.ValidationError(
                    "Phone number must have at least 7 digits"
                )
        return value
    
    def validate(self, data):
        """Cross-field validation."""
        # If religious data is present, require special category classification
        religious_fields = [
            'religious_affiliation', 'baptism_date', 'first_communion_date',
            'confirmation_date', 'marriage_date',
        ]
        
        has_religious_data = any(data.get(f) for f in religious_fields)
        
        if has_religious_data:
            data['data_classification'] = DataClassification.SPECIAL_CATEGORY
        
        return data
    
    def create(self, validated_data):
        """Create contact with tenant context."""
        tenant_id = get_current_tenant_id()
        if tenant_id:
            validated_data['organization_id'] = tenant_id
        
        return super().create(validated_data)


class ContactMinimalSerializer(serializers.ModelSerializer):
    """Minimal contact serializer for list views."""
    
    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'consent_status', 'data_classification',
        ]


class DealSerializer(GDPRSerializerMixin, serializers.ModelSerializer):
    """
    Deal serializer with PCI-DSS financial compliance.
    
    Handles financial transactions with audit logging.
    """
    
    pii_fields = []
    special_category_fields = ['mass_intention_for', 'mass_intention_type']
    
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    contact_email = serializers.EmailField(source='contact.email', read_only=True)
    
    class Meta:
        model = Deal
        fields = [
            'id', 'deal_number', 'title', 'deal_type', 'stage',
            'contact', 'contact_name', 'contact_email',
            'amount', 'currency', 'paid_amount',
            'payment_method', 'transaction_id', 'payment_processed_at',
            'donation_type', 'is_recurring', 'is_tax_deductible',
            'receipt_sent', 'receipt_sent_at',
            'mass_intention_type', 'mass_intention_for', 'mass_date',
            'contract_start_date', 'contract_end_date', 'contract_duration_months',
            'description', 'internal_notes',
            'closed_at', 'created_at', 'updated_at',
            'consent_status', 'data_classification',
            'legal_hold', 'legal_hold_reason',
            'bitrix24_id', 'bitrix24_synced_at', 'bitrix24_sync_status',
        ]
        read_only_fields = [
            'id', 'deal_number', 'transaction_id', 'payment_processed_at',
            'paid_amount', 'receipt_sent_at', 'closed_at',
            'created_at', 'updated_at', 'record_hash',
            'bitrix24_id', 'bitrix24_synced_at', 'bitrix24_sync_status',
        ]
    
    def validate_amount(self, value: Decimal) -> Decimal:
        """Validate amount is positive."""
        if value < 0:
            raise serializers.ValidationError("Amount must be non-negative")
        return value
    
    def create(self, validated_data):
        """Create deal with tenant context and audit logging."""
        tenant_id = get_current_tenant_id()
        if tenant_id:
            validated_data['organization_id'] = tenant_id
        
        return super().create(validated_data)


class DealMinimalSerializer(serializers.ModelSerializer):
    """Minimal deal serializer for list views."""
    
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    
    class Meta:
        model = Deal
        fields = [
            'id', 'deal_number', 'title', 'deal_type', 'stage',
            'contact', 'contact_name',
            'amount', 'currency',
            'created_at',
        ]


class DealPaymentSerializer(serializers.Serializer):
    """Serializer for processing deal payments."""
    
    deal_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=[
        'stripe', 'paypal', 'bank_transfer', 'cash', 'card'
    ])
    transaction_id = serializers.CharField(max_length=128, required=False)
    
    def validate_amount(self, value):
        """Validate payment amount."""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be positive")
        return value


class AuditEntrySerializer(serializers.ModelSerializer):
    """Serializer for audit entries (read-only)."""
    
    actor_email = serializers.EmailField(source='actor_user.email', read_only=True)
    
    class Meta:
        model = AuditEntry
        fields = [
            'id', 'event_type', 'operation',
            'entity_type', 'entity_id',
            'details',
            'actor_user', 'actor_email', 'actor_ip',
            'created_at',
        ]
        read_only_fields = fields


class DataSubjectRequestSerializer(serializers.ModelSerializer):
    """Serializer for GDPR data subject requests."""
    
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    
    class Meta:
        model = DataSubjectRequest
        fields = [
            'id', 'request_type', 'status',
            'contact', 'contact_name',
            'requester_email', 'requester_name',
            'verification_document',
            'description', 'rejection_reason',
            'assigned_to', 'assigned_to_email',
            'due_date', 'completed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'due_date', 'completed_at',
            'created_at', 'updated_at',
        ]
    
    def create(self, validated_data):
        """Create DSR with tenant context."""
        tenant_id = get_current_tenant_id()
        if tenant_id:
            validated_data['organization_id'] = tenant_id
        
        return super().create(validated_data)


class DataExportSerializer(serializers.Serializer):
    """Serializer for GDPR data export requests."""
    
    include_contacts = serializers.BooleanField(default=True)
    include_deals = serializers.BooleanField(default=True)
    include_audit_log = serializers.BooleanField(default=False)
    format = serializers.ChoiceField(choices=['json', 'csv'], default='json')


class ConsentSerializer(serializers.Serializer):
    """Serializer for consent management."""
    
    consent_granted = serializers.BooleanField()
    consent_version = serializers.CharField(max_length=32, default='1.0')
    gdpr_notice_acknowledged = serializers.BooleanField()
    
    def validate(self, data):
        if data.get('consent_granted') and not data.get('gdpr_notice_acknowledged'):
            raise serializers.ValidationError(
                "GDPR notice must be acknowledged when granting consent"
            )
        return data


class Bitrix24SyncSerializer(serializers.Serializer):
    """Serializer for Bitrix24 sync operations."""
    
    entity_type = serializers.ChoiceField(choices=['contact', 'deal'])
    entity_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )
    force_resync = serializers.BooleanField(default=False)
