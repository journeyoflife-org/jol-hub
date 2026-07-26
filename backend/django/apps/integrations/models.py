"""
Integration models — records outbound API calls and incoming webhooks
for payment gateways, email services, and third-party systems.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class WebhookEvent(BaseModel):
    """Stores incoming webhook payloads for idempotent processing."""

    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_PROCESSED = 'processed'
    STATUS_FAILED = 'failed'
    STATUS_IGNORED = 'ignored'

    STATUS_CHOICES = [
        (STATUS_PENDING, _('Pending')),
        (STATUS_PROCESSING, _('Processing')),
        (STATUS_PROCESSED, _('Processed')),
        (STATUS_FAILED, _('Failed')),
        (STATUS_IGNORED, _('Ignored')),
    ]

    source = models.CharField(_('source'), max_length=64, db_index=True)
    event_type = models.CharField(_('event type'), max_length=128, db_index=True)
    idempotency_key = models.CharField(
        _('idempotency key'), max_length=255, unique=True, db_index=True,
    )
    payload = models.JSONField(_('payload'), default=dict)
    status = models.CharField(_('status'), max_length=16,
                               choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    error = models.TextField(_('error'), blank=True)
    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)

    class Meta:
        verbose_name = _('webhook event')
        verbose_name_plural = _('webhook events')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.source}:{self.event_type} ({self.status})'


class OutboundRequest(BaseModel):
    """Audit record of an outbound API call to a third-party service."""

    service = models.CharField(_('service'), max_length=64, db_index=True)
    method = models.CharField(_('HTTP method'), max_length=8)
    url = models.URLField(_('URL'))
    request_payload = models.JSONField(_('request payload'), default=dict)
    response_status = models.PositiveSmallIntegerField(_('response status'), null=True, blank=True)
    response_payload = models.JSONField(_('response payload'), default=dict)
    duration_ms = models.PositiveIntegerField(_('duration (ms)'), null=True, blank=True)
    error = models.TextField(_('error'), blank=True)

    class Meta:
        verbose_name = _('outbound request')
        verbose_name_plural = _('outbound requests')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.method} {self.url} → {self.response_status}'
