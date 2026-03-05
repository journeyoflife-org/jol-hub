"""
Organization domain models — religious institutions and their membership.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Organization(BaseModel):
    """A religious institution (church, parish, monastery, etc.)."""

    TYPE_CHURCH = 'church'
    TYPE_MONASTERY = 'monastery'
    TYPE_CHAPEL = 'chapel'
    TYPE_SHRINE = 'shrine'
    TYPE_CATHEDRAL = 'cathedral'
    TYPE_PARISH = 'parish'

    TYPE_CHOICES = [
        (TYPE_CHURCH, _('Church')),
        (TYPE_MONASTERY, _('Monastery')),
        (TYPE_CHAPEL, _('Chapel')),
        (TYPE_SHRINE, _('Shrine')),
        (TYPE_CATHEDRAL, _('Cathedral')),
        (TYPE_PARISH, _('Parish')),
    ]

    STATUS_ACTIVE = 'active'
    STATUS_INACTIVE = 'inactive'
    STATUS_PENDING = 'pending'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, _('Active')),
        (STATUS_INACTIVE, _('Inactive')),
        (STATUS_PENDING, _('Pending')),
    ]

    name = models.CharField(_('name'), max_length=255, db_index=True)
    slug = models.SlugField(_('slug'), max_length=255, unique=True)
    org_type = models.CharField(_('type'), max_length=20, choices=TYPE_CHOICES, db_index=True)
    status = models.CharField(_('status'), max_length=20,
                               choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    country = models.CharField(_('country'), max_length=2, db_index=True)
    description = models.TextField(_('description'), blank=True)
    logo = models.ImageField(_('logo'), upload_to='org_logos/', null=True, blank=True)

    # Address
    address_street = models.CharField(_('street'), max_length=255, blank=True)
    address_city = models.CharField(_('city'), max_length=128, blank=True)
    address_postal_code = models.CharField(_('postal code'), max_length=16, blank=True)

    # Contact
    email = models.EmailField(_('email'), blank=True)
    phone = models.CharField(_('phone'), max_length=32, blank=True)
    website = models.URLField(_('website'), blank=True)

    # Owner / primary admin
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='owned_organizations',
        verbose_name=_('owner'),
    )

    # Geolocation
    latitude = models.DecimalField(_('latitude'), max_digits=9, decimal_places=6,
                                    null=True, blank=True)
    longitude = models.DecimalField(_('longitude'), max_digits=9, decimal_places=6,
                                     null=True, blank=True)

    extra = models.JSONField(_('extra'), default=dict)

    class Meta:
        verbose_name = _('organization')
        verbose_name_plural = _('organizations')
        ordering = ['name']
        indexes = [
            models.Index(fields=['country', 'status']),
            models.Index(fields=['org_type', 'status']),
        ]

    def __str__(self):
        return f'{self.name} ({self.country})'


class OrganizationMember(BaseModel):
    """Junction table — links Users to Organizations with a role."""

    ROLE_ADMIN = 'admin'
    ROLE_EDITOR = 'editor'
    ROLE_VIEWER = 'viewer'

    ROLE_CHOICES = [
        (ROLE_ADMIN, _('Admin')),
        (ROLE_EDITOR, _('Editor')),
        (ROLE_VIEWER, _('Viewer')),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='members', verbose_name=_('organization'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='organization_memberships',
        verbose_name=_('user'),
    )
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    joined_at = models.DateTimeField(_('joined at'), auto_now_add=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='sent_invitations',
        verbose_name=_('invited by'),
    )

    class Meta:
        verbose_name = _('organization member')
        verbose_name_plural = _('organization members')
        unique_together = [('organization', 'user')]
        ordering = ['organization', 'user']

    def __str__(self):
        return f'{self.user} @ {self.organization} ({self.role})'


class Website(BaseModel):
    """Website configuration attached to an Organization."""

    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE,
        related_name='site', verbose_name=_('organization'),
    )
    domain = models.CharField(_('domain'), max_length=255, unique=True, blank=True)
    theme = models.CharField(_('theme'), max_length=64, default='default')
    default_language = models.CharField(_('default language'), max_length=8, default='en')
    languages = models.JSONField(_('languages'), default=list)
    ssl_enabled = models.BooleanField(_('SSL enabled'), default=True)
    analytics_id = models.CharField(_('analytics ID'), max_length=64, blank=True)
    custom_css = models.TextField(_('custom CSS'), blank=True)
    settings = models.JSONField(_('settings'), default=dict)

    class Meta:
        verbose_name = _('website')
        verbose_name_plural = _('websites')

    def __str__(self):
        return self.domain or f'Website of {self.organization}'
