"""
Organization domain models — religious institutions and their membership.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel


class Organization(BaseModel):
    """A religious institution (church, parish, monastery, etc.)."""

    # Catholic entity types
    TYPE_CHURCH = 'church'
    TYPE_MONASTERY = 'monastery'
    TYPE_CHAPEL = 'chapel'
    TYPE_SHRINE = 'shrine'
    TYPE_CATHEDRAL = 'cathedral'
    TYPE_PARISH = 'parish'
    TYPE_BASILICA = 'basilica'
    TYPE_DIOCESE = 'diocese'
    TYPE_DEANERY = 'deanery'

    # Non-Catholic Christian types
    TYPE_CHURCH_PROTESTANT = 'church_protestant'
    TYPE_CHURCH_ORTHODOX = 'church_orthodox'
    TYPE_CHURCH_OTHER = 'church_other'

    # Commercial service types
    TYPE_FUNERAL_SERVICE = 'funeral_service'
    TYPE_CEMETERY_SERVICE = 'cemetery_service'

    TYPE_CHOICES = [
        # Catholic entities
        (TYPE_BASILICA, _('Basilica')),
        (TYPE_CATHEDRAL, _('Cathedral')),
        (TYPE_DIOCESE, _('Diocese')),
        (TYPE_DEANERY, _('Deanery')),
        (TYPE_CHURCH, _('Church')),
        (TYPE_PARISH, _('Parish')),
        (TYPE_MONASTERY, _('Monastery')),
        (TYPE_CHAPEL, _('Chapel')),
        (TYPE_SHRINE, _('Shrine')),
        # Non-Catholic Christian
        (TYPE_CHURCH_PROTESTANT, _('Protestant Church')),
        (TYPE_CHURCH_ORTHODOX, _('Orthodox Church')),
        (TYPE_CHURCH_OTHER, _('Other Christian Church')),
        # Commercial services
        (TYPE_FUNERAL_SERVICE, _('Funeral Service')),
        (TYPE_CEMETERY_SERVICE, _('Cemetery Service')),
    ]

    # Compliance level choices
    COMPLIANCE_GDPR = 'gdpr'
    COMPLIANCE_SOC2_GDPR = 'soc2_gdpr'
    COMPLIANCE_SOC2_GDPR_PCI = 'soc2_gdpr_pci'
    COMPLIANCE_CANONICAL = 'canonical'  # Canon Law + GDPR

    COMPLIANCE_CHOICES = [
        (COMPLIANCE_GDPR, _('GDPR Only')),
        (COMPLIANCE_SOC2_GDPR, _('SOC2 + GDPR')),
        (COMPLIANCE_SOC2_GDPR_PCI, _('SOC2 + GDPR + PCI-DSS')),
        (COMPLIANCE_CANONICAL, _('Canon Law + GDPR')),
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

    # Hierarchical relationships (4-tier RBAC: Diocese -> Deanery -> Parish/Church)
    parent_diocese = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='child_organizations',
        limit_choices_to={'org_type__in': ['diocese', 'deanery']},
        verbose_name=_('parent diocese/deanery'),
        help_text=_('Parent organization in diocesan hierarchy'),
    )

    # Bitrix24 CRM integration
    bitrix24_portal_id = models.CharField(
        _('Bitrix24 Portal ID'), max_length=64, blank=True,
        help_text=_('Bitrix24 portal domain for CRM integration'),
    )
    bitrix24_webhook_url = models.TextField(
        _('Bitrix24 Webhook URL'), blank=True,
        help_text=_('Incoming webhook URL for Bitrix24 API'),
    )
    bitrix24_contact_group_id = models.PositiveIntegerField(
        _('Bitrix24 Contact Group ID'), null=True, blank=True,
        help_text=_('Contact group ID in Bitrix24 CRM'),
    )

    # Compliance configuration
    compliance_level = models.CharField(
        _('compliance level'), max_length=20,
        choices=COMPLIANCE_CHOICES, default=COMPLIANCE_GDPR,
        help_text=_('Applicable compliance framework'),
    )
    canonical_records = models.BooleanField(
        _('canonical records'), default=False,
        help_text=_('Organization maintains sacramental records (Canon 535)'),
    )
    sacramental_data_processing = models.BooleanField(
        _('sacramental data processing'), default=False,
        help_text=_('GDPR Art. 9(2)(d) - Processing for religious purposes'),
    )

    # Legal hold (GDPR Art. 17(3) - Right to erasure exceptions)
    legal_hold = models.BooleanField(
        _('legal hold'), default=False,
        help_text=_('Data deletion suspended due to legal proceedings'),
    )
    legal_hold_reason = models.TextField(
        _('legal hold reason'), blank=True,
        help_text=_('Reason for legal hold (e.g., pending litigation, regulatory investigation)'),
    )
    legal_hold_until = models.DateTimeField(
        _('legal hold until'), null=True, blank=True,
        help_text=_('Expiration date of legal hold'),
    )
    legal_hold_applied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='applied_legal_holds',
        verbose_name=_('legal hold applied by'),
    )
    legal_hold_applied_at = models.DateTimeField(
        _('legal hold applied at'), null=True, blank=True,
    )

    # Organization metadata
    entity_id = models.CharField(
        _('entity ID'), max_length=64, blank=True, unique=True,
        help_text=_('Unique entity identifier (e.g., lt-catholic-basilica-001)'),
    )

    extra = models.JSONField(_('extra'), default=dict)

    class Meta:
        verbose_name = _('organization')
        verbose_name_plural = _('organizations')
        ordering = ['name']
        indexes = [
            models.Index(fields=['country', 'status']),
            models.Index(fields=['org_type', 'status']),
            models.Index(fields=['compliance_level']),
            models.Index(fields=['legal_hold']),
            models.Index(fields=['entity_id']),
        ]

    def __str__(self):
        return f'{self.name} ({self.country})'

    def is_catholic(self):
        """Check if organization is a Catholic entity."""
        catholic_types = [
            self.TYPE_BASILICA, self.TYPE_CATHEDRAL, self.TYPE_DIOCESE,
            self.TYPE_DEANERY, self.TYPE_CHURCH, self.TYPE_PARISH,
            self.TYPE_MONASTERY, self.TYPE_CHAPEL, self.TYPE_SHRINE,
        ]
        return self.org_type in catholic_types

    def is_commercial_service(self):
        """Check if organization is a commercial service provider."""
        return self.org_type in [self.TYPE_FUNERAL_SERVICE, self.TYPE_CEMETERY_SERVICE]

    def requires_canonical_compliance(self):
        """Check if organization requires Canon Law compliance."""
        return self.compliance_level == self.COMPLIANCE_CANONICAL or self.canonical_records

    def requires_pci_dss(self):
        """Check if organization requires PCI-DSS compliance."""
        return self.compliance_level == self.COMPLIANCE_SOC2_GDPR_PCI

    def is_legal_hold_active(self):
        """Check if legal hold is currently in effect."""
        if not self.legal_hold:
            return False
        if self.legal_hold_until:
            from django.utils import timezone
            return timezone.now() < self.legal_hold_until
        return True

    def get_hierarchy_level(self):
        """Return the hierarchy level for 4-tier RBAC.

        Returns: 'super', 'country', 'diocese', or 'facility'
        """
        if self.org_type == self.TYPE_DIOCESE:
            return 'diocese'
        elif self.org_type == self.TYPE_DEANERY:
            return 'deanery'
        else:
            return 'facility'


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


class ConsentSettings(BaseModel):
    """
    GDPR Art. 7, Art. 13 - Consent tracking for data processing.
    
    Stores consent preferences for each organization's data collection.
    Analytics data should only be collected and processed when consent is granted.
    """
    
    CONSENT_NECESSARY = 'necessary'
    CONSENT_ANALYTICS = 'analytics'
    CONSENT_MARKETING = 'marketing'
    CONSENT_FUNCTIONAL = 'functional'
    
    CONSENT_TYPES = [
        (CONSENT_NECESSARY, _('Necessary')),
        (CONSENT_ANALYTICS, _('Analytics')),
        (CONSENT_MARKETING, _('Marketing')),
        (CONSENT_FUNCTIONAL, _('Functional')),
    ]
    
    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE,
        related_name='consent_settings', verbose_name=_('organization'),
    )
    analytics_consent_enabled = models.BooleanField(
        _('analytics consent enabled'),
        default=False,
        help_text=_('Organization has enabled analytics tracking with user consent'),
    )
    marketing_consent_enabled = models.BooleanField(
        _('marketing consent enabled'),
        default=False,
        help_text=_('Organization has enabled marketing with user consent'),
    )
    functional_consent_enabled = models.BooleanField(
        _('functional consent enabled'),
        default=False,
        help_text=_('Organization has enabled functional cookies with user consent'),
    )
    consent_updated_at = models.DateTimeField(
        _('consent updated at'),
        auto_now=True,
    )
    consent_version = models.CharField(
        _('consent version'),
        max_length=32,
        default='1.0',
        help_text=_('Version of consent policy in effect'),
    )
    privacy_policy_url = models.URLField(
        _('privacy policy URL'),
        blank=True,
        help_text=_('URL to organization privacy policy'),
    )
    
    class Meta:
        verbose_name = _('consent settings')
        verbose_name_plural = _('consent settings')
    
    def __str__(self):
        return f'Consent settings for {self.organization}'
    
    def has_analytics_consent(self):
        """Check if organization has valid analytics consent."""
        return self.analytics_consent_enabled
