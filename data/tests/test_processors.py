"""
JOL-HUB Data Module Tests
GDPR Article 30 Compliance Tests
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal

from src.config import (
    DataClassification,
    RetentionPolicy,
    DataProcessingActivity,
    DataModuleConfig,
    PROCESSING_ACTIVITIES,
)
from src.processors import (
    DataProcessor,
    DonationProcessor,
    UserdataProcessor,
    ProcessingResult,
)
from src.validators import (
    DataValidator,
    DonationValidator,
    UserValidator,
    ValidationResult,
    ValidationSeverity,
    validate_batch,
)
from src.audit import (
    AuditLogger,
    AuditEvent,
    AuditAction,
)


class TestDataClassification:
    """Test data classification enum."""
    
    def test_classification_values(self):
        """Test that all GDPR classification levels exist."""
        assert DataClassification.PUBLIC.value == "public"
        assert DataClassification.INTERNAL.value == "internal"
        assert DataClassification.CONFIDENTIAL.value == "confidential"
        assert DataClassification.RESTRICTED.value == "restricted"


class TestRetentionPolicy:
    """Test retention policy configuration."""
    
    def test_financial_retention(self):
        """Financial records should be kept 7 years (2555 days)."""
        assert RetentionPolicy.FINANCIAL.value == timedelta(days=2555)
    
    def test_donation_retention(self):
        """Donation records should be kept 7 years."""
        assert RetentionPolicy.DONATIONS.value == timedelta(days=2555)
    
    def test_log_retention(self):
        """Logs should be kept 90 days."""
        assert RetentionPolicy.LOGS.value == timedelta(days=90)


class TestProcessingActivities:
    """Test GDPR Article 30 processing activities registry."""
    
    def test_processing_activities_exist(self):
        """Should have processing activities defined."""
        assert len(PROCESSING_ACTIVITIES) >= 3
    
    def test_donation_processing_activity(self):
        """Donation processing should have required GDPR fields."""
        activity = next(
            (a for a in PROCESSING_ACTIVITIES if a.name == "donation_processing"),
            None
        )
        assert activity is not None
        assert activity.purpose == "Process and record charitable donations"
        assert activity.data_controller == "JOL-HUB"
        assert "financial" in activity.data_categories
        assert activity.legal_basis != ""
        assert len(activity.security_measures) > 0
    
    def test_all_activities_have_legal_basis(self):
        """All processing activities must have a legal basis (GDPR Art. 6)."""
        for activity in PROCESSING_ACTIVITIES:
            assert activity.legal_basis != "", f"Missing legal basis for {activity.name}"


class TestDonationProcessor:
    """Test donation processing."""
    
    def test_valid_donation_processing(self):
        """Valid donation should process successfully."""
        processor = DonationProcessor()
        donations = [{
            "id": "test-123",
            "donor_id": "donor-456",
            "amount": "100.00",
            "currency": "EUR",
            "date": "2026-03-29",
        }]
        
        result = processor.process(donations)
        
        # Valid donation should be processed without errors
        assert result.records_processed == 1
        assert result.records_failed == 0
        # success is True if no exceptions occurred
        assert result.success
    
    def test_invalid_donation_missing_field(self):
        """Donation missing required field should fail."""
        processor = DonationProcessor()
        donations = [{
            "id": "test-123",
            "donor_id": "donor-456",
            # Missing amount
            "currency": "EUR",
        }]
        
        result = processor.process(donations)
        
        # Missing field should cause failure
        assert result.records_failed == 1
        assert len(result.errors) > 0
    
    def test_negative_donation_rejected(self):
        """Negative donation amount should be rejected."""
        processor = DonationProcessor()
        donations = [{
            "id": "test-123",
            "donor_id": "donor-456",
            "amount": "-50.00",
            "currency": "EUR",
            "date": "2026-03-29",
        }]
        
        result = processor.process(donations)
        
        # Negative amount should cause failure
        assert result.records_failed == 1


class TestValidators:
    """Test data validators."""
    
    def test_donation_validator_required_fields(self):
        """Donation validator should check required fields."""
        validator = DonationValidator()
        result = validator.validate({})
        
        assert not result.is_valid
        assert len(result.errors) > 0
    
    def test_donation_validator_valid_data(self):
        """Valid donation should pass validation."""
        validator = DonationValidator()
        result = validator.validate({
            "donor_id": "donor-123",
            "amount": 100.00,
            "currency": "EUR",
            "date": "2026-03-29",
        })
        
        assert result.is_valid
    
    def test_user_validator_consent_warning(self):
        """User without consent should generate warning."""
        validator = UserValidator()
        result = validator.validate({
            "email": "test@example.com",
        })
        
        # Should be valid but have warnings about consent
        assert result.is_valid
        assert len(result.warnings) > 0
    
    def test_invalid_email_rejected(self):
        """Invalid email format should be rejected."""
        validator = UserValidator()
        result = validator.validate({
            "email": "not-an-email",
        })
        
        assert not result.is_valid


class TestAuditLogger:
    """Test audit logging."""
    
    def test_audit_event_creation(self):
        """Test audit event dataclass."""
        event = AuditEvent(
            action="create",
            resource_type="donation",
            resource_id="donation-123",
            actor="user@example.com",
        )
        
        assert event.action == "create"
        assert event.resource_type == "donation"
        assert event.event_id is not None
    
    def test_audit_event_serialization(self):
        """Test audit event can be serialized to JSON."""
        event = AuditEvent(
            action="read",
            resource_type="user",
            resource_id="user-123",
            actor="admin@example.com",
            metadata={"ip": "192.168.1.1"},
        )
        
        json_str = event.to_json()
        data = event.to_dict()
        
        assert isinstance(json_str, str)
        assert "action" in data
        assert "timestamp" in data


class TestGDPRCompliance:
    """Test GDPR compliance features."""
    
    def test_sensitive_data_detection(self):
        """Validator should detect sensitive data categories."""
        validator = DataValidator()
        result = validator.validate({
            "notes": "Patient has diabetes diagnosis",
        })
        
        # Should warn about health data
        health_warnings = [w for w in result.warnings if "health" in w.message.lower()]
        assert len(health_warnings) > 0
    
    def test_data_subject_access_support(self):
        """Processor should support data subject access requests."""
        processor = DonationProcessor()
        
        # Should have method for data subject access
        assert hasattr(processor, "get_data_subject_data")
        assert callable(getattr(processor, "get_data_subject_data"))
        
        # Method should be callable
        data = processor.get_data_subject_data("donor-123")
        assert isinstance(data, dict)
    
    def test_data_subject_erasure_support(self):
        """Processor should support right to erasure."""
        processor = DonationProcessor()
        
        # Should have method for data subject erasure
        assert hasattr(processor, "delete_data_subject_data")
        assert callable(getattr(processor, "delete_data_subject_data"))


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
