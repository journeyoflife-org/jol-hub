"""
Tests for Donation views and audit logging.

GDPR Article 30 - Records of processing activities
SOC2 CC7.2 - Tamper-evident audit logging
PCI-DSS Requirement 10 - Track and monitor financial transactions
"""

import pytest
from decimal import Decimal
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from django.test import RequestFactory
from django.contrib.auth import get_user_model

# Note: These tests require Django to be configured
# Run with: pytest backend/django/apps/donations/tests.py --ds=core.settings.development

User = get_user_model()


class TestDonationRefundAuditLogging:
    """
    Test suite for donation refund audit logging.
    
    GDPR Article 30(1)(c) - Must record who, when, what changed
    SOC2 CC7.2 - Tamper-evident hash chain
    PCI-DSS Requirement 10 - Track all financial transactions
    """
    
    @pytest.fixture
    def factory(self):
        return RequestFactory()
    
    @pytest.fixture
    def user(self, db):
        """Create a test user."""
        return User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
        )
    
    @pytest.fixture
    def organization(self, db):
        """Create a test organization."""
        from apps.organizations.models import Organization
        return Organization.objects.create(
            name='Test Parish',
            country='lt',
            slug='test-parish',
        )
    
    @pytest.fixture
    def donation(self, db, organization, user):
        """Create a completed donation for refund testing."""
        from apps.donations.models import Donation
        return Donation.objects.create(
            organization=organization,
            donor=user,
            amount=Decimal('100.00'),
            currency='EUR',
            status=Donation.STATUS_COMPLETED,
            payment_method='card',
            donor_email='donor@example.com',
        )
    
    def test_refund_creates_audit_entry(self, db, factory, user, donation):
        """
        SOC2 CC7.2 - Refund must create tamper-evident audit entry.
        
        Verify that processing a refund creates an AuditEntry record
        with all required compliance fields.
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        # Create request
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/', {'reason': 'Customer request'})
        request.user = user
        request.META = {
            'REMOTE_ADDR': '192.168.1.100',
            'HTTP_USER_AGENT': 'TestAgent/1.0',
        }
        
        # Get initial audit entry count
        initial_count = AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
        ).count()
        
        # Process refund
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        # Verify audit entry was created
        assert AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
            operation='donation_refund',
        ).count() == initial_count + 1
    
    def test_refund_audit_records_who_authorized(self, db, factory, user, donation):
        """
        GDPR Article 30(1)(c) - Must record WHO authorized the refund.
        
        Verify audit entry contains actor_user and actor_ip.
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/', {'reason': 'Customer request'})
        request.user = user
        request.META = {
            'REMOTE_ADDR': '192.168.1.100',
            'HTTP_USER_AGENT': 'TestAgent/1.0',
        }
        
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        # Get the audit entry
        audit_entry = AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
            operation='donation_refund',
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.actor_user == user, "WHO: actor_user must be recorded"
        assert audit_entry.actor_ip == '192.168.1.100', "WHO: actor_ip must be recorded"
    
    def test_refund_audit_records_when(self, db, factory, user, donation):
        """
        GDPR Article 30(1)(c) - Must record WHEN the refund occurred.
        
        Verify audit entry has created_at timestamp.
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/')
        request.user = user
        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        
        before_refund = datetime.utcnow()
        
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        after_refund = datetime.utcnow()
        
        audit_entry = AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
            operation='donation_refund',
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.created_at is not None, "WHEN: created_at must be recorded"
        # Verify timestamp is within test window
        assert before_refund <= audit_entry.created_at.replace(tzinfo=None) <= after_refund
    
    def test_refund_audit_records_what_changed(self, db, factory, user, donation):
        """
        GDPR Article 30(1)(c) - Must record WHAT changed.
        
        Verify audit entry contains before/after state.
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/', {'reason': 'Duplicate charge'})
        request.user = user
        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        audit_entry = AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
            operation='donation_refund',
        ).first()
        
        assert audit_entry is not None
        details = audit_entry.details
        
        # Verify WHAT changed
        assert 'field_changes' in details, "WHAT: field_changes must be recorded"
        assert 'status' in details['field_changes'], "WHAT: status change must be recorded"
        assert details['field_changes']['status']['old'] == 'completed'
        assert details['field_changes']['status']['new'] == 'refunded'
        
        # Verify financial details
        assert 'amount' in details, "WHAT: amount must be recorded"
        assert 'currency' in details, "WHAT: currency must be recorded"
        assert details['refund_reason'] == 'Duplicate charge', "WHAT: refund_reason must be recorded"
    
    def test_refund_audit_has_tamper_evident_hash_chain(self, db, factory, user, donation):
        """
        SOC2 CC7.2 / ISO 27001 A.12.4.2 - Tamper-evident hash chain.
        
        Verify audit entry has:
        - entry_hash (current entry hash)
        - previous_hash (links to previous entry)
        - sequence_number (for gap detection)
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/')
        request.user = user
        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        audit_entry = AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
            operation='donation_refund',
        ).first()
        
        assert audit_entry is not None
        assert audit_entry.entry_hash, "Hash chain: entry_hash must exist"
        assert len(audit_entry.entry_hash) == 64, "Hash chain: entry_hash must be SHA-256 (64 chars)"
        assert audit_entry.previous_hash is not None, "Hash chain: previous_hash must exist"
        assert audit_entry.sequence_number > 0, "Hash chain: sequence_number must be positive"
    
    def test_refund_audit_chain_verification(self, db, factory, user, donation, organization):
        """
        SOC2 CC7.2 - Hash chain must be verifiable.
        
        Create multiple refund audit entries and verify chain integrity.
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        # Create first audit entry (genesis for this org)
        first_entry = AuditEntry.objects.create(
            organization=organization,
            event_type=AuditEntry.EventType.CREATE,
            operation='test_setup',
            entity_type='test',
            entity_id='test-1',
        )
        
        # Process refund
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/')
        request.user = user
        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        # Verify chain
        result = AuditEntry.verify_chain(organization.id)
        
        assert result['valid'], f"Hash chain verification failed: {result.get('errors', [])}"
    
    def test_refund_atomic_with_audit(self, db, factory, user, donation):
        """
        Verify refund and audit entry are atomic.
        
        If audit creation fails, refund should also fail.
        """
        from apps.donations.views import DonationRefundView
        from apps.donations.models import Donation
        from apps.crm.models import AuditEntry
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/')
        request.user = user
        request.META = {'REMOTE_ADDR': '127.0.0.1'}
        
        view = DonationRefundView()
        
        # Mock AuditEntry.objects.create to raise exception
        with patch.object(AuditEntry.objects, 'create', side_effect=Exception('DB error')):
            try:
                response = view.post(request, donation.id)
            except Exception:
                pass  # Expected to fail
        
        # Refresh donation from DB
        donation.refresh_from_db()
        
        # Donation status should NOT have changed (transaction rolled back)
        assert donation.status == Donation.STATUS_COMPLETED, \
            "Refund should be rolled back if audit fails"
    
    def test_refund_audit_pci_dss_compliance(self, db, factory, user, donation):
        """
        PCI-DSS Requirement 10 - Track all access to cardholder data.
        
        Verify audit entry includes all required PCI-DSS fields.
        """
        from apps.donations.views import DonationRefundView
        from apps.crm.models import AuditEntry
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/')
        request.user = user
        request.META = {
            'REMOTE_ADDR': '192.168.1.50',
            'HTTP_USER_AGENT': 'Mozilla/5.0 (Test Browser)',
        }
        
        view = DonationRefundView()
        response = view.post(request, donation.id)
        
        audit_entry = AuditEntry.objects.filter(
            entity_type='donation',
            entity_id=str(donation.id),
            operation='donation_refund',
        ).first()
        
        assert audit_entry is not None
        
        # PCI-DSS Requirement 10.2 - Log all individual user accesses
        assert audit_entry.actor_user is not None, "PCI-DSS: Must log user who performed action"
        
        # PCI-DSS Requirement 10.3 - Record log details
        assert audit_entry.actor_ip is not None, "PCI-DSS: Must log origin of action"
        assert audit_entry.actor_user_agent is not None, "PCI-DSS: Must log user agent"
        assert audit_entry.created_at is not None, "PCI-DSS: Must log date/time"
        assert audit_entry.event_type == AuditEntry.EventType.FINANCIAL_TRANSACTION, \
            "PCI-DSS: Must log type of action"


class TestDonationRefundAuthorization:
    """
    Test authorization requirements for donation refunds.
    
    SOC2 CC6.1 - Access controls
    GDPR Article 32 - Security of processing
    """
    
    def test_refund_requires_authentication(self, db, factory, donation):
        """Verify unauthenticated requests are rejected."""
        from apps.donations.views import DonationRefundView
        
        request = factory.post(f'/api/v1/donations/{donation.id}/refund/')
        request.user = Mock(is_authenticated=False)
        
        view = DonationRefundView()
        
        # Should fail permission check
        assert not view.permission_classes[0]().has_permission(request, view)
    
    def test_refund_rate_limited(self, db, factory, user, donation):
        """
        SOC2 CC6.1 - Rate limiting to prevent financial abuse.
        
        Verify DonationRefundThrottle is applied.
        """
        from apps.donations.views import DonationRefundView
        
        view = DonationRefundView()
        
        # Verify throttle class is configured
        assert len(view.throttle_classes) > 0
        assert any('Refund' in t.__name__ for t in view.throttle_classes)
