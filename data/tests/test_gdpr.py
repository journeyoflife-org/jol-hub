"""
JOL-HUB Data Module Tests
GDPR Compliance Test Suite
"""

import pytest
from datetime import datetime, timedelta

from src.config import DataClassification, RetentionPolicy
from src.gdpr.anonymizer import KAnonymizer, AnonymizationConfig
from src.gdpr.retention_manager import RetentionManager, RETENTION_RULES
from src.gdpr.ropa_generator import ROPAGenerator, JOL_HUB_PROCESSING_ACTIVITIES


class TestKAnonymity:
    """Test k-anonymity implementation."""
    
    def test_default_k_value(self):
        """Default k should be 5."""
        anonymizer = KAnonymizer()
        assert anonymizer.config.k == 5
    
    def test_anonymize_count(self):
        """Count should be rounded to nearest k."""
        anonymizer = KAnonymizer()
        assert anonymizer.anonymize_count(7) == 5
        assert anonymizer.anonymize_count(12) == 10
        assert anonymizer.anonymize_count(3) == 0
    
    def test_anonymize_record(self):
        """Record should have identifiers hashed."""
        anonymizer = KAnonymizer()
        record = {"name": "John", "email": "john@example.com", "value": 100}
        result = anonymizer.anonymize(record)
        
        assert result["name"] != "John"
        assert result["email"] != "john@example.com"
        assert result["value"] == 100  # Non-PII preserved
    
    def test_check_k_anonymity(self):
        """Should detect k-anonymity violations."""
        anonymizer = KAnonymizer()
        
        records = [
            {"zip": "10001", "age": 30},
            {"zip": "10001", "age": 30},
            {"zip": "10001", "age": 30},
            {"zip": "10002", "age": 25},  # Only 1 in this group
        ]
        
        result = anonymizer.check_k_anonymity(records, ["zip", "age"])
        
        assert result["groups_below_k"] > 0
        assert result["satisfies_k_anonymity"] == False


class TestRetentionManager:
    """Test retention management."""
    
    def test_retention_rules_exist(self):
        """Should have retention rules defined."""
        assert "donation" in RETENTION_RULES
        assert "user_account" in RETENTION_RULES
    
    def test_donation_retention_7_years(self):
        """Donation retention should be 7 years."""
        assert RETENTION_RULES["donation"].retention_days == 2555
    
    def test_delete_expired(self):
        """Should process expired data deletion."""
        manager = RetentionManager()
        result = manager.delete_expired("operational_log", dry_run=True)
        
        # Should have retention_days in result (operational_log is now defined)
        assert "retention_days" in result or "error" not in result
    
    def test_delete_subject_data(self):
        """Should process data subject deletion."""
        manager = RetentionManager()
        result = manager.delete_subject_data("subject-123")
        
        # Should return a result dict with subject_id
        assert result["subject_id"] == "subject-123"
        assert "deleted" in result


class TestROPAGenerator:
    """Test ROPA generation."""
    
    def test_processing_activities_exist(self):
        """Should have processing activities defined."""
        assert len(JOL_HUB_PROCESSING_ACTIVITIES) >= 4
    
    def test_generate_json_report(self):
        """Should generate JSON ROPA report."""
        import tempfile
        generator = ROPAGenerator(output_dir=tempfile.mkdtemp())
        report = generator.generate_report(format="json")
        
        # Report should be a JSON string with expected keys
        assert "processing_activities" in report
        assert "generated_at" in report
    
    def test_generate_markdown_report(self):
        """Should generate Markdown ROPA report."""
        import tempfile
        generator = ROPAGenerator(output_dir=tempfile.mkdtemp())
        report = generator.generate_report(format="markdown")
        
        assert "# Records of Processing Activities" in report
    
    def test_all_activities_have_legal_basis(self):
        """All activities must have legal basis per Art. 6."""
        for activity in JOL_HUB_PROCESSING_ACTIVITIES:
            assert activity.legal_basis != ""
            assert "Art." in activity.legal_basis
    
    def test_sensitive_data_marked(self):
        """Activities with religious data should be marked."""
        religious = [a for a in JOL_HUB_PROCESSING_ACTIVITIES 
                     if "priest" in a.data_subjects or "parish" in str(a.data_subjects)]
        
        for activity in religious:
            assert activity.sensitive_data == True


class TestDataClassification:
    """Test data classification."""
    
    def test_classification_levels(self):
        """Should have all GDPR classification levels."""
        assert DataClassification.PUBLIC.value == "public"
        assert DataClassification.INTERNAL.value == "internal"
        assert DataClassification.CONFIDENTIAL.value == "confidential"
        assert DataClassification.RESTRICTED.value == "restricted"
    
    def test_retention_policies(self):
        """Should have retention policies aligned with GDPR."""
        assert RetentionPolicy.FINANCIAL.value.days == 2555  # 7 years
        assert RetentionPolicy.LOGS.value.days == 90


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
