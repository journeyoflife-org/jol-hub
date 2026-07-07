"""
Analytics models — page-view events and daily aggregated statistics.
"""

from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import UUIDModel, TimeStampedModel
from apps.organizations.models import Organization


class PageView(UUIDModel, TimeStampedModel):
    """
    A single page-view event.
    Stored in raw form; nightly job aggregates into DailyStats.
    IP addresses are anonymised (last octet zeroed) for GDPR.
    
    GDPR Art. 7, Art. 13 - Consent tracking:
    - consent_given: Whether user consented to analytics tracking
    - Only page views with consent_given=True should be aggregated
    """

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='page_views', verbose_name=_('organization'),
        db_index=True,
    )
    page_path = models.CharField(_('page path'), max_length=512)
    referrer = models.CharField(_('referrer'), max_length=512, blank=True)
    user_agent = models.CharField(_('user agent'), max_length=512, blank=True)
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    session_id = models.CharField(_('session ID'), max_length=64, blank=True, db_index=True)
    country_code = models.CharField(_('country code'), max_length=2, blank=True)
    language = models.CharField(_('language'), max_length=8, blank=True)
    device_type = models.CharField(
        _('device type'), max_length=16,
        choices=[('desktop', 'Desktop'), ('mobile', 'Mobile'), ('tablet', 'Tablet')],
        blank=True,
    )
    duration_seconds = models.PositiveIntegerField(_('duration (s)'), null=True, blank=True)
    consent_given = models.BooleanField(
        _('consent given'),
        default=False,
        db_index=True,
        help_text=_('GDPR Art. 7: User consented to analytics tracking'),
    )
    consent_version = models.CharField(
        _('consent version'),
        max_length=32,
        blank=True,
        help_text=_('Version of consent banner shown to user'),
    )

    class Meta:
        verbose_name = _('page view')
        verbose_name_plural = _('page views')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'created_at']),
            models.Index(fields=['organization', 'consent_given']),
            models.Index(fields=['consent_given', 'created_at']),
        ]

    def __str__(self):
        return f'{self.page_path} @ {self.created_at:%Y-%m-%d %H:%M}'

    def save(self, *args, **kwargs):
        """
        Save with tenant context validation.
        
        SOC2 CC6.2 / GDPR Article 32 - Prevents cross-tenant analytics manipulation.
        """
        self._validate_tenant_context()
        super().save(*args, **kwargs)

    def _validate_tenant_context(self):
        """
        Validate that the organization matches current tenant context.
        
        Prevents cross-tenant analytics manipulation.
        """
        import logging
        logger = logging.getLogger('jolhub.tenant_validation')
        
        if not self.organization_id:
            return
        
        try:
            from apps.crm.middleware import get_current_tenant_id
            tenant_id = get_current_tenant_id()
            
            if tenant_id and str(self.organization_id) != str(tenant_id):
                logger.error(
                    f"Cross-tenant pageview attempt: context_tenant={tenant_id}, "
                    f"target_org={self.organization_id}"
                )
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    "Organization does not match current tenant context"
                )
        except ImportError:
            pass
        except Exception as e:
            logger.debug(f"Tenant validation skipped: {e}")


class DailyStats(UUIDModel, TimeStampedModel):
    """Pre-aggregated daily statistics per Organisation."""

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='daily_stats', verbose_name=_('organization'),
        db_index=True,
    )
    date = models.DateField(_('date'), db_index=True)
    page_views = models.PositiveIntegerField(_('page views'), default=0)
    unique_visitors = models.PositiveIntegerField(_('unique visitors'), default=0)
    sessions = models.PositiveIntegerField(_('sessions'), default=0)
    bounce_rate = models.DecimalField(_('bounce rate'), max_digits=5, decimal_places=2, default=0)
    avg_session_duration = models.PositiveIntegerField(_('avg session duration (s)'), default=0)
    new_visitors = models.PositiveIntegerField(_('new visitors'), default=0)
    total_donations = models.DecimalField(
        _('total donations'), max_digits=12, decimal_places=2, default=0,
    )
    donation_count = models.PositiveIntegerField(_('donation count'), default=0)

    class Meta:
        verbose_name = _('daily stats')
        verbose_name_plural = _('daily stats')
        unique_together = [('organization', 'date')]
        ordering = ['-date']

    def __str__(self):
        return f'{self.organization} — {self.date}'

    def save(self, *args, **kwargs):
        """
        Save with tenant context validation.
        
        SOC2 CC6.2 / GDPR Article 32 - Prevents cross-tenant stats manipulation.
        """
        self._validate_tenant_context()
        super().save(*args, **kwargs)

    def _validate_tenant_context(self):
        """
        Validate that the organization matches current tenant context.
        
        Prevents cross-tenant stats manipulation.
        """
        import logging
        logger = logging.getLogger('jolhub.tenant_validation')
        
        if not self.organization_id:
            return
        
        try:
            from apps.crm.middleware import get_current_tenant_id
            tenant_id = get_current_tenant_id()
            
            if tenant_id and str(self.organization_id) != str(tenant_id):
                logger.error(
                    f"Cross-tenant dailystats attempt: context_tenant={tenant_id}, "
                    f"target_org={self.organization_id}"
                )
                from django.core.exceptions import ValidationError
                raise ValidationError(
                    "Organization does not match current tenant context"
                )
        except ImportError:
            pass
        except Exception as e:
            logger.debug(f"Tenant validation skipped: {e}")
