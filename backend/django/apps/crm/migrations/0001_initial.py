# Generated migration for CRM models
# This is the initial migration for the CRM app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0001_initial'),
        ('organizations', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Data Classification Enum (managed via choices, no table needed)
        
        # Consent Status Enum (managed via choices, no table needed)
        
        # Contact Model
        migrations.CreateModel(
            name='Contact',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='active')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='deleted')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='deleted at')),
                
                # Tenant isolation
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='contact_set',
                    to='organizations.organization',
                    verbose_name='organization',
                    db_index=True,
                )),
                
                # Data classification
                ('data_classification', models.CharField(
                    choices=[
                        ('public', 'Public'),
                        ('internal', 'Internal'),
                        ('confidential', 'Confidential (PII)'),
                        ('special_category', 'Special Category (Art. 9)'),
                        ('restricted', 'Restricted (Financial/Health)'),
                    ],
                    db_index=True,
                    default='confidential',
                    max_length=20,
                    verbose_name='data classification',
                )),
                
                # Legal hold
                ('legal_hold', models.BooleanField(db_index=True, default=False, verbose_name='legal hold', help_text='Data deletion suspended due to legal requirements')),
                ('legal_hold_reason', models.TextField(blank=True, verbose_name='legal hold reason')),
                ('legal_hold_until', models.DateTimeField(blank=True, null=True, verbose_name='legal hold until')),
                
                # Record integrity
                ('record_hash', models.CharField(blank=True, max_length=64, verbose_name='record hash', help_text='SHA-256 hash for tamper detection')),
                ('previous_hash', models.CharField(blank=True, max_length=64, verbose_name='previous hash', help_text='Hash chain for audit integrity')),
                
                # Consent tracking
                ('consent_status', models.CharField(
                    choices=[
                        ('granted', 'Granted'),
                        ('withdrawn', 'Withdrawn'),
                        ('pending', 'Pending'),
                        ('not_required', 'Not Required'),
                    ],
                    default='pending',
                    max_length=20,
                    verbose_name='consent status',
                )),
                ('consent_granted_at', models.DateTimeField(blank=True, null=True, verbose_name='consent granted at')),
                ('consent_withdrawn_at', models.DateTimeField(blank=True, null=True, verbose_name='consent withdrawn at')),
                ('consent_version', models.CharField(default='1.0', max_length=32, verbose_name='consent version')),
                
                # Bitrix24 sync
                ('bitrix24_id', models.CharField(blank=True, db_index=True, max_length=64, verbose_name='Bitrix24 ID')),
                ('bitrix24_synced_at', models.DateTimeField(blank=True, null=True, verbose_name='Bitrix24 synced at')),
                ('bitrix24_sync_status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('synced', 'Synced'),
                        ('failed', 'Failed'),
                        ('conflict', 'Conflict'),
                    ],
                    db_index=True,
                    default='pending',
                    max_length=20,
                    verbose_name='Bitrix24 sync status',
                )),
                
                # Name fields
                ('first_name', models.CharField(max_length=128, verbose_name='first name')),
                ('last_name', models.CharField(max_length=128, verbose_name='last name')),
                ('middle_name', models.CharField(blank=True, max_length=128, verbose_name='middle name')),
                
                # Contact information
                ('email', models.EmailField(blank=True, db_index=True, max_length=254, verbose_name='email')),
                ('phone', models.CharField(blank=True, max_length=32, verbose_name='phone')),
                ('secondary_phone', models.CharField(blank=True, max_length=32, verbose_name='secondary phone')),
                
                # Address
                ('address_street', models.CharField(blank=True, max_length=255, verbose_name='street')),
                ('address_city', models.CharField(blank=True, max_length=128, verbose_name='city')),
                ('address_postal_code', models.CharField(blank=True, max_length=16, verbose_name='postal code')),
                ('address_country', models.CharField(blank=True, max_length=2, verbose_name='country')),
                
                # Personal information
                ('date_of_birth', models.DateField(blank=True, null=True, verbose_name='date of birth')),
                ('place_of_birth', models.CharField(blank=True, max_length=128, verbose_name='place of birth')),
                
                # Special Category Data (GDPR Art. 9)
                ('religious_affiliation', models.CharField(
                    blank=True,
                    help_text='GDPR Art. 9(2)(d) - Religious affiliation',
                    max_length=64,
                    verbose_name='religious affiliation',
                )),
                ('parish_registration_date', models.DateField(blank=True, null=True, verbose_name='parish registration date')),
                
                # Sacramental records
                ('baptism_date', models.DateField(blank=True, null=True, verbose_name='baptism date')),
                ('baptism_place', models.CharField(blank=True, max_length=255, verbose_name='baptism place')),
                ('first_communion_date', models.DateField(blank=True, null=True, verbose_name='first communion date')),
                ('confirmation_date', models.DateField(blank=True, null=True, verbose_name='confirmation date')),
                ('marriage_date', models.DateField(blank=True, null=True, verbose_name='marriage date')),
                ('marriage_place', models.CharField(blank=True, max_length=255, verbose_name='marriage place')),
                
                # Family relationships
                ('spouse_name', models.CharField(blank=True, max_length=255, verbose_name='spouse name')),
                ('father_name', models.CharField(blank=True, max_length=255, verbose_name="father's name")),
                ('mother_name', models.CharField(blank=True, max_length=255, verbose_name="mother's name")),
                
                # Internal tracking
                ('envelope_number', models.CharField(
                    blank=True,
                    help_text='Parishioner envelope number for donations',
                    max_length=32,
                    verbose_name='envelope number',
                )),
                ('notes', models.TextField(blank=True, verbose_name='notes')),
                
                # Deceased tracking
                ('is_deceased', models.BooleanField(default=False, verbose_name='is deceased')),
                ('date_of_death', models.DateField(blank=True, null=True, verbose_name='date of death')),
            ],
            options={
                'verbose_name': 'contact',
                'verbose_name_plural': 'contacts',
                'ordering': ['last_name', 'first_name'],
            },
        ),
        
        # Contact indexes
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'data_classification'], name='idx_contact_organization_data_classification'),
        ),
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'legal_hold'], name='idx_contact_organization_legal_hold'),
        ),
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'bitrix24_sync_status'], name='idx_contact_organization_bitrix24_sync_status'),
        ),
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'last_name', 'first_name'], name='idx_contact_organization_last_name_first_name'),
        ),
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'email'], name='idx_contact_organization_email'),
        ),
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'envelope_number'], name='idx_contact_organization_envelope_number'),
        ),
        migrations.AddIndex(
            model_name='contact',
            index=models.Index(fields=['organization', 'is_deceased'], name='idx_contact_organization_is_deceased'),
        ),
        
        # Contact constraints
        migrations.AddConstraint(
            model_name='contact',
            constraint=models.UniqueConstraint(
                condition=~models.Q(email=''),
                fields=['organization', 'email'],
                name='unique_email_per_org',
            ),
        ),
        
        # Deal Model
        migrations.CreateModel(
            name='Deal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='active')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='deleted')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='deleted at')),
                
                # Tenant isolation
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='deal_set',
                    to='organizations.organization',
                    verbose_name='organization',
                    db_index=True,
                )),
                
                # Contact relationship
                ('contact', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='deals',
                    to='crm.contact',
                    verbose_name='contact',
                )),
                
                # Data classification (from CRMTenantModel)
                ('data_classification', models.CharField(
                    choices=[
                        ('public', 'Public'),
                        ('internal', 'Internal'),
                        ('confidential', 'Confidential (PII)'),
                        ('special_category', 'Special Category (Art. 9)'),
                        ('restricted', 'Restricted (Financial/Health)'),
                    ],
                    db_index=True,
                    default='confidential',
                    max_length=20,
                    verbose_name='data classification',
                )),
                
                # Legal hold
                ('legal_hold', models.BooleanField(db_index=True, default=False, verbose_name='legal hold')),
                ('legal_hold_reason', models.TextField(blank=True, verbose_name='legal hold reason')),
                ('legal_hold_until', models.DateTimeField(blank=True, null=True, verbose_name='legal hold until')),
                
                # Record integrity
                ('record_hash', models.CharField(blank=True, max_length=64, verbose_name='record hash')),
                ('previous_hash', models.CharField(blank=True, max_length=64, verbose_name='previous hash')),
                
                # Consent tracking
                ('consent_status', models.CharField(
                    choices=[('granted', 'Granted'), ('withdrawn', 'Withdrawn'), ('pending', 'Pending'), ('not_required', 'Not Required')],
                    default='pending',
                    max_length=20,
                    verbose_name='consent status',
                )),
                ('consent_granted_at', models.DateTimeField(blank=True, null=True, verbose_name='consent granted at')),
                ('consent_withdrawn_at', models.DateTimeField(blank=True, null=True, verbose_name='consent withdrawn at')),
                ('consent_version', models.CharField(default='1.0', max_length=32, verbose_name='consent version')),
                
                # Bitrix24 sync
                ('bitrix24_id', models.CharField(blank=True, db_index=True, max_length=64, verbose_name='Bitrix24 ID')),
                ('bitrix24_synced_at', models.DateTimeField(blank=True, null=True, verbose_name='Bitrix24 synced at')),
                ('bitrix24_sync_status', models.CharField(
                    choices=[('pending', 'Pending'), ('synced', 'Synced'), ('failed', 'Failed'), ('conflict', 'Conflict')],
                    db_index=True,
                    default='pending',
                    max_length=20,
                    verbose_name='Bitrix24 sync status',
                )),
                
                # Deal fields
                ('deal_number', models.CharField(blank=True, max_length=32, unique=True, verbose_name='deal number')),
                ('title', models.CharField(max_length=255, verbose_name='title')),
                ('deal_type', models.CharField(
                    choices=[
                        ('donation', 'Donation'),
                        ('mass_intention', 'Mass Intention'),
                        ('funeral_service', 'Funeral Service'),
                        ('cemetery_service', 'Cemetery Service'),
                        ('maintenance_contract', 'Maintenance Contract'),
                        ('preneed_contract', 'Pre-Need Contract'),
                        ('memorial_product', 'Memorial Product'),
                    ],
                    db_index=True,
                    max_length=32,
                    verbose_name='deal type',
                )),
                ('stage', models.CharField(
                    choices=[
                        ('new', 'New'),
                        ('in_progress', 'In Progress'),
                        ('pending_payment', 'Pending Payment'),
                        ('paid', 'Paid'),
                        ('completed', 'Completed'),
                        ('cancelled', 'Cancelled'),
                        ('refunded', 'Refunded'),
                    ],
                    db_index=True,
                    default='new',
                    max_length=32,
                    verbose_name='stage',
                )),
                
                # Financial
                ('amount', models.DecimalField(decimal_places=2, default='0.00', max_digits=12, verbose_name='amount')),
                ('currency', models.CharField(default='EUR', max_length=3, verbose_name='currency')),
                ('paid_amount', models.DecimalField(decimal_places=2, default='0.00', max_digits=12, verbose_name='paid amount')),
                
                # Payment
                ('payment_method', models.CharField(
                    blank=True,
                    choices=[
                        ('stripe', 'Stripe'),
                        ('paypal', 'PayPal'),
                        ('bank_transfer', 'Bank Transfer'),
                        ('cash', 'Cash'),
                        ('card', 'Card'),
                    ],
                    max_length=32,
                    verbose_name='payment method',
                )),
                ('transaction_id', models.CharField(blank=True, max_length=128, verbose_name='transaction ID')),
                ('payment_processed_at', models.DateTimeField(blank=True, null=True, verbose_name='payment processed at')),
                
                # Donation specific
                ('donation_type', models.CharField(
                    blank=True,
                    choices=[
                        ('one_time', 'One-time'),
                        ('recurring', 'Recurring'),
                        ('mass_offering', 'Mass Offering'),
                        ('candle_offering', 'Candle Offering'),
                        ('special_collection', 'Special Collection'),
                    ],
                    max_length=32,
                    verbose_name='donation type',
                )),
                ('is_recurring', models.BooleanField(default=False, verbose_name='is recurring')),
                ('is_tax_deductible', models.BooleanField(default=False, verbose_name='is tax deductible')),
                ('receipt_sent', models.BooleanField(default=False, verbose_name='receipt sent')),
                ('receipt_sent_at', models.DateTimeField(blank=True, null=True, verbose_name='receipt sent at')),
                
                # Mass intention
                ('mass_intention_type', models.CharField(
                    blank=True,
                    choices=[
                        ('living', 'Living'),
                        ('deceased', 'Deceased'),
                        ('special_intention', 'Special Intention'),
                    ],
                    max_length=32,
                    verbose_name='mass intention type',
                )),
                ('mass_intention_for', models.CharField(blank=True, max_length=255, verbose_name='mass intention for')),
                ('mass_date', models.DateField(blank=True, null=True, verbose_name='mass date')),
                
                # Contract
                ('contract_start_date', models.DateField(blank=True, null=True, verbose_name='contract start date')),
                ('contract_end_date', models.DateField(blank=True, null=True, verbose_name='contract end date')),
                ('contract_duration_months', models.PositiveIntegerField(blank=True, null=True, verbose_name='contract duration (months)')),
                
                # Notes
                ('description', models.TextField(blank=True, verbose_name='description')),
                ('internal_notes', models.TextField(blank=True, verbose_name='internal notes')),
                
                # Dates
                ('closed_at', models.DateTimeField(blank=True, null=True, verbose_name='closed at')),
            ],
            options={
                'verbose_name': 'deal',
                'verbose_name_plural': 'deals',
                'ordering': ['-created_at'],
            },
        ),
        
        # Deal indexes
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'data_classification'], name='idx_deal_organization_data_classification'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'legal_hold'], name='idx_deal_organization_legal_hold'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'bitrix24_sync_status'], name='idx_deal_organization_bitrix24_sync_status'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'deal_type', 'stage'], name='idx_deal_organization_deal_type_stage'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'contact'], name='idx_deal_organization_contact'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'created_at'], name='idx_deal_organization_created_at'),
        ),
        migrations.AddIndex(
            model_name='deal',
            index=models.Index(fields=['organization', 'payment_processed_at'], name='idx_deal_organization_payment_processed_at'),
        ),
        
        # AuditEntry Model
        migrations.CreateModel(
            name='AuditEntry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='active')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='deleted')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='deleted at')),
                
                # Tenant scope
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='audit_entries',
                    to='organizations.organization',
                    verbose_name='organization',
                )),
                
                # Event details
                ('event_type', models.CharField(
                    choices=[
                        ('create', 'Create'),
                        ('update', 'Update'),
                        ('delete', 'Delete'),
                        ('access', 'Access'),
                        ('export', 'Export'),
                        ('financial_transaction', 'Financial Transaction'),
                        ('consent_change', 'Consent Change'),
                        ('legal_hold', 'Legal Hold'),
                        ('gdpr_request', 'GDPR Request'),
                    ],
                    db_index=True,
                    max_length=32,
                    verbose_name='event type',
                )),
                ('operation', models.CharField(max_length=64, verbose_name='operation')),
                ('entity_type', models.CharField(db_index=True, max_length=64, verbose_name='entity type')),
                ('entity_id', models.CharField(db_index=True, max_length=64, verbose_name='entity ID')),
                
                # Details
                ('details', models.JSONField(default=dict, verbose_name='details')),
                
                # Actor information
                ('actor_user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='audit_entries',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='actor user',
                )),
                ('actor_ip', models.GenericIPAddressField(blank=True, null=True, verbose_name='actor IP')),
                ('actor_user_agent', models.CharField(blank=True, max_length=512, verbose_name='user agent')),
                
                # Hash chain
                ('entry_hash', models.CharField(blank=True, max_length=64, verbose_name='entry hash')),
                ('previous_hash', models.CharField(blank=True, max_length=64, verbose_name='previous hash')),
                ('sequence_number', models.BigIntegerField(default=0, verbose_name='sequence number')),
                
                # Compliance metadata
                ('gdpr_basis', models.CharField(
                    blank=True,
                    help_text='GDPR Art. 6 legal basis for processing',
                    max_length=64,
                    verbose_name='GDPR legal basis',
                )),
                ('retention_period_years', models.PositiveIntegerField(default=10, verbose_name='retention period (years)')),
            ],
            options={
                'verbose_name': 'audit entry',
                'verbose_name_plural': 'audit entries',
                'ordering': ['-created_at'],
            },
        ),
        
        # AuditEntry indexes
        migrations.AddIndex(
            model_name='auditentry',
            index=models.Index(fields=['organization', 'event_type', 'created_at'], name='idx_auditentry_organization_event_type_created_at'),
        ),
        migrations.AddIndex(
            model_name='auditentry',
            index=models.Index(fields=['organization', 'entity_type', 'entity_id'], name='idx_auditentry_organization_entity_type_entity_id'),
        ),
        migrations.AddIndex(
            model_name='auditentry',
            index=models.Index(fields=['sequence_number'], name='idx_auditentry_sequence_number'),
        ),
        migrations.AddIndex(
            model_name='auditentry',
            index=models.Index(fields=['created_at'], name='idx_auditentry_created_at'),
        ),
        
        # DataSubjectRequest Model
        migrations.CreateModel(
            name='DataSubjectRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='created at')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='updated at')),
                ('is_active', models.BooleanField(db_index=True, default=True, verbose_name='active')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='deleted')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='deleted at')),
                
                # Tenant scope
                ('organization', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='dsr_requests',
                    to='organizations.organization',
                )),
                
                # Request details
                ('request_type', models.CharField(
                    choices=[
                        ('access', 'Access Request (Art. 15)'),
                        ('rectification', 'Rectification Request (Art. 16)'),
                        ('erasure', 'Erasure Request (Art. 17)'),
                        ('restriction', 'Restriction Request (Art. 18)'),
                        ('portability', 'Portability Request (Art. 20)'),
                        ('objection', 'Objection Request (Art. 21)'),
                    ],
                    db_index=True,
                    max_length=32,
                    verbose_name='request type',
                )),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('in_progress', 'In Progress'),
                        ('completed', 'Completed'),
                        ('rejected', 'Rejected'),
                    ],
                    db_index=True,
                    default='pending',
                    max_length=20,
                    verbose_name='status',
                )),
                
                # Contact relationship
                ('contact', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='dsr_requests',
                    to='crm.contact',
                )),
                
                # Requester info
                ('requester_email', models.EmailField(max_length=254, verbose_name='requester email')),
                ('requester_name', models.CharField(max_length=255, verbose_name='requester name')),
                ('verification_document', models.FileField(
                    blank=True,
                    null=True,
                    upload_to='dsr_verification/',
                    verbose_name='verification document',
                )),
                
                # Request details
                ('description', models.TextField(verbose_name='description')),
                ('rejection_reason', models.TextField(blank=True, verbose_name='rejection reason')),
                
                # Processing
                ('assigned_to', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='assigned_dsr_requests',
                    to=settings.AUTH_USER_MODEL,
                )),
                ('due_date', models.DateField(blank=True, null=True, verbose_name='due date')),
                ('completed_at', models.DateTimeField(blank=True, null=True, verbose_name='completed at')),
                
                # Response
                ('response_data', models.JSONField(
                    default=dict,
                    help_text='Exported data for access/portability requests',
                    verbose_name='response data',
                )),
            ],
            options={
                'verbose_name': 'data subject request',
                'verbose_name_plural': 'data subject requests',
                'ordering': ['-created_at'],
            },
        ),
        
        # DataSubjectRequest indexes
        migrations.AddIndex(
            model_name='datasubjectrequest',
            index=models.Index(fields=['organization', 'status', 'due_date'], name='idx_datasubjectrequest_organization_status_due_date'),
        ),
        migrations.AddIndex(
            model_name='datasubjectrequest',
            index=models.Index(fields=['request_type', 'status'], name='idx_datasubjectrequest_request_type_status'),
        ),
    ]
