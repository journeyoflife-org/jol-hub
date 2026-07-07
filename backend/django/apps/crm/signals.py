"""
Signal handlers for CRM models with comprehensive audit logging.

GDPR Article 30 - Records of Processing Activities
PCI-DSS Requirement 10 - Track and monitor all access
SOC2 Type II - Audit trail for compliance

Features:
- Automatic field-level change tracking
- Special category data detection
- Consent status change logging
- Financial transaction logging
- Legal hold monitoring
"""

import logging
from decimal import Decimal
from typing import Dict, List, Optional, Set, Any

from django.db.models.signals import pre_save, post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist

from .models import Contact, Deal, AuditEntry, DataSubjectRequest, ConsentStatus
from .audit_logger import (
    ComplianceAuditLogger, AuditContext, FieldChange,\    get_audit_logger, AuditEventType, GDPRLegalBasis,
)

logger = logging.getLogger('jolhub.crm.signals')

# Thread-local storage for tracking field changes
_changes_context: Dict[int, Dict[str, Any]] = {}


def _get_previous_instance(instance) -> Optional[Any]:
    """Get the previous state of an instance from database."""
    if instance.pk is None:
        return None
    try:
        return instance.__class__.objects.get(pk=instance.pk)
    except ObjectDoesNotExist:
        return None


def _calculate_field_changes(
    old_instance: Optional[Any],
    new_instance: Any,
    tracked_fields: Optional[Set[str]] = None
) -> List[FieldChange]:
    """Calculate field-level changes between old and new instance."""
    changes = []
    
    if old_instance is None:
        # New instance - all fields are "new"
        return changes
    
    for field in new_instance._meta.fields:
        field_name = field.name
        
        # Skip fields we don't want to track
        if tracked_fields and field_name not in tracked_fields:
            continue
        
        # Skip auto-managed fields
        if field_name in ('id', 'created_at', 'updated_at', 'record_hash', 'previous_hash'):
            continue
        
        try:
            old_value = getattr(old_instance, field_name)
            new_value = getattr(new_instance, field_name)
            
            if old_value != new_value:
                changes.append(FieldChange(
                    field_name=field_name,
                    old_value=old_value,
                    new_value=new_value,
                ))
        except Exception as e:
            logger.debug(f"Error tracking field {field_name}: {e}")
    
    return changes


# =============================================================================
# PRE-SAVE SIGNALS - Capture previous state
# =============================================================================

@receiver(pre_save, sender=Contact)
def capture_contact_previous_state(sender, instance, **kwargs):
    """Capture previous state for change tracking."""
    if instance.pk:
        previous = _get_previous_instance(instance)
        if previous:
            _changes_context[('contact', instance.pk)] = {
                'previous': previous,
                'consent_status': previous.consent_status,
            }


@receiver(pre_save, sender=Deal)
def capture_deal_previous_state(sender, instance, **kwargs):
    """Capture previous state for change tracking."""
    if instance.pk:
        previous = _get_previous_instance(instance)
        if previous:
            _changes_context[('deal', instance.pk)] = {
                'previous': previous,
                'stage': previous.stage,
            }


# =============================================================================
# POST-SAVE SIGNALS - Log creation/update
# =============================================================================

@receiver(post_save, sender=Contact)
def contact_created_or_updated(sender, instance, created, **kwargs):
    """Log contact creation/update with field-level change tracking."""
    audit_logger = get_audit_logger()
    context = AuditContext(
        tenant_id=str(instance.organization_id) if instance.organization_id else None,
    )
    
    if created:
        # Log creation
        audit_logger.log_create(
            instance=instance,
            context=context,
            details={
                'full_name': instance.full_name,
                'email': instance.email,
                'data_classification': instance.data_classification,
                'religious_affiliation': instance.religious_affiliation if instance.religious_affiliation else None,
            },
        )
    else:
        # Get previous state and calculate changes
        context_key = ('contact', instance.pk)
        previous_data = _changes_context.pop(context_key, {})
        previous_instance = previous_data.get('previous')
        
        field_changes = _calculate_field_changes(previous_instance, instance)
        
        if field_changes:
            audit_logger.log_update(
                instance=instance,
                field_changes=field_changes,
                context=context,
                details={
                    'full_name': instance.full_name,
                    'email': instance.email,
                },
            )
        
        
        # Check for consent status change
        old_consent = previous_data.get('consent_status')
        if old_consent and old_consent != instance.consent_status:
            audit_logger.log_consent_change(
                instance=instance,
                old_status=old_consent,
                new_status=instance.consent_status,
                context=context,
                details={
                    'consent_version': instance.consent_version,
                },
            )


@receiver(post_save, sender=Deal)
def deal_created_or_updated(sender, instance, created, **kwargs):
    """Log deal creation/update with field-level change tracking."""
    audit_logger = get_audit_logger()
    context = AuditContext(
        tenant_id=str(instance.organization_id) if instance.organization_id else None,
    )
    
    if created:
        # Log creation
        audit_logger.log_create(
            instance=instance,
            context=context,
            details={
                'deal_number': instance.deal_number,
                'deal_type': instance.deal_type,
                'amount': str(instance.amount),
                'currency': instance.currency,
                'stage': instance.stage,
            },
        )
    else:
        # Get previous state and calculate changes
        context_key = ('deal', instance.pk)
        previous_data = _changes_context.pop(context_key, {})
        previous_instance = previous_data.get('previous')
        
        field_changes = _calculate_field_changes(previous_instance, instance)
        
        if field_changes:
            audit_logger.log_update(
                instance=instance,
                field_changes=field_changes,
                context=context,
                details={
                    'deal_number': instance.deal_number,
                    'deal_type': instance.deal_type,
                    'amount': str(instance.amount),
                },
            )
        
        
        # Check for stage change to paid (financial transaction)
        old_stage = previous_data.get('stage')
        if old_stage and old_stage != instance.stage:
            if instance.stage == Deal.DealStage.PAID:
                audit_logger.log_financial_transaction(
                    transaction_type='payment',
                    instance=instance,
                    amount=instance.amount,
                    currency=instance.currency,
                    context=context,
                    details={
                        'deal_number': instance.deal_number,
                        'payment_method': instance.payment_method,
                        'transaction_id': instance.transaction_id,
                    },
                )
            elif instance.stage == Deal.DealStage.REFUNDED:
                audit_logger.log_financial_transaction(
                    transaction_type='refund',
                    instance=instance,
                    amount=instance.paid_amount,
                    currency=instance.currency,
                    context=context,
                    details={
                        'deal_number': instance.deal_number,
                    },
                )


@receiver(post_save, sender=DataSubjectRequest)
def dsr_created_or_updated(sender, instance, created, **kwargs):
    """Log GDPR data subject request operations."""
    audit_logger = get_audit_logger()
    context = AuditContext(
        tenant_id=str(instance.organization_id) if instance.organization_id else None,
    )
    
    if created:
        audit_logger.log_gdpr_request(
            request_type=instance.request_type,
            data_subject_id=str(instance.id),
            organization_id=str(instance.organization_id),
            context=context,
            details={
                'requester_email': instance.requester_email,
                'requester_name': instance.requester_name,
                'due_date': instance.due_date.isoformat() if instance.due_date else None,
            },
        )
    elif instance.status == DataSubjectRequest.Status.COMPLETED:
        audit_logger.log_gdpr_request(
            request_type=f'{instance.request_type}_completed',
            data_subject_id=str(instance.id),
            organization_id=str(instance.organization_id),
            context=context,
            details={
                'requester_email': instance.requester_email,
                'completed_at': instance.completed_at.isoformat() if instance.completed_at else None,
            },
        )


# =============================================================================
# POST-DELETE SIGNALS - Log deletion
# =============================================================================

@receiver(post_delete, sender=Contact)
def contact_deleted(sender, instance, **kwargs):
    """Log contact deletion to audit trail."""
    audit_logger = get_audit_logger()
    context = AuditContext(
        tenant_id=str(instance.organization_id) if instance.organization_id else None,
    )
    
    audit_logger.log_delete(
        instance=instance,
        context=context,
        details={
            'full_name': instance.full_name,
            'email': instance.email,
            'legal_hold_was_active': instance.legal_hold,
        },
    )


@receiver(post_delete, sender=Deal)
def deal_deleted(sender, instance, **kwargs):
    """Log deal deletion to audit trail."""
    audit_logger = get_audit_logger()
    context = AuditContext(
        tenant_id=str(instance.organization_id) if instance.organization_id else None,
    )
    
    audit_logger.log_delete(
        instance=instance,
        context=context,
        details={
            'deal_number': instance.deal_number,
            'deal_type': instance.deal_type,
            'amount': str(instance.amount),
            'stage': instance.stage,
        },
    )
