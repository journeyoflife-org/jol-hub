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

    ACTION_CHOICES = [
        (ACTION_CREATE, _('Create')),
        (ACTION_UPDATE, _('Update')),
        (ACTION_DELETE, _('Delete')),
        (ACTION_READ, _('Read')),
        (ACTION_EXPORT, _('Export')),
    ]

    user_id = models.UUIDField(_('user ID'), null=True, blank=True, db_index=True)
    action = models.CharField(_('action'), max_length=16, choices=ACTION_CHOICES, db_index=True)
    entity_type = models.CharField(_('entity type'), max_length=128, db_index=True)
    entity_id = models.CharField(_('entity ID'), max_length=128, db_index=True)
    field_changes = models.JSONField(_('field changes'), default=dict)
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    user_agent = models.TextField(_('user agent'), blank=True)
    correlation_id = models.UUIDField(_('correlation ID'), null=True, blank=True, db_index=True)
    extra = models.JSONField(_('extra data'), default=dict)

    class Meta:
        verbose_name = _('audit log')
        verbose_name_plural = _('audit logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['user_id', 'created_at']),
        ]

    def __str__(self):
        return f'{self.action} {self.entity_type}({self.entity_id}) by user {self.user_id}'
