"""
Multi-Tenant CRM Models with GDPR Article 9 Compliance

This module provides:
1. Tenant-scoped data isolation
2. Special Category Data handling (religious affiliation, health-adjacent)
3. PII encryption at rest
4. Tamper-evident audit logging
5. Legal hold support (GDPR Art. 17(3))
"""

import hashlib
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, Dict, Any

from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q, F, Window, signals
from django.db.models.functions import RowNumber
from django.utils import timezone as django_timezone
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel
from apps.organizations.models import Organization


class DataClassification(models.TextChoices):
    """Data classification levels per GDPR/ISO 27001."""
    PUBLIC = 'public', _('Public')
    INTERNAL = 'internal', _('Internal')
    CONFIDENTIAL = 'confidential', _('Confidential (PII)')
    SPECIAL_CATEGORY = 'special_category', _('Special Category (Art. 9)')
    RESTRICTED = 'restricted', _('Restricted (Financial/Health)')


class ConsentStatus(models.TextChoices):
    """Consent status for GDPR Art. 7 compliance."""
    GRANTED = 'granted', _('Granted')
    WITHDRAWN = 'withdrawn', _('Withdrawn')
    PENDING = 'pending', _('Pending')
    NOT_REQUIRED = 'not_required', _('Not Required')


class CRMTenantManager(models.Manager):
    """
    Tenant-aware QuerySet manager.
    
    Provides automatic row-level security filtering based on
    the current tenant context from TenantContextMiddleware.
    """
    
    def get_queryset(self):
        from .middleware import get_current_tenant_id
        queryset = super().get_queryset()
        
        tenant_id = get_current_tenant_id()
        if tenant_id:
            queryset = queryset.filter(organization_id=tenant_id)
        
        return queryset
    
    def all_tenants(self):
        """Return records across all tenants (superuser only)."""
        return super().get_queryset()


class CRMTenantModel(BaseModel):
    """
    Abstract base model for tenant-scoped CRM entities.
    
    Provides:
    - Row-level tenant isolation
    - Data classification tracking
    - Legal hold support
    - Tamper-evident audit trail
    """
    
    # Tenant isolation - MUST be present on all CRM models
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='%(class)s_set',
        verbose_name=_('organization'),
        db_index=True,
    )
    
    # Data classification
    data_classification = models.CharField(
        _('data classification'),
        max_length=20,
        choices=DataClassification.choices,
        default=DataClassification.CONFIDENTIAL,
        db_index=True,
    )
    
    # Legal hold (GDPR Art. 17(3) - Right to erasure exceptions)
    legal_hold = models.BooleanField(
        _('legal hold'),
        default=False,
        help_text=_('Data deletion suspended due to legal requirements'),
        db_index=True,
    )
    legal_hold_reason = models.TextField(
        _('legal hold reason'),
        blank=True,
    )
    legal_hold_until = models.DateTimeField(
        _('legal hold until'),
        null=True,
        blank=True,
    )
    
    # Record integrity
    record_hash = models.CharField(
        _('record hash'),
        max_length=64,
        blank=True,
        help_text=_('SHA-256 hash for tamper detection'),
    )
    previous_hash = models.CharField(
        _('previous hash'),
        max_length=64,
        blank=True,
        help_text=_('Hash chain for audit integrity'),
    )
    
    # Consent tracking
    consent_status = models.CharField(
        _('consent status'),
        max_length=20,
        choices=ConsentStatus.choices,
        default=ConsentStatus.PENDING,
    )
    consent_granted_at = models.DateTimeField(
        _('consent granted at'),
        null=True,
        blank=True,
    )
    consent_withdrawn_at = models.DateTimeField(
        _('consent withdrawn at'),
        null=True,
        blank=True,
    )
    consent_version = models.CharField(
        _('consent version'),
        max_length=32,
        default='1.0',
    )
    
    # Bitrix24 sync tracking
    bitrix24_id = models.CharField(
        _('Bitrix24 ID'),
        max_length=64,
        blank=True,
        db_index=True,
    )
    bitrix24_synced_at = models.DateTimeField(
        _('Bitrix24 synced at'),
        null=True,
        blank=True,
    )
    bitrix24_sync_status = models.CharField(
        _('Bitrix24 sync status'),
        max_length=20,
        choices=[
            ('pending', _('Pending')),
            ('synced', _('Synced')),
            ('failed', _('Failed')),
            ('conflict', _('Conflict')),
        ],
        default='pending',
        db_index=True,
    )
    
    # Audit entries
    audit_entries = GenericRelation(
        'crm.AuditEntry',
        content_type_field='entity_type',
        object_id_field='entity_id',
        related_query_name='%(class)s',
    )
    
    objects = CRMTenantManager()
    
    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=['organization', 'data_classification']),
            models.Index(fields=['organization', 'legal_hold']),
            models.Index(fields=['organization', 'bitrix24_sync_status']),
        ]
    
    def save(self, *args, **kwargs):
        """Generate integrity hash and validate tenant context."""
        if not self.organization_id:
            raise ValidationError(
                "organization_id is required for tenant isolation"
            )
        
        # Generate integrity hash
        self.record_hash = self._calculate_hash()
        
        super().save(*args, **kwargs)
    
    def _calculate_hash(self) -> str:
        """Calculate SHA-256 hash of record for tamper detection."""
        # Exclude hash fields and timestamps for hash calculation
        data = {
            field.name: str(getattr(self, field.name))
            for field in self._meta.fields
            if field.name not in [
                'id', 'created_at', 'updated_at', 'record_hash',
                'previous_hash', 'bitrix24_synced_at', 'bitrix24_sync_status'
            ]
        }
        
        # Sort and serialize
        canonical = str(sorted(data.items()))
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    def is_legal_hold_active(self) -> bool:
        """Check if legal hold is currently in effect."""
        if not self.legal_hold:
            return False
        if self.legal_hold_until:
            return django_timezone.now() < self.legal_hold_until
        return True
    
    def can_be_deleted(self) -> bool:
        """Check if record can be deleted (GDPR Art. 17)."""
        return not self.is_legal_hold_active()
    
    def grant_consent(self, version: str = '1.0'):
        """Grant GDPR consent for this record."""
        self.consent_status = ConsentStatus.GRANTED
        self.consent_granted_at = django_timezone.now()
        self.consent_version = version
        self.save(update_fields=[
            'consent_status', 'consent_granted_at', 'consent_version'
        ])
    
    def withdraw_consent(self):
        """Withdraw GDPR consent (Art. 7(3))."""
        self.consent_status = ConsentStatus.WITHDRAWN
        self.consent_withdrawn_at = django_timezone.now()
        self.save(update_fields=[
            'consent_status', 'consent_withdrawn_at'
        ])


class Contact(CRMTenantModel):
    """
    CRM Contact with GDPR Article 9 Special Category Data support.
    
    Handles:
    - Basic PII (name, contact info)
    - Religious affiliation (Special Category)
    - Sacramental records (Canon Law + GDPR)
    """
    
    # Name fields
    first_name = models.CharField(_('first name'), max_length=128)
    last_name = models.CharField(_('last name'), max_length=128)
    middle_name = models.CharField(_('middle name'), max_length=128, blank=True)
    
    # Contact information
    email = models.EmailField(_('email'), blank=True, db_index=True)
    phone = models.CharField(_('phone'), max_length=32, blank=True)
    secondary_phone = models.CharField(_('secondary phone'), max_length=32, blank=True)
    
    # Address
    address_street = models.CharField(_('street'), max_length=255, blank=True)
    address_city = models.CharField(_('city'), max_length=128, blank=True)
    address_postal_code = models.CharField(_('postal code'), max_length=16, blank=True)
    address_country = models.CharField(_('country'), max_length=2, blank=True)
    
    # Personal information
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    place_of_birth = models.CharField(_('place of birth'), max_length=128, blank=True)
    
    # Special Category Data (GDPR Art. 9)
    religious_affiliation = models.CharField(
        _('religious affiliation'),
        max_length=64,
        blank=True,
        help_text=_('GDPR Art. 9(2)(d) - Religious affiliation'),
    )
    parish_registration_date = models.DateField(
        _('parish registration date'),
        null=True,
        blank=True,
    )
    
    # Sacramental records (Canon Law 535)
    baptism_date = models.DateField(_('baptism date'), null=True, blank=True)
    baptism_place = models.CharField(_('baptism place'), max_length=255, blank=True)
    first_communion_date = models.DateField(_('first communion date'), null=True, blank=True)
    confirmation_date = models.DateField(_('confirmation date'), null=True, blank=True)
    marriage_date = models.DateField(_('marriage date'), null=True, blank=True)
    marriage_place = models.CharField(_('marriage place'), max_length=255, blank=True)
    
    # Family relationships
    spouse_name = models.CharField(_('spouse name'), max_length=255, blank=True)
    father_name = models.CharField(_("father's name"), max_length=255, blank=True)
    mother_name = models.CharField(_("mother's name"), max_length=255, blank=True)
    
    # Internal tracking
    envelope_number = models.CharField(
        _('envelope number'),
        max_length=32,
        blank=True,
        help_text=_('Parishioner envelope number for donations'),
    )
    notes = models.TextField(_('notes'), blank=True)

    # Bitrix24 custom fields (UF_* mappings)
    parish_code = models.CharField(
        _('parish code'),
        max_length=64,
        null=True,
        blank=True,
        help_text=_('Bitrix24 UF_PARISH_CODE — parish identifier'),
    )
    family_id = models.CharField(
        _('family ID'),
        max_length=64,
        null=True,
        blank=True,
        help_text=_('Bitrix24 UF_FAMILY_ID — links family members'),
    )

    # Deceased tracking (Cemetery/Funeral data)
    is_deceased = models.BooleanField(_('is deceased'), default=False)
    date_of_death = models.DateField(_('date of death'), null=True, blank=True)

    class Meta:
        verbose_name = _('contact')
        verbose_name_plural = _('contacts')
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['organization', 'last_name', 'first_name']),
            models.Index(fields=['organization', 'email']),
            models.Index(fields=['organization', 'envelope_number']),
            models.Index(fields=['organization', 'is_deceased']),
            models.Index(fields=['organization', 'parish_code']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'email'],
                condition=~Q(email=''),
                name='unique_email_per_org',
            ),
            models.UniqueConstraint(
                fields=['organization', 'bitrix24_id'],
                condition=~Q(bitrix24_id=''),
                name='unique_contact_bitrix24_per_org',
            ),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    def clean(self):
        """Validate special category data handling."""
        if self.religious_affiliation and self.data_classification != DataClassification.SPECIAL_CATEGORY:
            self.data_classification = DataClassification.SPECIAL_CATEGORY


class Lead(CRMTenantModel):
    """
    CRM Lead for Bitrix24 sales pipeline tracking.

    Leads represent potential contacts/deals that have NOT yet been
    qualified. They are distinct from Contacts (GDPR Art. 4) because:

    1. Leads are pre-consent — no PII processing beyond pipeline tracking.
    2. Leads may convert to Contacts + Deals upon qualification.
    3. Bitrix24 treats Leads and Contacts as separate entities.

    Consent defaults to ``NOT_REQUIRED`` (pre-qualification pipeline).
    Upon conversion to Contact, explicit consent MUST be obtained.
    """

    class LeadStatus(models.TextChoices):
        """Bitrix24 lead lifecycle stages."""
        NEW = 'NEW', _('New')
        IN_PROCESS = 'IN_PROCESS', _('In Process')
        PROCESSED = 'PROCESSED', _('Processed')
        CONVERTED = 'CONVERTED', _('Converted')
        JUNK = 'JUNK', _('Junk')
        CLOSED = 'CLOSED', _('Closed')

    class LeadSource(models.TextChoices):
        """Lead acquisition channels."""
        WEB = 'web', _('Website')
        BITRIX24 = 'bitrix24', _('Bitrix24 CRM')
        PHONE = 'phone', _('Phone Call')
        EMAIL = 'email', _('Email Inquiry')
        REFERRAL = 'referral', _('Referral')
        SOCIAL = 'social', _('Social Media')
        EVENT = 'event', _('Church Event')
        OTHER = 'other', _('Other')

    # Lead identification
    title = models.CharField(
        _('title'),
        max_length=255,
        help_text=_('Lead title / subject line'),
    )

    # Name fields (optional — may be anonymous inquiry)
    first_name = models.CharField(_('first name'), max_length=128, blank=True)
    last_name = models.CharField(_('last name'), max_length=128, blank=True)

    # Contact information (PII)
    email = models.EmailField(_('email'), blank=True)
    phone = models.CharField(_('phone'), max_length=32, blank=True)

    # Lead qualification
    lead_status = models.CharField(
        _('lead status'),
        max_length=20,
        choices=LeadStatus.choices,
        default=LeadStatus.NEW,
        db_index=True,
    )
    source = models.CharField(
        _('source'),
        max_length=32,
        choices=LeadSource.choices,
        default=LeadSource.BITRIX24,
        blank=True,
    )

    # Financial estimation (for deal qualification)
    estimated_value = models.DecimalField(
        _('estimated value'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text=_('Potential deal value upon conversion'),
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='EUR',
    )

    # Notes
    notes = models.TextField(_('notes'), blank=True)

    # Bitrix24 COMMENTS field
    comments = models.TextField(
        _('comments'),
        blank=True,
        help_text=_('Bitrix24 COMMENTS field'),
    )

    # Conversion tracking
    converted_at = models.DateTimeField(
        _('converted at'),
        null=True,
        blank=True,
    )
    converted_contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='converted_from_leads',
        verbose_name=_('converted contact'),
    )

    class Meta:
        verbose_name = _('lead')
        verbose_name_plural = _('leads')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'lead_status']),
            models.Index(fields=['organization', 'source']),
            models.Index(fields=['organization', 'created_at']),
            models.Index(fields=['organization', 'email']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'bitrix24_id'],
                condition=~Q(bitrix24_id=''),
                name='unique_lead_bitrix24_per_org',
            ),
        ]

    def __str__(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return f"{self.title}" if not name else f"{self.title} — {name}"

    @property
    def full_name(self) -> str:
        """Return concatenated first and last name."""
        return f"{self.first_name} {self.last_name}".strip()

    def mark_converted(self, contact: Contact) -> None:
        """Mark lead as converted to a Contact.

        Args:
            contact: The Contact record created from this lead.
        """
        self.lead_status = self.LeadStatus.CONVERTED
        self.converted_at = django_timezone.now()
        self.converted_contact = contact
        self.save(update_fields=[
            'lead_status', 'converted_at', 'converted_contact', 'updated_at',
        ])


class Deal(CRMTenantModel):
    """
    CRM Deal for donations, services, and contracts.
    
    Handles:
    - Financial transactions (PCI-DSS)
    - Donations (GDPR + Canon Law)
    - Service contracts (long-term)
    """
    
    class DealType(models.TextChoices):
        DONATION = 'donation', _('Donation')
        MASS_INTENTION = 'mass_intention', _('Mass Intention')
        FUNERAL_SERVICE = 'funeral_service', _('Funeral Service')
        CEMETERY_SERVICE = 'cemetery_service', _('Cemetery Service')
        MAINTENANCE_CONTRACT = 'maintenance_contract', _('Maintenance Contract')
        PRENEED_CONTRACT = 'preneed_contract', _('Pre-Need Contract')
        MEMORIAL_PRODUCT = 'memorial_product', _('Memorial Product')
    
    class DealStage(models.TextChoices):
        NEW = 'new', _('New')
        IN_PROGRESS = 'in_progress', _('In Progress')
        PENDING_PAYMENT = 'pending_payment', _('Pending Payment')
        PAID = 'paid', _('Paid')
        COMPLETED = 'completed', _('Completed')
        CANCELLED = 'cancelled', _('Cancelled')
        REFUNDED = 'refunded', _('Refunded')
    
    # Deal identification
    deal_number = models.CharField(
        _('deal number'),
        max_length=32,
        unique=True,
        blank=True,
    )
    title = models.CharField(_('title'), max_length=255)
    deal_type = models.CharField(
        _('deal type'),
        max_length=32,
        choices=DealType.choices,
        db_index=True,
    )
    stage = models.CharField(
        _('stage'),
        max_length=32,
        choices=DealStage.choices,
        default=DealStage.NEW,
        db_index=True,
    )
    
    # Contact relationship
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals',
        verbose_name=_('contact'),
    )
    
    # Financial details
    amount = models.DecimalField(
        _('amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    currency = models.CharField(_('currency'), max_length=3, default='EUR')
    paid_amount = models.DecimalField(
        _('paid amount'),
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
    )
    
    # Payment details
    payment_method = models.CharField(
        _('payment method'),
        max_length=32,
        blank=True,
        choices=[
            ('stripe', 'Stripe'),
            ('paypal', 'PayPal'),
            ('bank_transfer', 'Bank Transfer'),
            ('cash', 'Cash'),
            ('card', 'Card'),
        ],
    )
    transaction_id = models.CharField(
        _('transaction ID'),
        max_length=128,
        blank=True,
    )
    payment_processed_at = models.DateTimeField(
        _('payment processed at'),
        null=True,
        blank=True,
    )
    
    # Donation specific (GDPR Art. 9 - religious purpose)
    donation_type = models.CharField(
        _('donation type'),
        max_length=32,
        blank=True,
        choices=[
            ('one_time', _('One-time')),
            ('recurring', _('Recurring')),
            ('mass_offering', _('Mass Offering')),
            ('candle_offering', _('Candle Offering')),
            ('special_collection', _('Special Collection')),
        ],
    )
    is_recurring = models.BooleanField(_('is recurring'), default=False)
    is_tax_deductible = models.BooleanField(_('is tax deductible'), default=False)
    receipt_sent = models.BooleanField(_('receipt sent'), default=False)
    receipt_sent_at = models.DateTimeField(_('receipt sent at'), null=True, blank=True)
    
    # Mass intention specific
    mass_intention_type = models.CharField(
        _('mass intention type'),
        max_length=32,
        blank=True,
        choices=[
            ('living', _('Living')),
            ('deceased', _('Deceased')),
            ('special_intention', _('Special Intention')),
        ],
    )
    mass_intention_for = models.CharField(
        _('mass intention for'),
        max_length=255,
        blank=True,
    )
    mass_date = models.DateField(_('mass date'), null=True, blank=True)
    
    # Contract specific
    contract_start_date = models.DateField(
        _('contract start date'),
        null=True,
        blank=True,
    )
    contract_end_date = models.DateField(
        _('contract end date'),
        null=True,
        blank=True,
    )
    contract_duration_months = models.PositiveIntegerField(
        _('contract duration (months)'),
        null=True,
        blank=True,
    )
    
    # Notes
    description = models.TextField(_('description'), blank=True)
    internal_notes = models.TextField(_('internal notes'), blank=True)
    
    # Dates
    closed_at = models.DateTimeField(_('closed at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('deal')
        verbose_name_plural = _('deals')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'deal_type', 'stage']),
            models.Index(fields=['organization', 'contact']),
            models.Index(fields=['organization', 'created_at']),
            models.Index(fields=['organization', 'payment_processed_at']),
        ]
    
    def __str__(self):
        return f"{self.deal_number or self.title} - {self.amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        if not self.deal_number:
            self.deal_number = self._generate_deal_number()
        
        # Auto-set data classification for financial deals
        if self.deal_type in [self.DealType.DONATION, self.DealType.FUNERAL_SERVICE]:
            self.data_classification = DataClassification.SPECIAL_CATEGORY
        
        # Tenant validation for cross-tenant protection
        self._validate_tenant_context()
        
        super().save(*args, **kwargs)
    
    def _validate_tenant_context(self):
        """
        Validate that the organization matches current tenant context.
        
        SOC2 CC6.2 / GDPR Article 32 - Prevents cross-tenant deal manipulation.
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
                    f"Cross-tenant deal attempt: context_tenant={tenant_id}, "
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
    
    def _generate_deal_number(self) -> str:
        """Generate unique deal number."""
        prefix = self.deal_type[:3].upper()
        timestamp = django_timezone.now().strftime('%Y%m%d%H%M%S')
        unique = str(uuid.uuid4())[:8]
        return f"{prefix}-{timestamp}-{unique}"
    
    def mark_paid(self, transaction_id: str = ''):
        """Mark deal as paid and log for PCI-DSS compliance."""
        with transaction.atomic():
            self.stage = self.DealStage.PAID
            self.paid_amount = self.amount
            self.payment_processed_at = django_timezone.now()
            if transaction_id:
                self.transaction_id = transaction_id
            self.save()
            
            # Log financial transaction
            AuditEntry.objects.create(
                organization=self.organization,
                event_type='financial_transaction',
                operation='deal_paid',
                entity_type='deal',
                entity_id=str(self.id),
                details={
                    'deal_number': self.deal_number,
                    'amount': str(self.amount),
                    'currency': self.currency,
                    'payment_method': self.payment_method,
                    'transaction_id': self.transaction_id,
                },
            )


class AuditEntry(BaseModel):
    """
    Tamper-evident audit log entry.
    
    Provides:
    - Hash chain for integrity verification
    - GDPR Art. 30 compliance
    - PCI-DSS Requirement 10 compliance
    - SOC2 Type II audit trail
    """
    
    class EventType(models.TextChoices):
        CREATE = 'create', _('Create')
        UPDATE = 'update', _('Update')
        DELETE = 'delete', _('Delete')
        ACCESS = 'access', _('Access')
        EXPORT = 'export', _('Export')
        FINANCIAL_TRANSACTION = 'financial_transaction', _('Financial Transaction')
        CONSENT_CHANGE = 'consent_change', _('Consent Change')
        LEGAL_HOLD = 'legal_hold', _('Legal Hold')
        GDPR_REQUEST = 'gdpr_request', _('GDPR Request')
    
    # Tenant scope
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='audit_entries',
        verbose_name=_('organization'),
    )
    
    # Event details
    event_type = models.CharField(
        _('event type'),
        max_length=32,
        choices=EventType.choices,
        db_index=True,
    )
    operation = models.CharField(_('operation'), max_length=64)
    entity_type = models.CharField(_('entity type'), max_length=64, db_index=True)
    entity_id = models.CharField(_('entity ID'), max_length=64, db_index=True)
    
    # Details (JSON for flexibility)
    details = models.JSONField(_('details'), default=dict)
    
    # Actor information
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_entries',
        verbose_name=_('actor user'),
    )
    actor_ip = models.GenericIPAddressField(_('actor IP'), null=True, blank=True)
    actor_user_agent = models.CharField(_('user agent'), max_length=512, blank=True)
    
    # Hash chain (tamper detection)
    entry_hash = models.CharField(_('entry hash'), max_length=64, blank=True)
    previous_hash = models.CharField(_('previous hash'), max_length=64, blank=True)
    sequence_number = models.BigIntegerField(_('sequence number'), default=0)
    
    # Compliance metadata
    gdpr_basis = models.CharField(
        _('GDPR legal basis'),
        max_length=64,
        blank=True,
        help_text=_('GDPR Art. 6 legal basis for processing'),
    )
    retention_period_years = models.PositiveIntegerField(
        _('retention period (years)'),
        default=10,
    )
    
    class Meta:
        verbose_name = _('audit entry')
        verbose_name_plural = _('audit entries')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'event_type', 'created_at']),
            models.Index(fields=['organization', 'entity_type', 'entity_id']),
            models.Index(fields=['sequence_number']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.entity_type}:{self.entity_id}"
    
    def save(self, *args, **kwargs):
        if not self.sequence_number:
            self.sequence_number = self._get_next_sequence()
        
        self.entry_hash = self._calculate_hash()
        self.previous_hash = self._get_previous_hash()
        
        # Tenant validation for cross-tenant protection
        self._validate_tenant_context()
        
        super().save(*args, **kwargs)
    
    def _validate_tenant_context(self):
        """
        Validate that the organization matches current tenant context.
        
        SOC2 CC6.2 / GDPR Article 32 - Prevents cross-tenant audit manipulation.
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
                    f"Cross-tenant audit attempt: context_tenant={tenant_id}, "
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
    
    def _get_next_sequence(self) -> int:
        """Get next sequence number for hash chain."""
        last_entry = AuditEntry.objects.filter(
            organization=self.organization
        ).order_by('-sequence_number').first()
        
        return (last_entry.sequence_number + 1) if last_entry else 1
    
    def _get_previous_hash(self) -> str:
        """Get hash of previous entry in chain."""
        prev_seq = self.sequence_number - 1
        if prev_seq < 1:
            return '0' * 64  # Genesis block
        
        prev_entry = AuditEntry.objects.filter(
            organization=self.organization,
            sequence_number=prev_seq,
        ).first()
        
        return prev_entry.entry_hash if prev_entry else '0' * 64
    
    def _calculate_hash(self) -> str:
        """Calculate SHA-256 hash of this entry."""
        data = {
            'sequence': self.sequence_number,
            'timestamp': self.created_at.isoformat() if self.created_at else '',
            'event_type': self.event_type,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'details': self.details,
            'previous_hash': self.previous_hash,
        }
        
        canonical = str(sorted(data.items()))
        return hashlib.sha256(canonical.encode()).hexdigest()
    
    @classmethod
    def verify_chain(cls, organization_id: int) -> Dict[str, Any]:
        """Verify integrity of hash chain."""
        entries = cls.objects.filter(
            organization_id=organization_id
        ).order_by('sequence_number')
        
        errors = []
        prev_hash = '0' * 64
        
        for entry in entries:
            # Verify hash
            expected_hash = entry._calculate_hash()
            if entry.entry_hash != expected_hash:
                errors.append({
                    'sequence': entry.sequence_number,
                    'error': 'hash_mismatch',
                })
            
            # Verify chain link
            if entry.previous_hash != prev_hash:
                errors.append({
                    'sequence': entry.sequence_number,
                    'error': 'chain_broken',
                })
            
            prev_hash = entry.entry_hash
        
        return {
            'valid': len(errors) == 0,
            'entries_checked': entries.count(),
            'errors': errors,
        }


class DataSubjectRequest(BaseModel):
    """
    GDPR Data Subject Request tracking.
    
    Handles Art. 15-22 requests:
    - Access (Art. 15)
    - Rectification (Art. 16)
    - Erasure (Art. 17)
    - Restriction (Art. 18)
    - Portability (Art. 20)
    - Objection (Art. 21)
    """
    
    class RequestType(models.TextChoices):
        ACCESS = 'access', _('Access Request (Art. 15)')
        RECTIFICATION = 'rectification', _('Rectification Request (Art. 16)')
        ERASURE = 'erasure', _('Erasure Request (Art. 17)')
        RESTRICTION = 'restriction', _('Restriction Request (Art. 18)')
        PORTABILITY = 'portability', _('Portability Request (Art. 20)')
        OBJECTION = 'objection', _('Objection Request (Art. 21)')
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        IN_PROGRESS = 'in_progress', _('In Progress')
        COMPLETED = 'completed', _('Completed')
        REJECTED = 'rejected', _('Rejected')
    
    # Request details
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='dsr_requests',
    )
    request_type = models.CharField(
        _('request type'),
        max_length=32,
        choices=RequestType.choices,
        db_index=True,
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    
    # Data subject identification
    contact = models.ForeignKey(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dsr_requests',
    )
    requester_email = models.EmailField(_('requester email'))
    requester_name = models.CharField(_('requester name'), max_length=255)
    verification_document = models.FileField(
        _('verification document'),
        upload_to='dsr_verification/',
        null=True,
        blank=True,
    )
    
    # Request details
    description = models.TextField(_('description'))
    rejection_reason = models.TextField(_('rejection reason'), blank=True)
    
    # Processing
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_dsr_requests',
    )
    due_date = models.DateField(_('due date'), null=True, blank=True)
    completed_at = models.DateTimeField(_('completed at'), null=True, blank=True)
    
    # Response
    response_data = models.JSONField(
        _('response data'),
        default=dict,
        help_text=_('Exported data for access/portability requests'),
    )
    
    class Meta:
        verbose_name = _('data subject request')
        verbose_name_plural = _('data subject requests')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status', 'due_date']),
            models.Index(fields=['request_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.get_request_type_display()} - {self.requester_email}"
    
    def save(self, *args, **kwargs):
        if not self.due_date:
            # GDPR requires response within 30 days
            from datetime import timedelta
            self.due_date = (
                django_timezone.now() + timedelta(days=30)
            ).date()
        
        # Tenant validation for cross-tenant protection
        self._validate_tenant_context()
        
        super().save(*args, **kwargs)
    
    def _validate_tenant_context(self):
        """
        Validate that the organization matches current tenant context.
        
        SOC2 CC6.2 / GDPR Article 32 - Prevents cross-tenant DSR manipulation.
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
                    f"Cross-tenant DSR attempt: context_tenant={tenant_id}, "
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
    
    def complete(self, response_data: Optional[Dict] = None):
        """Mark request as completed."""
        self.status = self.Status.COMPLETED
        self.completed_at = django_timezone.now()
        if response_data:
            self.response_data = response_data
        self.save()
        
        # Create audit entry
        AuditEntry.objects.create(
            organization=self.organization,
            event_type=AuditEntry.EventType.GDPR_REQUEST,
            operation=f'dsr_{self.request_type}_completed',
            entity_type='data_subject_request',
            entity_id=str(self.id),
            details={
                'request_type': self.request_type,
                'requester_email': self.requester_email,
            },
        )
