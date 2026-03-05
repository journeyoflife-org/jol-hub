"""
Financial models — invoices, VAT records, and payout tracking
for organisation settlement flows.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel
from apps.organizations.models import Organization


class Invoice(BaseModel):
    """Platform invoice issued to or by an organization."""

    STATUS_DRAFT = 'draft'
    STATUS_ISSUED = 'issued'
    STATUS_PAID = 'paid'
    STATUS_OVERDUE = 'overdue'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_DRAFT, _('Draft')),
        (STATUS_ISSUED, _('Issued')),
        (STATUS_PAID, _('Paid')),
        (STATUS_OVERDUE, _('Overdue')),
        (STATUS_CANCELLED, _('Cancelled')),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT,
        related_name='invoices', verbose_name=_('organization'),
    )
    invoice_number = models.CharField(_('invoice number'), max_length=64, unique=True)
    status = models.CharField(_('status'), max_length=20,
                               choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    issue_date = models.DateField(_('issue date'))
    due_date = models.DateField(_('due date'))
    paid_date = models.DateField(_('paid date'), null=True, blank=True)
    currency = models.CharField(_('currency'), max_length=3, default='EUR')
    subtotal = models.DecimalField(_('subtotal'), max_digits=12, decimal_places=2)
    vat_rate = models.DecimalField(_('VAT rate (%)'), max_digits=5, decimal_places=2, default=0)
    vat_amount = models.DecimalField(_('VAT amount'), max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(_('total'), max_digits=12, decimal_places=2)
    notes = models.TextField(_('notes'), blank=True)
    line_items = models.JSONField(_('line items'), default=list)

    class Meta:
        verbose_name = _('invoice')
        verbose_name_plural = _('invoices')
        ordering = ['-issue_date']

    def __str__(self):
        return f'{self.invoice_number} — {self.organization} ({self.status})'


class Payout(BaseModel):
    """Settlement payout from platform to an organisation."""

    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, _('Pending')),
        (STATUS_PROCESSING, _('Processing')),
        (STATUS_COMPLETED, _('Completed')),
        (STATUS_FAILED, _('Failed')),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.PROTECT,
        related_name='payouts', verbose_name=_('organization'),
    )
    amount = models.DecimalField(_('amount'), max_digits=12, decimal_places=2)
    currency = models.CharField(_('currency'), max_length=3, default='EUR')
    status = models.CharField(_('status'), max_length=20,
                               choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    bank_account_last4 = models.CharField(_('bank account (last 4)'), max_length=4, blank=True)
    reference = models.CharField(_('reference'), max_length=255, blank=True)
    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)

    class Meta:
        verbose_name = _('payout')
        verbose_name_plural = _('payouts')
        ordering = ['-created_at']

    def __str__(self):
        return f'Payout {self.amount} {self.currency} → {self.organization} ({self.status})'
