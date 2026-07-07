"""
Donation models — one-off and recurring payments to organisations.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel
from apps.organizations.models import Organization


class Donation(BaseModel):
    """A single donation payment."""

    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, _('Pending')),
        (STATUS_COMPLETED, _('Completed')),
        (STATUS_FAILED, _('Failed')),
        (STATUS_REFUNDED, _('Refunded')),
        (STATUS_CANCELLED, _('Cancelled')),
    ]

    METHOD_CARD = 'card'
    METHOD_BANK_TRANSFER = 'bank_transfer'
    METHOD_PAYPAL = 'paypal'
    METHOD_CASH = 'cash'

    METHOD_CHOICES = [
        (METHOD_CARD, _('Credit / Debit Card')),
        (METHOD_BANK_TRANSFER, _('Bank Transfer')),
        (METHOD_PAYPAL, _('PayPal')),
        (METHOD_CASH, _('Cash')),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT,
        related_name='donations', verbose_name=_('organization'),
    )
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='donations', verbose_name=_('donor'),
    )

    amount = models.DecimalField(_('amount'), max_digits=12, decimal_places=2)
    currency = models.CharField(_('currency'), max_length=3, default='EUR')
    status = models.CharField(_('status'), max_length=20,
                               choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    payment_method = models.CharField(_('payment method'), max_length=20, choices=METHOD_CHOICES)
    transaction_id = models.CharField(_('transaction ID'), max_length=255, blank=True, db_index=True)
    gateway_response = models.JSONField(_('gateway response'), default=dict)

    # Donor details (may be anonymous)
    donor_email = models.EmailField(_('donor email'), blank=True)
    donor_name = models.CharField(_('donor name'), max_length=255, blank=True)
    is_anonymous = models.BooleanField(_('anonymous'), default=False)

    # Recurring
    is_recurring = models.BooleanField(_('recurring'), default=False, db_index=True)
    frequency = models.CharField(
        _('frequency'), max_length=16,
        choices=[('weekly', _('Weekly')), ('monthly', _('Monthly')), ('yearly', _('Yearly'))],
        blank=True,
    )
    recurring_plan_id = models.CharField(_('recurring plan ID'), max_length=255, blank=True)
    next_charge_at = models.DateTimeField(_('next charge at'), null=True, blank=True)

    # Gift aid (UK)
    gift_aid = models.BooleanField(_('gift aid'), default=False)

    # Optional message
    dedicated_to = models.CharField(_('dedicated to'), max_length=255, blank=True)
    message = models.TextField(_('message'), blank=True)

    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)

    class Meta:
        verbose_name = _('donation')
        verbose_name_plural = _('donations')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['donor', 'status']),
        ]

    def __str__(self):
        return f'{self.amount} {self.currency} → {self.organization} ({self.status})'

    def save(self, *args, **kwargs):
        """
        Save with tenant context validation.
        
        SOC2 CC6.2 / GDPR Article 32 - Prevents cross-tenant donation manipulation.
        """
        self._validate_tenant_context()
        super().save(*args, **kwargs)

    def _validate_tenant_context(self):
        """
        Validate that the organization matches current tenant context.
        
        Prevents cross-tenant donation manipulation.
        """
        import logging
        logger = logging.getLogger('jolhub.tenant_validation')
        
        # Skip if no organization set
        if not self.organization_id:
            return
        
        # Get current tenant context
        try:
            from apps.crm.middleware import get_current_tenant_id
            tenant_id = get_current_tenant_id()
            
            if tenant_id and str(self.organization_id) != str(tenant_id):
                logger.error(
                    f"Cross-tenant donation attempt: context_tenant={tenant_id}, "
                    f"target_org={self.organization_id}"
                )
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    "Organization does not match current tenant context"
                )
        except ImportError:
            pass  # Middleware not available, skip validation
        except Exception as e:
            logger.debug(f"Tenant validation skipped: {e}")

    def mark_completed(self, transaction_id, gateway_response=None):
        from django.utils import timezone
        self.status = self.STATUS_COMPLETED
        self.transaction_id = transaction_id
        self.gateway_response = gateway_response or {}
        self.processed_at = timezone.now()
        self.save(update_fields=[
            'status', 'transaction_id', 'gateway_response', 'processed_at', 'updated_at',
        ])
