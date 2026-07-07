"""
CRM Admin Configuration

Django admin configuration for CRM models with:
- Tenant-aware data display
- Audit trail visibility
- GDPR compliance controls
"""

from django.contrib import admin, messages
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .models import (
    Contact, Deal, AuditEntry, DataSubjectRequest,
    DataClassification, ConsentStatus,
)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Admin for CRM contacts."""
    
    list_display = [
        'full_name', 'email', 'organization', 'consent_status',
        'data_classification', 'is_deceased', 'bitrix24_sync_status'
    ]
    list_filter = [
        'consent_status', 'data_classification', 'is_deceased',
        'bitrix24_sync_status', 'organization'
    ]
    search_fields = ['first_name', 'last_name', 'email', 'envelope_number']
    readonly_fields = [
        'id', 'record_hash', 'previous_hash',
        'bitrix24_id', 'bitrix24_synced_at',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        (_('Personal Information'), {
            'fields': (
                'organization',
                ('first_name', 'last_name', 'middle_name'),
                ('email', 'phone', 'secondary_phone'),
            )
        }),
        (_('Address'), {
            'fields': (
                'address_street',
                ('address_city', 'address_postal_code', 'address_country'),
            ),
            'classes': ('collapse',),
        }),
        (_('Personal Dates'), {
            'fields': (
                ('date_of_birth', 'place_of_birth'),
                ('is_deceased', 'date_of_death'),
            ),
            'classes': ('collapse',),
        }),
        (_('Religious Information (GDPR Art. 9)'), {
            'fields': (
                'religious_affiliation', 'parish_registration_date',
                ('baptism_date', 'baptism_place'),
                'first_communion_date', 'confirmation_date',
                ('marriage_date', 'marriage_place'),
            ),
            'classes': ('collapse',),
        }),
        (_('Family'), {
            'fields': ('spouse_name', 'father_name', 'mother_name'),
            'classes': ('collapse',),
        }),
        (_('Internal'), {
            'fields': ('envelope_number', 'notes'),
        }),
        (_('Consent & Compliance'), {
            'fields': (
                'consent_status', 'consent_granted_at', 'consent_version',
                'data_classification',
                ('legal_hold', 'legal_hold_reason', 'legal_hold_until'),
            ),
        }),
        (_('Synchronization'), {
            'fields': (
                'bitrix24_id', 'bitrix24_synced_at', 'bitrix24_sync_status',
            ),
            'classes': ('collapse',),
        }),
        (_('Audit'), {
            'fields': ('id', 'record_hash', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['grant_consent', 'withdraw_consent', 'sync_to_bitrix24']
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = _('Name')
    
    def grant_consent(self, request, queryset):
        """Grant consent for selected contacts."""
        updated = queryset.update(
            consent_status=ConsentStatus.GRANTED,
            consent_granted_at=timezone.now(),
        )
        self.message_user(
            request,
            f"Granted consent for {updated} contacts.",
            messages.SUCCESS
        )
    grant_consent.short_description = _("Grant GDPR consent")
    
    def withdraw_consent(self, request, queryset):
        """Withdraw consent for selected contacts."""
        updated = queryset.update(
            consent_status=ConsentStatus.WITHDRAWN,
            consent_withdrawn_at=timezone.now(),
        )
        self.message_user(
            request,
            f"Withdrew consent for {updated} contacts.",
            messages.WARNING
        )
    withdraw_consent.short_description = _("Withdraw GDPR consent")
    
    def sync_to_bitrix24(self, request, queryset):
        """Queue selected contacts for Bitrix24 sync."""
        from .bitrix24_service import Bitrix24ClientFactory
        
        count = 0
        for contact in queryset:
            if Bitrix24ClientFactory.get_client(str(contact.organization_id)):
                contact.bitrix24_sync_status = 'pending'
                contact.save(update_fields=['bitrix24_sync_status'])
                count += 1
        
        self.message_user(
            request,
            f"Queued {count} contacts for Bitrix24 sync.",
            messages.INFO
        )
    sync_to_bitrix24.short_description = _("Sync to Bitrix24")


@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    """Admin for CRM deals."""
    
    list_display = [
        'deal_number', 'title', 'organization', 'deal_type',
        'stage', 'amount', 'contact', 'created_at'
    ]
    list_filter = [
        'deal_type', 'stage', 'payment_method',
        'is_recurring', 'receipt_sent', 'organization'
    ]
    search_fields = ['deal_number', 'title', 'contact__first_name', 'contact__last_name']
    readonly_fields = [
        'id', 'deal_number', 'record_hash',
        'bitrix24_id', 'bitrix24_synced_at',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        (_('Deal Information'), {
            'fields': (
                'organization', 'deal_number', 'title', 'deal_type', 'stage',
            )
        }),
        (_('Contact'), {
            'fields': ('contact',),
        }),
        (_('Financial'), {
            'fields': (
                ('amount', 'currency'),
                ('paid_amount', 'payment_processed_at'),
                ('payment_method', 'transaction_id'),
            ),
        }),
        (_('Donation Details'), {
            'fields': (
                'donation_type', 'is_recurring', 'is_tax_deductible',
                ('receipt_sent', 'receipt_sent_at'),
            ),
            'classes': ('collapse',),
        }),
        (_('Mass Intention'), {
            'fields': (
                'mass_intention_type', 'mass_intention_for', 'mass_date',
            ),
            'classes': ('collapse',),
        }),
        (_('Contract'), {
            'fields': (
                ('contract_start_date', 'contract_end_date'),
                'contract_duration_months',
            ),
            'classes': ('collapse',),
        }),
        (_('Notes'), {
            'fields': ('description', 'internal_notes'),
        }),
        (_('Compliance'), {
            'fields': (
                'data_classification',
                ('legal_hold', 'legal_hold_reason'),
            ),
        }),
        (_('Synchronization'), {
            'fields': (
                'bitrix24_id', 'bitrix24_synced_at', 'bitrix24_sync_status',
            ),
            'classes': ('collapse',),
        }),
        (_('Audit'), {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['mark_paid', 'send_receipts']
    
    def mark_paid(self, request, queryset):
        """Mark selected deals as paid."""
        updated = queryset.update(
            stage=Deal.DealStage.PAID,
            payment_processed_at=timezone.now(),
        )
        self.message_user(
            request,
            f"Marked {updated} deals as paid.",
            messages.SUCCESS
        )
    mark_paid.short_description = _("Mark as paid")
    
    def send_receipts(self, request, queryset):
        """Send receipts for paid deals."""
        to_send = queryset.filter(
            stage=Deal.DealStage.PAID,
            receipt_sent=False
        )
        updated = to_send.update(
            receipt_sent=True,
            receipt_sent_at=timezone.now(),
        )
        self.message_user(
            request,
            f"Queued {updated} receipts for sending.",
            messages.INFO
        )
    send_receipts.short_description = _("Send receipts")


@admin.register(AuditEntry)
class AuditEntryAdmin(admin.ModelAdmin):
    """Admin for audit log entries (read-only)."""
    
    list_display = [
        'created_at', 'organization', 'event_type',
        'operation', 'entity_type', 'entity_id'
    ]
    list_filter = ['event_type', 'entity_type', 'organization']
    search_fields = ['entity_id', 'operation']
    readonly_fields = [
        'organization', 'event_type', 'operation',
        'entity_type', 'entity_id', 'details',
        'actor_user', 'actor_ip', 'actor_user_agent',
        'entry_hash', 'previous_hash', 'sequence_number',
        'gdpr_basis', 'retention_period_years',
        'created_at'
    ]
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    actions = ['verify_integrity']
    
    def verify_integrity(self, request, queryset):
        """Verify audit log integrity for selected entries."""
        org_ids = set(queryset.values_list('organization_id', flat=True))
        results = []
        
        for org_id in org_ids:
            result = AuditEntry.verify_chain(org_id)
            results.append(f"Org {org_id}: {'OK' if result['valid'] else 'COMPROMISED'}")
        
        self.message_user(
            request,
            "Integrity check results:\n" + "\n".join(results),
            messages.INFO
        )
    verify_integrity.short_description = _("Verify integrity")


@admin.register(DataSubjectRequest)
class DataSubjectRequestAdmin(admin.ModelAdmin):
    """Admin for GDPR data subject requests."""
    
    list_display = [
        'created_at', 'organization', 'request_type',
        'status', 'requester_email', 'due_date'
    ]
    list_filter = ['request_type', 'status', 'organization']
    search_fields = ['requester_email', 'requester_name']
    readonly_fields = [
        'id', 'due_date', 'completed_at',
        'created_at', 'updated_at'
    ]
    
    fieldsets = (
        (_('Request'), {
            'fields': (
                'organization', 'request_type', 'status',
            )
        }),
        (_('Requester'), {
            'fields': (
                'contact', 'requester_email', 'requester_name',
                'verification_document',
            )
        }),
        (_('Details'), {
            'fields': (
                'description', 'rejection_reason',
            )
        }),
        (_('Processing'), {
            'fields': (
                'assigned_to', 'due_date', 'completed_at',
            )
        }),
        (_('Response'), {
            'fields': (
                'response_data',
            ),
            'classes': ('collapse',),
        }),
    )
    
    actions = ['mark_completed', 'mark_rejected']
    
    def mark_completed(self, request, queryset):
        """Mark selected requests as completed."""
        for dsr in queryset.filter(status=DataSubjectRequest.Status.PENDING):
            dsr.complete()
        
        self.message_user(
            request,
            f"Completed {queryset.count()} requests.",
            messages.SUCCESS
        )
    mark_completed.short_description = _("Mark as completed")
    
    def mark_rejected(self, request, queryset):
        """Mark selected requests as rejected."""
        from django.contrib.admin.utils import quote
        
        updated = queryset.filter(
            status=DataSubjectRequest.Status.PENDING
        ).update(
            status=DataSubjectRequest.Status.REJECTED,
            rejection_reason='Rejected by administrator',
        )
        self.message_user(
            request,
            f"Rejected {updated} requests.",
            messages.WARNING
        )
    mark_rejected.short_description = _("Mark as rejected")
