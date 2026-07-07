"""
JOL-HUB Multi-Tenant Isolation Tests
SOC2 CC6.2 / GDPR Article 32 / ISO 27001 A.9.4

Comprehensive tests for multi-tenant isolation verification.
"""

import pytest
import threading
import uuid
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from pathlib import Path

# Add project root to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from backend.django.apps.crm.tenant_verification import (
    TenantIsolationVerifier,
    VerificationStatus,
    VerificationResult,
    IsolationAuditReport,
    verify_tenant_isolation,
    TenantIsolationEnforcer,
)


# =============================================================================
# FIXTURES
# =============================================================================

@pytest.fixture
def verifier():
    """Create a tenant isolation verifier."""
    return TenantIsolationVerifier()


@pytest.fixture
def mock_organization():
    """Create a mock organization."""
    org = Mock()
    org.id = uuid.uuid4()
    org.name = "Test Parish"
    org.country = "LT"
    org.compliance_level = "gdpr"
    return org


# =============================================================================
# VERIFICATION RESULT TESTS
# =============================================================================

class TestVerificationResult:
    """Tests for VerificationResult dataclass."""
    
    def test_result_creation(self):
        """Test creating a verification result."""
        result = VerificationResult(
            check_id="TEST-001",
            check_name="Test Check",
            status=VerificationStatus.PASS,
            message="Test passed",
        )
        
        assert result.check_id == "TEST-001"
        assert result.status == VerificationStatus.PASS
        assert result.timestamp is not None
    
    def test_result_to_dict(self):
        """Test converting result to dictionary."""
        result = VerificationResult(
            check_id="TEST-002",
            check_name="Test Check",
            status=VerificationStatus.FAIL,
            message="Test failed",
            details={"key": "value"},
            remediation="Fix the issue",
        )
        
        data = result.to_dict()
        
        assert data["check_id"] == "TEST-002"
        assert data["status"] == "fail"
        assert data["details"]["key"] == "value"
        assert data["remediation"] == "Fix the issue"


# =============================================================================
# THREAD-LOCAL ISOLATION TESTS
# =============================================================================

class TestThreadLocalIsolation:
    """Tests for thread-local context isolation."""
    
    def test_context_set_and_get(self):
        """Test setting and getting tenant context."""
        from backend.django.apps.crm.middleware import (
            set_tenant_context,
            get_current_tenant_id,
            clear_tenant_context,
            TenantContext,
        )
        
        tenant_id = str(uuid.uuid4())
        context = TenantContext(
            tenant_id=tenant_id,
            tenant_name="Test",
            country_code="LT",
            data_residency_region="EU",
            compliance_level="gdpr",
            request_id="test-123",
        )
        
        # Set context
        set_tenant_context(context)
        
        # Get context
        retrieved_id = get_current_tenant_id()
        
        # Clear context
        clear_tenant_context()
        
        assert retrieved_id == tenant_id
        assert get_current_tenant_id() is None
    
    def test_context_thread_safety(self):
        """Test that context is isolated between threads."""
        from backend.django.apps.crm.middleware import (
            set_tenant_context,
            get_current_tenant_id,
            clear_tenant_context,
            TenantContext,
        )
        
        results = {}
        
        def thread_func(thread_id, tenant_id):
            # Set context for this thread
            context = TenantContext(
                tenant_id=tenant_id,
                tenant_name=f"Thread {thread_id}",
                country_code="LT",
                data_residency_region="EU",
                compliance_level="gdpr",
                request_id=f"thread-{thread_id}",
            )
            set_tenant_context(context)
            
            # Get context in this thread
            results[thread_id] = get_current_tenant_id()
            
            # Clear context
            clear_tenant_context()
        
        # Create two threads with different tenant IDs
        tenant_1 = str(uuid.uuid4())
        tenant_2 = str(uuid.uuid4())
        
        t1 = threading.Thread(target=thread_func, args=(1, tenant_1))
        t2 = threading.Thread(target=thread_func, args=(2, tenant_2))
        
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        
        # Each thread should have its own context
        assert results[1] == tenant_1
        assert results[2] == tenant_2
    
    def test_context_clear_prevents_leakage(self):
        """Test that cleared context doesn't leak."""
        from backend.django.apps.crm.middleware import (
            set_tenant_context,
            get_current_tenant_id,
            clear_tenant_context,
            TenantContext,
        )
        
        # Set context
        context = TenantContext(
            tenant_id="tenant-1",
            tenant_name="Test",
            country_code="LT",
            data_residency_region="EU",
            compliance_level="gdpr",
            request_id="test",
        )
        set_tenant_context(context)
        
        # Clear context
        clear_tenant_context()
        
        # Verify cleared
        assert get_current_tenant_id() is None


# =============================================================================
# DATABASE ISOLATION TESTS
# =============================================================================

class TestDatabaseIsolation:
    """Tests for database-level tenant isolation."""
    
    def test_verifier_database_checks(self, verifier):
        """Test that database isolation checks run."""
        results = verifier.verify_all()
        
        # Should have results
        assert len(results) > 0
        
        # Should have database-related checks
        db_checks = [r for r in results if "DB" in r.check_id]
        assert len(db_checks) > 0
    
    def test_organization_fk_check(self, verifier):
        """Test organization FK check."""
        result = verifier._check_organization_foreign_keys()
        
        assert result.check_id == "TENANT-DB-002"
        assert result.status in [VerificationStatus.PASS, VerificationStatus.FAIL, VerificationStatus.WARNING]
    
    def test_tenant_index_check(self, verifier):
        """Test tenant index check."""
        result = verifier._check_tenant_index_coverage()
        
        assert result.check_id == "TENANT-DB-003"
        assert result.status in [VerificationStatus.PASS, VerificationStatus.WARNING]


# =============================================================================
# QUERYSET ISOLATION TESTS
# =============================================================================

class TestQuerysetIsolation:
    """Tests for QuerySet-level tenant isolation."""
    
    def test_queryset_filtering_check(self, verifier):
        """Test QuerySet filtering check."""
        result = verifier._check_viewset_tenant_filtering()
        
        assert result.check_id == "TENANT-QS-001"
        assert result.status in [VerificationStatus.PASS, VerificationStatus.WARNING]
    
    def test_middleware_installed_check(self, verifier):
        """Test middleware installation check."""
        result = verifier._check_queryset_filter_consistency()
        
        assert result.check_id == "TENANT-QS-002"
        # Should find middleware if properly configured
        assert result.status in [VerificationStatus.PASS, VerificationStatus.FAIL]


# =============================================================================
# API ISOLATION TESTS
# =============================================================================

class TestAPIIsolation:
    """Tests for API-level tenant isolation."""
    
    def test_cross_tenant_decorator_check(self, verifier):
        """Test cross-tenant decorator check."""
        result = verifier._check_cross_tenant_decorator()
        
        assert result.check_id == "TENANT-API-001"
        assert result.status in [VerificationStatus.PASS, VerificationStatus.WARNING]
    
    def test_api_response_filtering_check(self, verifier):
        """Test API response filtering check."""
        result = verifier._check_api_response_filtering()
        
        assert result.check_id == "TENANT-API-002"
        assert result.status in [VerificationStatus.PASS, VerificationStatus.WARNING]


# =============================================================================
# CACHE ISOLATION TESTS
# =============================================================================

class TestCacheIsolation:
    """Tests for cache-level tenant isolation."""
    
    def test_cache_key_prefixing_check(self, verifier):
        """Test cache key prefixing check."""
        result = verifier._check_cache_key_prefixing()
        
        assert result.check_id == "TENANT-CACHE-001"
        assert result.status in [VerificationStatus.PASS, VerificationStatus.WARNING]


# =============================================================================
# ENFORCER TESTS
# =============================================================================

class TestTenantIsolationEnforcer:
    """Tests for TenantIsolationEnforcer."""
    
    def test_validate_model_save_same_tenant(self):
        """Test model save validation with same tenant."""
        instance = Mock()
        instance.organization_id = "tenant-1"
        
        # Should pass for same tenant
        result = TenantIsolationEnforcer.validate_model_save(instance, "tenant-1")
        assert result is True
    
    def test_validate_model_save_cross_tenant_blocked(self):
        """Test model save validation blocks cross-tenant."""
        instance = Mock()
        instance.organization_id = "tenant-2"
        
        # Should raise PermissionDenied
        from django.core.exceptions import PermissionDenied
        
        with pytest.raises(PermissionDenied):
            TenantIsolationEnforcer.validate_model_save(instance, "tenant-1")
    
    def test_validate_response_data_same_tenant(self):
        """Test response validation with same tenant."""
        data = {
            "id": "123",
            "name": "Test",
            "organization_id": "tenant-1",
        }
        
        result = TenantIsolationEnforcer.validate_response_data(data, "tenant-1")
        assert result is True
    
    def test_validate_response_data_cross_tenant_detected(self):
        """Test response validation detects cross-tenant data."""
        data = {
            "id": "123",
            "name": "Test",
            "organization_id": "tenant-2",  # Different tenant!
        }
        
        result = TenantIsolationEnforcer.validate_response_data(data, "tenant-1")
        assert result is False
    
    def test_validate_response_nested_data(self):
        """Test response validation with nested data."""
        data = {
            "id": "123",
            "nested": {
                "organization_id": "tenant-1",
                "items": [
                    {"organization_id": "tenant-1"},
                    {"organization_id": "tenant-2"},  # Cross-tenant in array!
                ]
            }
        }
        
        result = TenantIsolationEnforcer.validate_response_data(data, "tenant-1")
        assert result is False


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

class TestTenantIsolationIntegration:
    """Integration tests for tenant isolation."""
    
    def test_full_verification_suite(self, verifier):
        """Test running full verification suite."""
        results = verifier.verify_all()
        
        # Should have multiple check categories
        check_ids = [r.check_id for r in results]
        
        # Database checks
        assert any("DB" in cid for cid in check_ids)
        
        # Model checks
        assert any("MODEL" in cid or "DB-002" in cid for cid in check_ids)
        
        # QuerySet checks
        assert any("QS" in cid for cid in check_ids)
        
        # Context checks
        assert any("CTX" in cid for cid in check_ids)
        
        # API checks
        assert any("API" in cid for cid in check_ids)
    
    def test_verification_result_counts(self, verifier):
        """Test that verification produces expected result counts."""
        results = verifier.verify_all()
        
        # Should have at least 10 checks
        assert len(results) >= 10
        
        # All results should have required fields
        for result in results:
            assert result.check_id
            assert result.check_name
            assert result.status
            assert result.message
    
    def test_all_status_types_valid(self, verifier):
        """Test that all status types are valid VerificationStatus."""
        results = verifier.verify_all()
        
        for result in results:
            assert isinstance(result.status, VerificationStatus)


# =============================================================================
# SECURITY TESTS
# =============================================================================

class TestSecurityScenarios:
    """Tests for security attack scenarios."""
    
    def test_cross_tenant_id_manipulation(self):
        """Test that manipulated tenant IDs are caught."""
        from backend.django.apps.crm.middleware import TenantDataAccessValidator
        
        # Create mock object with different tenant
        obj = Mock()
        obj.organization_id = "tenant-attacker"
        
        # Set current tenant to victim
        from backend.django.apps.crm.middleware import (
            set_tenant_context,
            clear_tenant_context,
            TenantContext,
        )
        
        context = TenantContext(
            tenant_id="tenant-victim",
            tenant_name="Victim",
            country_code="LT",
            data_residency_region="EU",
            compliance_level="gdpr",
            request_id="test",
        )
        set_tenant_context(context)
        
        # Validate should fail
        result = TenantDataAccessValidator.validate_organization(obj)
        
        clear_tenant_context()
        
        assert result is False
    
    def test_missing_tenant_context_blocked(self):
        """Test that missing tenant context is blocked."""
        from backend.django.apps.crm.middleware import (
            clear_tenant_context,
            TenantDataAccessValidator,
        )
        
        # Ensure no context
        clear_tenant_context()
        
        obj = Mock()
        obj.organization_id = "some-tenant"
        
        # Validate should fail (no context)
        result = TenantDataAccessValidator.validate_organization(obj)
        
        assert result is False


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

def run_tests():
    """Run all tenant isolation tests."""
    print("=" * 60)
    print("JOL-HUB Multi-Tenant Isolation Tests")
    print("SOC2 CC6.2 / GDPR Article 32 / ISO 27001 A.9.4")
    print("=" * 60)
    print()
    
    exit_code = pytest.main([__file__, "-v", "--tb=short"])
    
    print()
    print("=" * 60)
    print(f"Tests completed with exit code: {exit_code}")
    print("=" * 60)
    
    return exit_code


if __name__ == "__main__":
    run_tests()
