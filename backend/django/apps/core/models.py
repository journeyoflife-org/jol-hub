"""
Core abstract models providing common fields and behaviour
reused across all JOL-HUB apps.
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class TimeStampedModel(models.Model):
    """Abstract base model that stores creation and last-modified timestamps."""

    created_at = models.DateTimeField(_('created at'), auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_at']


class UUIDModel(models.Model):
    """Abstract base model that uses a UUID as primary key."""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        verbose_name=_('ID'),
    )

    class Meta:
        abstract = True


class BaseModel(UUIDModel, TimeStampedModel):
    """
    Composite abstract model combining UUID primary key,
    timestamps and soft-delete support.

    All domain models should extend this.
    """

    is_active = models.BooleanField(_('active'), default=True, db_index=True)
    is_deleted = models.BooleanField(_('deleted'), default=False, db_index=True)
    deleted_at = models.DateTimeField(_('deleted at'), null=True, blank=True)

    class Meta:
        abstract = True

    def soft_delete(self):
        """Mark this record as deleted without removing from database."""
        from django.utils import timezone
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'is_active', 'deleted_at', 'updated_at'])

    def restore(self):
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.is_active = True
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'is_active', 'deleted_at', 'updated_at'])


class AuditLog(UUIDModel, TimeStampedModel):
    """
    Immutable audit trail for all data changes.
    GDPR Article 5(2) — accountability.
    """

    ACTION_CREATE = 'CREATE'
    ACTION_UPDATE = 'UPDATE'
    ACTION_DELETE = 'DELETE'
    ACTION_READ = 'READ'
    ACTION_EXPORT = 'EXPORT'
    ACTION_REFUND = 'REFUND'
    ACTION_ACCESS = 'ACCESS'
    ACTION_ERASURE = 'ERASURE'
    # GDPR Data Subject Request actions
    ACTION_DSR_ACCESS = 'DSR_ACCESS'       # Art. 15 - Right of access
    ACTION_DSR_RECTIFY = 'DSR_RECTIFY'     # Art. 16 - Right to rectification
    ACTION_DSR_ERASE = 'DSR_ERASE'         # Art. 17 - Right to erasure
    ACTION_DSR_RESTRICT = 'DSR_RESTRICT'   # Art. 18 - Right to restriction
    ACTION_DSR_PORTABILITY = 'DSR_PORTABILITY'  # Art. 20 - Right to portability
    ACTION_DSR_OBJECT = 'DSR_OBJECT'       # Art. 21 - Right to object
    # Consent actions
    ACTION_CONSENT_GIVEN = 'CONSENT_GIVEN'
    ACTION_CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN'
    # Legal hold actions
    ACTION_LEGAL_HOLD_APPLIED = 'LEGAL_HOLD_APPLIED'
    ACTION_LEGAL_HOLD_RELEASED = 'LEGAL_HOLD_RELEASED'
    # Financial actions
    ACTION_DONATION = 'DONATION'
    ACTION_PAYMENT = 'PAYMENT'

    ACTION_CHOICES = [
        (ACTION_CREATE, _('Create')),
        (ACTION_UPDATE, _('Update')),
        (ACTION_DELETE, _('Delete')),
        (ACTION_READ, _('Read')),
        (ACTION_EXPORT, _('Export')),
        (ACTION_REFUND, _('Refund')),
        (ACTION_ACCESS, _('Data Access')),
        (ACTION_ERASURE, _('Data Erasure')),
        # GDPR DSR
        (ACTION_DSR_ACCESS, _('DSR - Access Request')),
        (ACTION_DSR_RECTIFY, _('DSR - Rectification')),
        (ACTION_DSR_ERASE, _('DSR - Erasure Request')),
        (ACTION_DSR_RESTRICT, _('DSR - Restriction')),
        (ACTION_DSR_PORTABILITY, _('DSR - Data Portability')),
        (ACTION_DSR_OBJECT, _('DSR - Objection')),
        # Consent
        (ACTION_CONSENT_GIVEN, _('Consent Given')),
        (ACTION_CONSENT_WITHDRAWN, _('Consent Withdrawn')),
        # Legal hold
        (ACTION_LEGAL_HOLD_APPLIED, _('Legal Hold Applied')),
        (ACTION_LEGAL_HOLD_RELEASED, _('Legal Hold Released')),
        # Financial
        (ACTION_DONATION, _('Donation')),
        (ACTION_PAYMENT, _('Payment')),
    ]

    user_id = models.UUIDField(_('user ID'), null=True, blank=True, db_index=True)
    action = models.CharField(_('action'), max_length=24, choices=ACTION_CHOICES, db_index=True)
    entity_type = models.CharField(_('entity type'), max_length=128, db_index=True)
    entity_id = models.CharField(_('entity ID'), max_length=128, db_index=True)
    field_changes = models.JSONField(_('field changes'), default=dict)
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    user_agent = models.TextField(_('user agent'), blank=True)
    correlation_id = models.UUIDField(_('correlation ID'), null=True, blank=True, db_index=True)
    # GDPR compliance fields
    organization_id = models.UUIDField(_('organization ID'), null=True, blank=True, db_index=True)
    consent_reference = models.CharField(_('consent reference'), max_length=64, blank=True)
    legal_basis = models.CharField(_('legal basis'), max_length=32, blank=True)
    data_subject_id = models.CharField(_('data subject ID'), max_length=128, blank=True, db_index=True)
    # Tamper-evident checksum
    checksum = models.CharField(_('checksum'), max_length=64, blank=True)
    extra = models.JSONField(_('extra data'), default=dict)

    class Meta:
        verbose_name = _('audit log')
        verbose_name_plural = _('audit logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user_id', 'created_at']),
            models.Index(fields=['organization_id', 'created_at']),
            models.Index(fields=['data_subject_id', 'action']),
        ]

    def __str__(self):
        return f'{self.action} {self.entity_type}({self.entity_id}) by user {self.user_id}'

    def save(self, *args, **kwargs):
        """Generate tamper-evident checksum on save."""
        if not self.checksum:
            import hashlib
            import json
            data = f"{self.id}:{self.user_id}:{self.action}:{self.entity_type}:{self.entity_id}:{self.created_at}"
            self.checksum = hashlib.sha256(data.encode()).hexdigest()
        super().save(*args, **kwargs)

    def verify_integrity(self) -> bool:
        """Verify audit log entry integrity."""
        if not self.checksum:
            return False
        import hashlib
        data = f"{self.id}:{self.user_id}:{self.action}:{self.entity_type}:{self.entity_id}:{self.created_at}"
        expected = hashlib.sha256(data.encode()).hexdigest()
        return self.checksum == expected

    @classmethod
    def log_dsr(cls, action: str, data_subject_id: str, organization_id: str, user_id=None, extra=None):
        """Log a GDPR Data Subject Request action."""
        return cls.objects.create(
            action=action,
            entity_type='data_subject',
            entity_id=data_subject_id,
            data_subject_id=data_subject_id,
            organization_id=organization_id,
            user_id=user_id,
            legal_basis='gdpr_art_15_22',
            extra=extra or {},
        )
