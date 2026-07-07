"""
Compliance Audit Logger for CRM Operations

Provides tamper-evident audit logging for:
- GDPR Article 30 compliance
- PCI-DSS Requirement 10 compliance  
- SOC2 Type II audit trails
- ISO 27001 A.12.4 event logging

Features:
- Hash chain for tamper detection
- HMAC signatures for integrity
- Field-level change tracking
- Actor context injection
- Automatic GDPR legal basis tracking
"""

import hashlib
import hmac
import json
import logging
import os
import secrets
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Type, Union

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models.signals import pre_save, post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone as django_timezone

logger = logging.getLogger('jolhub.crm.audit')

# Security constants (SOC2 CC7.2, ISO 27001 A.12.4.2)
HASH_ALGORITHM = 'sha256'
GENESIS_PREV_HASH = '0' * 64


class AuditEventType(str, Enum):
    """Standard audit event types for CRM operations."""
    # Data operations
    CREATE = 'create'
    UPDATE = 'update'
    DELETE = 'delete'
    ACCESS = 'access'
    EXPORT = 'export'
    
    # GDPR-specific (Art. 15-22)
    DSR_ACCESS = 'dsr_access'           # Art. 15 - Right of access
    DSR_RECTIFY = 'dsr_rectify'         # Art. 16 - Right to rectification
    DSR_ERASE = 'dsr_erase'             # Art. 17 - Right to erasure
    DSR_RESTRICT = 'dsr_restrict'       # Art. 18 - Right to restriction
    DSR_PORTABILITY = 'dsr_portability' # Art. 20 - Right to portability
    DSR_OBJECT = 'dsr_object'           # Art. 21 - Right to object
    
    # Consent management
    CONSENT_GRANTED = 'consent_granted'
    CONSENT_WITHDRAWN = 'consent_withdrawn'
    
    # Financial (PCI-DSS)
    PAYMENT_PROCESSED = 'payment_processed'
    REFUND_PROCESSED = 'refund_processed'
    RECEIPT_SENT = 'receipt_sent'
    
    # Legal hold
    LEGAL_HOLD_APPLIED = 'legal_hold_applied'
    LEGAL_HOLD_RELEASED = 'legal_hold_released'
    
    # Synchronization
    SYNC_CREATED = 'sync_created'
    SYNC_UPDATED = 'sync_updated'
    SYNC_FAILED = 'sync_failed'
    
    # Security events
    UNAUTHORIZED_ACCESS = 'unauthorized_access'
    CROSS_TENANT_ATTEMPT = 'cross_tenant_attempt'


class GDPRLegalBasis(str, Enum):
    """GDPR Article 6 legal bases for processing."""
    CONSENT = 'art_6_1_a'           # Consent
    CONTRACT = 'art_6_1_b'          # Contractual necessity
    LEGAL_OBLIGATION = 'art_6_1_c'  # Legal obligation
    VITAL_INTERESTS = 'art_6_1_d'   # Vital interests
    PUBLIC_TASK = 'art_6_1_e'       # Public task
    LEGITIMATE_INTEREST = 'art_6_1_f'  # Legitimate interests
    
    # Special category (Art. 9)
    RELIGIOUS_PURPOSE = 'art_9_2_d'  # Religious purposes


@dataclass
class AuditContext:
    """Context for audit logging from request."""
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    tenant_id: Optional[str] = None
    request_id: Optional[str] = None
    
    @classmethod
    def from_request(cls, request) -> 'AuditContext':
        """Extract audit context from Django request."""
        from apps.crm.middleware import get_current_tenant_context
        
        context = get_current_tenant_context()
        
        return cls(
            user_id=str(request.user.id) if hasattr(request, 'user') and request.user.is_authenticated else None,
            user_email=request.user.email if hasattr(request, 'user') and request.user.is_authenticated else None,
            ip_address=context.ip_address if context else None,
            user_agent=context.user_agent if context else None,
            tenant_id=context.tenant_id if context else None,
            request_id=context.request_id if context else None,
        )


@dataclass
class FieldChange:
    """Represents a single field change."""
    field_name: str
    old_value: Any
    new_value: Any
    data_classification: str = 'internal'  # PII, SPECIAL_CATEGORY, etc.
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'field': self.field_name,
            'old': self._serialize(self.old_value),
            'new': self._serialize(self.new_value),
            'classification': self.data_classification,
        }
    
    @staticmethod
    def _serialize(value: Any) -> Any:
        """Serialize value for JSON storage."""
        if value is None:
            return None
        if isinstance(value, Decimal):
            return str(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, models.Model):
            return str(value.id)
        return str(value)


class ComplianceAuditLogger:
    """
    Compliance audit logger for CRM operations.
    
    Provides:
    - Tamper-evident hash chain
    - HMAC signatures for integrity
    - Field-level change tracking
    - GDPR legal basis tracking
    - Automatic context injection
    
    Usage:
        logger = ComplianceAuditLogger()
        
        # Log a creation event
        logger.log_create(
            instance=contact,
            context=AuditContext.from_request(request),
            details={'source': 'web_form'}
        )
        
        # Log an update with field changes
        logger.log_update(
            instance=contact,
            field_changes=[FieldChange('email', old@example.com', 'new@example.com')],
            context=AuditContext.from_request(request)
        )
    """
    
    # Sensitive fields that should be masked in logs
    SENSITIVE_FIELDS = {
        'password', 'token', 'secret', 'key', 'credit_card',
        'cvv', 'ssn', 'tax_id',
    }
    
    # Special category fields (GDPR Art. 9)
    SPECIAL_CATEGORY_FIELDS = {
        'religious_affiliation', 'baptism_date', 'baptism_place',
        'first_communion_date', 'confirmation_date', 'marriage_date',
        'marriage_place', 'mass_intention_for', 'mass_intention_type',
    }
    
    # PII fields
    PII_FIELDS = {
        'first_name', 'last_name', 'email', 'phone', 'secondary_phone',
        'address_street', 'address_city', 'address_postal_code',
        'date_of_birth', 'place_of_birth', 'spouse_name',
        'father_name', 'mother_name',
    }
    
    def __init__(self, secret_key: Optional[bytes] = None):
        """
        Initialize the audit logger.
        
        Args:
            secret_key: HMAC signing key (defaults to Django SECRET_KEY)
        """
        if secret_key:
            self._secret_key = secret_key
        else:
            # Use Django secret key for HMAC signatures
            key = getattr(settings, 'AUDIT_LOG_SECRET_KEY', settings.SECRET_KEY)
            self._secret_key = key.encode() if isinstance(key, str) else key
    
    def log_create(
        self,
        instance: models.Model,
        context: Optional[AuditContext] = None,
        details: Optional[Dict[str, Any]] = None,
        legal_basis: Optional[str] = None,
    ) -> 'AuditEntry':
        """
        Log a creation event.
        
        Args:
            instance: The created model instance
            context: Audit context (user, IP, etc.)
            details: Additional details to log
            legal_basis: GDPR legal basis for processing
            
        Returns:
            The created AuditEntry
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        # Determine legal basis
        if not legal_basis:
            legal_basis = self._determine_legal_basis(instance)
        
        # Build details
        log_details = details or {}
        log_details.update({
            'entity_repr': str(instance),
            'model': instance.__class__.__name__,
            'created_fields': self._get_field_values(instance),
        })
        
        # Add data classification
        data_classification = getattr(instance, 'data_classification', 'internal')
        log_details['data_classification'] = data_classification
        
        # Create audit entry
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id or getattr(instance, 'organization_id', None),
            event_type=AuditEntry.EventType.CREATE,
            operation=f'{instance.__class__.__name__.lower()}_created',
            entity_type=instance.__class__.__name__.lower(),
            entity_id=str(instance.id),
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis=legal_basis,
        )
        
        self._log_to_external_system(entry)
        
        return entry
    
    def log_update(
        self,
        instance: models.Model,
        field_changes: List[FieldChange],
        context: Optional[AuditContext] = None,
        details: Optional[Dict[str, Any]] = None,
        legal_basis: Optional[str] = None,
    ) -> 'AuditEntry':
        """
        Log an update event with field changes.
        
        Args:
            instance: The updated model instance
            field_changes: List of field changes
            context: Audit context
            details: Additional details
            legal_basis: GDPR legal basis
            
        Returns:
            The created AuditEntry
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        # Determine legal basis
        if not legal_basis:
            legal_basis = self._determine_legal_basis(instance, field_changes)
        
        # Build details with field changes
        log_details = details or {}
        log_details.update({
            'entity_repr': str(instance),
            'model': instance.__class__.__name__,
            'field_changes': [fc.to_dict() for fc in field_changes],
            'changed_fields': [fc.field_name for fc in field_changes],
        })
        
        # Check for special category data changes
        special_changes = [
            fc for fc in field_changes 
            if fc.field_name in self.SPECIAL_CATEGORY_FIELDS
        ]
        if special_changes:
            log_details['special_category_data_changed'] = True
            log_details['data_classification'] = 'special_category'
        
        # Check for PII changes
        pii_changes = [
            fc for fc in field_changes 
            if fc.field_name in self.PII_FIELDS
        ]
        if pii_changes:
            log_details['pii_changed'] = True
        
        # Create audit entry
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id or getattr(instance, 'organization_id', None),
            event_type=AuditEntry.EventType.UPDATE,
            operation=f'{instance.__class__.__name__.lower()}_updated',
            entity_type=instance.__class__.__name__.lower(),
            entity_id=str(instance.id),
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis=legal_basis,
        )
        
        self._log_to_external_system(entry)
        
        return entry
    
    def log_delete(
        self,
        instance: models.Model,
        context: Optional[AuditContext] = None,
        details: Optional[Dict[str, Any]] = None,
        legal_basis: Optional[str] = None,
    ) -> 'AuditEntry':
        """
        Log a deletion event.
        
        Args:
            instance: The deleted model instance
            context: Audit context
            details: Additional details
            legal_basis: GDPR legal basis
            
        Returns:
            The created AuditEntry
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        # Capture data before deletion
        log_details = details or {}
        log_details.update({
            'entity_repr': str(instance),
            'model': instance.__class__.__name__,
            'deleted_fields': self._get_field_values(instance),
        })
        
        # Check for legal hold
        if hasattr(instance, 'legal_hold') and instance.legal_hold:
            log_details['legal_hold_bypassed'] = True
        
        # GDPR Art. 17 erasure
        legal_basis = legal_basis or GDPRLegalBasis.CONSENT.value
        
        # Create audit entry (must happen before deletion)
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id or getattr(instance, 'organization_id', None),
            event_type=AuditEntry.EventType.DELETE,
            operation=f'{instance.__class__.__name__.lower()}_deleted',
            entity_type=instance.__class__.__name__.lower(),
            entity_id=str(instance.id),
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis=legal_basis,
        )
        
        self._log_to_external_system(entry)
        
        return entry
    
    def log_access(
        self,
        instance: models.Model,
        context: Optional[AuditContext] = None,
        access_type: str = 'read',
        details: Optional[Dict[str, Any]] = None,
    ) -> 'AuditEntry':
        """
        Log a data access event.
        
        Important for:
        - GDPR Art. 15 (access requests)
        - SOC2 access monitoring
        - Security incident investigation
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        log_details = details or {}
        log_details.update({
            'entity_repr': str(instance),
            'access_type': access_type,
            'data_classification': getattr(instance, 'data_classification', 'internal'),
        })
        
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id or getattr(instance, 'organization_id', None),
            event_type=AuditEntry.EventType.ACCESS,
            operation=f'{instance.__class__.__name__.lower()}_accessed',
            entity_type=instance.__class__.__name__.lower(),
            entity_id=str(instance.id),
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis=GDPRLegalBasis.LEGITIMATE_INTEREST.value,
        )
        
        return entry
    
    def log_financial_transaction(
        self,
        transaction_type: str,
        instance: models.Model,
        amount: Decimal,
        currency: str,
        context: Optional[AuditContext] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> 'AuditEntry':
        """
        Log a financial transaction (PCI-DSS Requirement 10).
        
        All financial transactions must be logged with:
        - Transaction ID
        - Amount and currency
        - User who initiated
        - Timestamp
        - Result (success/failure)
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        log_details = details or {}
        log_details.update({
            'transaction_type': transaction_type,
            'amount': str(amount),
            'currency': currency,
            'entity_repr': str(instance),
        })
        
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id or getattr(instance, 'organization_id', None),
            event_type=AuditEntry.EventType.FINANCIAL_TRANSACTION,
            operation=f'financial_{transaction_type}',
            entity_type=instance.__class__.__name__.lower(),
            entity_id=str(instance.id),
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis=GDPRLegalBasis.CONTRACT.value,
            retention_period_years=7,  # PCI-DSS requires 1 year minimum
        )
        
        # Additional PCI-DSS logging
        logger.info(
            f"FINANCIAL: {transaction_type} {amount} {currency} "
            f"on {instance.__class__.__name__}:{instance.id} "
            f"by user:{context.user_id} from {context.ip_address}"
        )
        
        return entry
    
    def log_consent_change(
        self,
        instance: models.Model,
        old_status: str,
        new_status: str,
        context: Optional[AuditContext] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> 'AuditEntry':
        """
        Log a consent change (GDPR Art. 7).
        
        Consent changes must be logged for accountability.
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        log_details = details or {}
        log_details.update({
            'entity_repr': str(instance),
            'old_consent_status': old_status,
            'new_consent_status': new_status,
            'consent_version': getattr(instance, 'consent_version', '1.0'),
        })
        
        event_type = AuditEntry.EventType.CONSENT_CHANGE
        operation = 'consent_granted' if new_status == 'granted' else 'consent_withdrawn'
        
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id or getattr(instance, 'organization_id', None),
            event_type=event_type,
            operation=operation,
            entity_type=instance.__class__.__name__.lower(),
            entity_id=str(instance.id),
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis=GDPRLegalBasis.CONSENT.value,
        )
        
        return entry
    
    def log_gdpr_request(
        self,
        request_type: str,
        data_subject_id: str,
        organization_id: str,
        context: Optional[AuditContext] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> 'AuditEntry':
        """
        Log a GDPR data subject request (Art. 15-22).
        
        All DSR activities must be logged for compliance.
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        log_details = details or {}
        log_details.update({
            'request_type': request_type,
            'data_subject_id': data_subject_id,
        })
        
        entry = AuditEntry.objects.create(
            organization_id=organization_id,
            event_type=AuditEntry.EventType.GDPR_REQUEST,
            operation=f'dsr_{request_type}',
            entity_type='data_subject_request',
            entity_id=data_subject_id,
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
            gdpr_basis='gdpr_art_15_22',
        )
        
        return entry
    
    def log_unauthorized_access(
        self,
        entity_type: str,
        entity_id: str,
        context: Optional[AuditContext] = None,
        reason: str = '',
        details: Optional[Dict[str, Any]] = None,
    ) -> 'AuditEntry':
        """
        Log an unauthorized access attempt.
        
        Critical for security monitoring and incident response.
        """
        from apps.crm.models import AuditEntry
        
        if context is None:
            context = AuditContext()
        
        log_details = details or {}
        log_details.update({
            'reason': reason,
            'security_event': True,
        })
        
        entry = AuditEntry.objects.create(
            organization_id=context.tenant_id,
            event_type=AuditEntry.EventType.ACCESS,
            operation='unauthorized_access_attempt',
            entity_type=entity_type,
            entity_id=entity_id,
            details=log_details,
            actor_user_id=context.user_id,
            actor_ip=context.ip_address,
            actor_user_agent=context.user_agent[:512] if context.user_agent else '',
        )
        
        # Alert security team
        logger.warning(
            f"SECURITY: Unauthorized access attempt to {entity_type}:{entity_id} "
            f"by user:{context.user_id} from {context.ip_address} - {reason}"
        )
        
        return entry
    
    def compute_hmac(self, data: Dict[str, Any]) -> str:
        """Compute HMAC signature for data integrity."""
        canonical = json.dumps(data, sort_keys=True, separators=(',', ':'))
        return hmac.new(
            self._secret_key,
            canonical.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def verify_hmac(self, data: Dict[str, Any], signature: str) -> bool:
        """Verify HMAC signature."""
        expected = self.compute_hmac(data)
        return hmac.compare_digest(expected, signature)
    
    def _determine_legal_basis(
        self,
        instance: models.Model,
        field_changes: Optional[List[FieldChange]] = None,
    ) -> str:
        """Determine GDPR legal basis for processing."""
        # Check for special category data
        if hasattr(instance, 'data_classification'):
            if instance.data_classification == 'special_category':
                return GDPRLegalBasis.RELIGIOUS_PURPOSE.value
        
        # Check field changes for special category
        if field_changes:
            for change in field_changes:
                if change.field_name in self.SPECIAL_CATEGORY_FIELDS:
                    return GDPRLegalBasis.RELIGIOUS_PURPOSE.value
        
        # Check for consent
        if hasattr(instance, 'consent_status'):
            consent = getattr(instance, 'consent_status', None)
            if consent == 'granted':
                return GDPRLegalBasis.CONSENT.value
        
        # Default to legitimate interest
        return GDPRLegalBasis.LEGITIMATE_INTEREST.value
    
    def _get_field_values(self, instance: models.Model) -> Dict[str, Any]:
        """Get all field values for an instance (for audit capture)."""
        values = {}
        for field in instance._meta.fields:
            name = field.name
            # Skip sensitive fields
            if name in self.SENSITIVE_FIELDS:
                values[name] = '[REDACTED]'
                continue
            
            try:
                value = getattr(instance, name)
                values[name] = FieldChange._serialize(value)
            except Exception:
                values[name] = '[ERROR]'
        
        return values
    
    def _log_to_external_system(self, entry: 'AuditEntry') -> None:
        """Log to external systems (SIEM, log files, etc.)."""
        # Log to Python logger
        logger.info(
            f"AUDIT: {entry.event_type} {entry.entity_type}:{entry.entity_id} "
            f"by user:{entry.actor_user_id} from {entry.actor_ip} "
            f"[seq={entry.sequence_number}]"
        )


# Singleton instance
_audit_logger: Optional[ComplianceAuditLogger] = None


def get_audit_logger() -> ComplianceAuditLogger:
    """Get the global audit logger instance."""
    global _audit_logger
    if _audit_logger is None:
        _audit_logger = ComplianceAuditLogger()
    return _audit_logger


def configure_audit_logger(**kwargs) -> ComplianceAuditLogger:
    """Configure the global audit logger."""
    global _audit_logger
    _audit_logger = ComplianceAuditLogger(**kwargs)
    return _audit_logger
