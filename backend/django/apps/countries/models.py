"""
Country configuration models — per-country platform settings,
legal requirements, and supported payment methods.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Country(BaseModel):
    """
    Platform-level configuration for each of the 27 supported EU countries.
    Populated via data migration; rarely changes at runtime.
    """

    code = models.CharField(_('ISO code'), max_length=2, unique=True, db_index=True)
    name = models.CharField(_('name'), max_length=128)
    native_name = models.CharField(_('native name'), max_length=128, blank=True)
    currency = models.CharField(_('currency'), max_length=3, default='EUR')
    default_language = models.CharField(_('default language'), max_length=8)
    timezone = models.CharField(_('timezone'), max_length=64, default='UTC')
    gdpr_consent_age = models.PositiveSmallIntegerField(_('GDPR consent age'), default=16)
    vat_rate = models.DecimalField(_('VAT rate (%)'), max_digits=5, decimal_places=2, default=0)
    supervisory_authority = models.CharField(
        _('data supervisory authority'), max_length=255, blank=True,
    )
    supervisory_authority_url = models.URLField(_('authority URL'), blank=True)
    supported_payment_methods = models.JSONField(_('payment methods'), default=list)
    feature_flags = models.JSONField(_('feature flags'), default=dict)

    class Meta:
        verbose_name = _('country')
        verbose_name_plural = _('countries')
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.code})'
