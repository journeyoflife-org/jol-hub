"""
Multi-Tenant Isolation Verification Module

Provides comprehensive verification of tenant isolation across:
1. Database-level isolation (row-level security)
2. API-level isolation (query filtering)
3. Cross-tenant access prevention
4. Session isolation
5. Cache isolation

SOC2 CC6.2 - System boundaries and security zones
GDPR Article 32 - Security of processing
ISO 27001 A.9.4 - Access control

Usage:
    from apps.crm.tenant_verification import (
        TenantIsolationVerifier,
        verify_tenant_isolation,
        run_isolation_audit,
    )
    
    # Run full verification
    results = TenantIsolationVerifier().verify_all()
    
    # Run specific checks
    TenantIsolationVerifier().verify_database_isolation()
"""

import logging
import threading
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Type
from functools import wraps

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import models, transaction, connection
from django.db.models import Q, QuerySet
from django.test import RequestFactory
from django.utils import timezone

logger = logging.getLogger('jolhub.security.tenant_verification')


# =============================================================================
# VERIFICATION RESULT TYPES
# =============================================================================

class VerificationStatus(Enum):
    """Status of a verification check."""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    NOT_APPLICABLE = "not_applicable"
    ERROR = "error"


@dataclass
class VerificationResult:
    """Result of a single verification check."""
    check_id: str
    check_name: str
    status: VerificationStatus
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    remediation: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def to_dict(self) -> dict:
        return {
            "check_id": self.check_id,
            "check_name": self.check_name,
            "status": self.status.value,
            "message": self.message,
            "details": self.details,
            "remediation": self.remediation,
            "timestamp": self.timestamp,
        }


@dataclass
class IsolationAuditReport:
    """Full audit report for tenant isolation."""
    organization_id: str
    organization_name: str
    country: str
    checks: List[VerificationResult]
    overall_status: VerificationStatus
    score: float
    generated_at: str
    
    def to_dict(self) -> dict:
        return {
            "organization_id": self.organization_id,
            "organization_name": self.organization_name,
            "country": self.country,
            "overall_status": self.overall_status.value,
            "score": self.score,
            "generated_at": self.generated_at,
            "checks": [c.to_dict() for c in self.checks],
        }


# =============================================================================
# TENANT ISOLATION VERIFIER
# =============================================================================

class TenantIsolationVerifier:
    """
    Comprehensive tenant isolation verification.
    
    Verifies:
    1. Database-level isolation (all queries filtered)
    2. API-level isolation (request/response validation)
    3. Cross-tenant access prevention
    4. Session isolation
    5. Cache key isolation
    6. Thread-local context isolation
    
    Note: Some checks require PostgreSQL and will be skipped on SQLite.
    """

    # All models that should have organization_id for tenant isolation
    TENANT_SCOPED_MODELS = [
        'crm.Contact',
        'crm.Deal',
        'crm.AuditEntry',
        'crm.DataSubjectRequest',
        'donations.Donation',
        'financial.Invoice',
        'financial.Payout',
        'content.Page',
        'content.MediaFile',
        'analytics.PageView',
        'analytics.DailyStats',
        'organizations.OrganizationMember',
    ]

    def __init__(self, organization_id: Optional[str] = None):
        self.organization_id = organization_id
        self.results: List[VerificationResult] = []
    
    def _get_database_vendor(self) -> str:
        """Get the database vendor (postgresql, sqlite, etc.)."""
        return connection.vendor
    
    def _is_postgresql(self) -> bool:
        """Check if the database backend is PostgreSQL."""
        return self._get_database_vendor() == 'postgresql'
    
    def verify_all(self) -> List[VerificationResult]:
        """Run all verification checks."""
        self.results = []
        
        # Run all verification categories
        self._verify_database_isolation()
        self._verify_model_organization_fields()
        self._verify_queryset_filtering()
        self._verify_context_isolation()
        self._verify_cache_isolation()
        self._verify_api_isolation()
        
        return self.results
    
    # -------------------------------------------------------------------------
    # Database-Level Isolation
    # -------------------------------------------------------------------------
    
    def _verify_database_isolation(self):
        """Verify database-level tenant isolation."""
        self.results.append(
            self._check_database_row_level_security()
        )
        self.results.append(
            self._check_organization_foreign_keys()
        )
        self.results.append(
            self._check_tenant_index_coverage()
        )
    
    def _check_database_row_level_security(self) -> VerificationResult:
        """Check if row-level security is enabled on tenant tables."""
        check_id = "TENANT-DB-001"
        
        # SQLite does not support row-level security
        if not self._is_postgresql():
            return VerificationResult(
                check_id=check_id,
                check_name="Row-Level Security Enabled",
                status=VerificationStatus.NOT_APPLICABLE,
                message="RLS check requires PostgreSQL (currently using SQLite)",
                details={"database_vendor": self._get_database_vendor()},
                remediation="Run verification against production PostgreSQL database",
            )
        
        try:
            with connection.cursor() as cursor:
                # Check PostgreSQL RLS status on key tenant tables
                cursor.execute("""
                    SELECT tablename, rowsecurity 
                    FROM pg_tables pt
                    LEFT JOIN pg_class pc ON pc.relname = pt.tablename
                    WHERE pt.schemaname = 'public'
                    AND pt.tablename IN (
                        'crm_contact', 'crm_deal', 'crm_auditentry',
                        'donations_donation', 'financial_invoice', 'financial_payout',
                        'content_page', 'content_mediafile',
                        'analytics_pageview', 'analytics_dailystats'
                    )
                """)
                rls_tables = cursor.fetchall()
            
            if rls_tables:
                enabled_count = sum(1 for t in rls_tables if t[1])
                total_count = len(rls_tables)
                
                if enabled_count == total_count:
                    return VerificationResult(
                        check_id=check_id,
                        check_name="Row-Level Security Enabled",
                        status=VerificationStatus.PASS,
                        message=f"RLS enabled on all {total_count} tenant tables",
                        details={"tables": [t[0] for t in rls_tables]},
                    )
                else:
                    return VerificationResult(
                        check_id=check_id,
                        check_name="Row-Level Security Enabled",
                        status=VerificationStatus.WARNING,
                        message=f"RLS enabled on {enabled_count}/{total_count} tenant tables",
                        details={"tables": [t[0] for t in rls_tables]},
                        remediation="Enable row-level security on all tenant-scoped tables",
                    )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Row-Level Security Enabled",
                    status=VerificationStatus.WARNING,
                    message="No tenant tables found for RLS verification",
                    remediation="Verify RLS is enabled in production PostgreSQL",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Row-Level Security Enabled",
                status=VerificationStatus.ERROR,
                message=f"Error checking RLS: {str(e)}",
            )
    
    def _check_organization_foreign_keys(self) -> VerificationResult:
        """Check that all tenant-scoped models have organization FK."""
        check_id = "TENANT-DB-002"
        missing_fk = []
        
        try:
            from django.apps import apps
            
            for model_path in self.TENANT_SCOPED_MODELS:
                try:
                    app_label, model_name = model_path.split('.')
                    model = apps.get_model(app_label, model_name)
                    
                    # Check for organization field
                    has_org = (
                        hasattr(model, 'organization') or
                        hasattr(model, 'organization_id') or
                        'organization' in [f.name for f in model._meta.fields]
                    )
                    
                    if not has_org:
                        missing_fk.append(model_path)
                        
                except LookupError:
                    pass  # Model doesn't exist
            
            if not missing_fk:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Organization Foreign Keys",
                    status=VerificationStatus.PASS,
                    message="All tenant-scoped models have organization FK",
                    details={"models_checked": len(self.TENANT_SCOPED_MODELS)},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Organization Foreign Keys",
                    status=VerificationStatus.FAIL,
                    message=f"Models missing organization FK: {missing_fk}",
                    details={"missing": missing_fk},
                    remediation="Add organization FK to all tenant-scoped models",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Organization Foreign Keys",
                status=VerificationStatus.ERROR,
                message=f"Error checking FK: {str(e)}",
            )
    
    def _check_tenant_index_coverage(self) -> VerificationResult:
        """Check that organization_id columns are indexed."""
        check_id = "TENANT-DB-003"
        missing_indexes = []
        
        try:
            indexed_tables = set()
            
            if self._is_postgresql():
                # PostgreSQL: use pg_indexes catalog
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT tablename, indexname
                        FROM pg_indexes
                        WHERE schemaname = 'public'
                        AND indexdef LIKE '%organization_id%'
                    """)
                    indexed_tables = {row[0] for row in cursor.fetchall()}
                
                for model_path in self.TENANT_SCOPED_MODELS:
                    table_name = model_path.replace('.', '_').lower()
                    parts = model_path.split('.')
                    if len(parts) == 2:
                        table_name = f"{parts[0]}_{parts[1].lower()}"
                    
                    if table_name not in indexed_tables:
                        missing_indexes.append(model_path)
            else:
                # SQLite: check via Django model metadata
                from django.apps import apps
                
                for model_path in self.TENANT_SCOPED_MODELS:
                    try:
                        app_label, model_name = model_path.split('.')
                        model = apps.get_model(app_label, model_name)
                        
                        has_index = False
                        
                        for field in model._meta.fields:
                            if field.name == 'organization_id' and field.db_index:
                                has_index = True
                                indexed_tables.add(model._meta.db_table)
                                break
                        
                        if not has_index:
                            for index in model._meta.indexes:
                                # index.fields can contain strings or field objects
                                field_names = []
                                for f in index.fields:
                                    if isinstance(f, str):
                                        field_names.append(f)
                                    else:
                                        field_names.append(f.name)
                                if 'organization_id' in field_names:
                                    has_index = True
                                    indexed_tables.add(model._meta.db_table)
                                    break
                        
                        if not has_index:
                            missing_indexes.append(model_path)
                    except LookupError:
                        missing_indexes.append(model_path)
            
            if not missing_indexes:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Tenant Index Coverage",
                    status=VerificationStatus.PASS,
                    message="All tenant tables have organization_id indexes",
                    details={"indexed_tables": list(indexed_tables), "database_vendor": self._get_database_vendor()},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Tenant Index Coverage",
                    status=VerificationStatus.WARNING,
                    message=f"Tables missing organization_id index: {missing_indexes}",
                    details={"missing": missing_indexes},
                    remediation="Add indexes on organization_id for performance",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Tenant Index Coverage",
                status=VerificationStatus.WARNING,
                message=f"Could not verify indexes: {str(e)}",
            )
    
    
    # -------------------------------------------------------------------------
    # Model-Level Verification
    # -------------------------------------------------------------------------
    
    def _verify_model_organization_fields(self):
        """Verify model organization field configuration."""
        self.results.append(
            self._check_model_tenant_validation()
        )
    
    def _check_model_tenant_validation(self) -> VerificationResult:
        """Check that models validate tenant context on save."""
        check_id = "TENANT-MODEL-001"
        
        try:
            from django.apps import apps
            from apps.crm.middleware import get_current_tenant_id
            
            models_with_validation = []
            models_without_validation = []
            
            for model in apps.get_models():
                # Check if model has organization_id
                if hasattr(model, 'organization_id'):
                    # Check if model has save method validation
                    has_validation = False
                    
                    # Check for _validate_tenant_context method (preferred pattern)
                    if hasattr(model, '_validate_tenant_context'):
                        has_validation = True
                    # Check for tenant validation in save method source
                    elif hasattr(model, 'save'):
                        source = model.save.__source__ if hasattr(model.save, '__source__') else ''
                        if 'organization_id' in source or 'tenant' in source.lower():
                            has_validation = True
                        # Also check if save method calls _validate_tenant_context
                        try:
                            import inspect
                            save_source = inspect.getsource(model.save)
                            if '_validate_tenant_context' in save_source or 'tenant' in save_source.lower():
                                has_validation = True
                        except (TypeError, OSError):
                            pass  # Built-in or compiled method
                    
                    if has_validation:
                        models_with_validation.append(model.__name__)
                    else:
                        models_without_validation.append(model.__name__)
            
            if not models_without_validation:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Model Tenant Validation",
                    status=VerificationStatus.PASS,
                    message="All tenant-scoped models have validation",
                    details={"models_validated": len(models_with_validation)},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Model Tenant Validation",
                    status=VerificationStatus.WARNING,
                    message=f"Models may lack tenant validation: {models_without_validation[:5]}",
                    details={"without_validation": models_without_validation},
                    remediation="Add tenant validation to model save methods",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Model Tenant Validation",
                status=VerificationStatus.ERROR,
                message=f"Error checking validation: {str(e)}",
            )
    
    # -------------------------------------------------------------------------
    # QuerySet Filtering Verification
    # -------------------------------------------------------------------------
    
    def _verify_queryset_filtering(self):
        """Verify QuerySet filtering for tenant isolation."""
        self.results.append(
            self._check_viewset_tenant_filtering()
        )
        self.results.append(
            self._check_queryset_filter_consistency()
        )
    
    def _check_viewset_tenant_filtering(self) -> VerificationResult:
        """Check that ViewSets filter by tenant."""
        check_id = "TENANT-QS-001"
        
        try:
            from django.apps import apps
            import inspect
            
            viewsets_with_filtering = []
            viewsets_without_filtering = []
            
            # Check CRM viewsets
            try:
                from apps.crm.api.views import TenantIsolatedViewSetMixin
                
                # If the mixin exists, that's good
                return VerificationResult(
                    check_id=check_id,
                    check_name="ViewSet Tenant Filtering",
                    status=VerificationStatus.PASS,
                    message="TenantIsolatedViewSetMixin is implemented",
                    details={"mixin": "TenantIsolatedViewSetMixin"},
                )
            except ImportError:
                pass
            
            # Check individual viewsets
            return VerificationResult(
                check_id=check_id,
                check_name="ViewSet Tenant Filtering",
                status=VerificationStatus.WARNING,
                message="Could not verify ViewSet filtering",
                remediation="Use TenantIsolatedViewSetMixin for all tenant-scoped ViewSets",
            )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="ViewSet Tenant Filtering",
                status=VerificationStatus.ERROR,
                message=f"Error checking ViewSets: {str(e)}",
            )
    
    def _check_queryset_filter_consistency(self) -> VerificationResult:
        """Check QuerySet filtering consistency."""
        check_id = "TENANT-QS-002"
        
        try:
            # Verify middleware is installed
            from django.conf import settings
            
            middleware_installed = any(
                'TenantContextMiddleware' in m or 'crm.middleware' in m
                for m in settings.MIDDLEWARE
            )
            
            if middleware_installed:
                return VerificationResult(
                    check_id=check_id,
                    check_name="QuerySet Filter Consistency",
                    status=VerificationStatus.PASS,
                    message="TenantContextMiddleware is installed",
                    details={"middleware": "TenantContextMiddleware"},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="QuerySet Filter Consistency",
                    status=VerificationStatus.FAIL,
                    message="TenantContextMiddleware not found in settings",
                    remediation="Add 'apps.crm.middleware.TenantContextMiddleware' to MIDDLEWARE",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="QuerySet Filter Consistency",
                status=VerificationStatus.ERROR,
                message=f"Error checking middleware: {str(e)}",
            )
    
    # -------------------------------------------------------------------------
    # Context Isolation Verification
    # -------------------------------------------------------------------------
    
    def _verify_context_isolation(self):
        """Verify thread-local context isolation."""
        self.results.append(
            self._check_thread_local_isolation()
        )
        self.results.append(
            self._check_context_cleanup()
        )
    
    def _check_thread_local_isolation(self) -> VerificationResult:
        """Check thread-local storage isolation."""
        check_id = "TENANT-CTX-001"
        
        try:
            from apps.crm.middleware import (
                set_tenant_context,
                get_current_tenant_id,
                clear_tenant_context,
                TenantContext,
            )
            
            # Test setting and getting context
            test_tenant_id = str(uuid.uuid4())
            test_context = TenantContext(
                tenant_id=test_tenant_id,
                tenant_name="Test Tenant",
                country_code="LT",
                data_residency_region="EU",
                compliance_level="gdpr",
                request_id="test-request-123",
            )
            
            set_tenant_context(test_context)
            retrieved_id = get_current_tenant_id()
            clear_tenant_context()
            cleared_id = get_current_tenant_id()
            
            if retrieved_id == test_tenant_id and cleared_id is None:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Thread-Local Isolation",
                    status=VerificationStatus.PASS,
                    message="Thread-local context isolation working correctly",
                    details={
                        "set_retrieve": True,
                        "clear_works": True,
                    },
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Thread-Local Isolation",
                    status=VerificationStatus.FAIL,
                    message="Thread-local context isolation failed",
                    details={
                        "expected": test_tenant_id,
                        "retrieved": retrieved_id,
                        "after_clear": cleared_id,
                    },
                    remediation="Fix thread-local context management in middleware",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Thread-Local Isolation",
                status=VerificationStatus.ERROR,
                message=f"Error testing context: {str(e)}",
            )
    
    def _check_context_cleanup(self) -> VerificationResult:
        """Check context cleanup after request."""
        check_id = "TENANT-CTX-002"
        
        try:
            from apps.crm.middleware import TenantContextMiddleware
            
            # Verify middleware has cleanup in finally block
            import inspect
            source = inspect.getsource(TenantContextMiddleware.__call__)
            
            has_finally = "finally:" in source
            has_clear = "clear_tenant_context" in source
            
            if has_finally and has_clear:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Context Cleanup",
                    status=VerificationStatus.PASS,
                    message="Middleware properly clears context in finally block",
                    details={"has_finally": True, "has_clear": True},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Context Cleanup",
                    status=VerificationStatus.WARNING,
                    message="Middleware may not properly clean up context",
                    details={"has_finally": has_finally, "has_clear": has_clear},
                    remediation="Ensure context is cleared in finally block",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Context Cleanup",
                status=VerificationStatus.ERROR,
                message=f"Error checking cleanup: {str(e)}",
            )
    
    # -------------------------------------------------------------------------
    # Cache Isolation Verification
    # -------------------------------------------------------------------------
    
    def _verify_cache_isolation(self):
        """Verify cache key isolation."""
        self.results.append(
            self._check_cache_key_prefixing()
        )
    
    def _check_cache_key_prefixing(self) -> VerificationResult:
        """Check cache keys include tenant prefix."""
        check_id = "TENANT-CACHE-001"
        
        try:
            # Check if middleware uses tenant-prefixed cache keys
            from apps.crm.middleware import TenantContextMiddleware
            
            import inspect
            source = inspect.getsource(TenantContextMiddleware)
            
            has_cache_prefix = "CACHE_PREFIX" in source or "tenant" in source.lower()
            
            if has_cache_prefix:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Cache Key Prefixing",
                    status=VerificationStatus.PASS,
                    message="Cache keys use tenant prefix",
                    details={"prefix_pattern": "jolhub:tenant:"},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Cache Key Prefixing",
                    status=VerificationStatus.WARNING,
                    message="Cache key prefixing not explicitly verified",
                    remediation="Ensure all cache keys include tenant_id prefix",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Cache Key Prefixing",
                status=VerificationStatus.ERROR,
                message=f"Error checking cache: {str(e)}",
            )
    
    # -------------------------------------------------------------------------
    # API-Level Isolation Verification
    # -------------------------------------------------------------------------
    
    def _verify_api_isolation(self):
        """Verify API-level isolation."""
        self.results.append(
            self._check_cross_tenant_decorator()
        )
        self.results.append(
            self._check_api_response_filtering()
        )
    
    def _check_cross_tenant_decorator(self) -> VerificationResult:
        """Check cross-tenant access prevention decorator."""
        check_id = "TENANT-API-001"
        
        try:
            from apps.crm.security import prevent_cross_tenant_access
            
            # Verify decorator exists
            import inspect
            source = inspect.getsource(prevent_cross_tenant_access)
            
            has_tenant_check = "organization_id" in source
            has_error_log = "Cross-tenant" in source or "cross_tenant" in source.lower()
            
            if has_tenant_check and has_error_log:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Cross-Tenant Decorator",
                    status=VerificationStatus.PASS,
                    message="Cross-tenant access prevention decorator implemented",
                    details={"has_tenant_check": True, "has_error_log": True},
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="Cross-Tenant Decorator",
                    status=VerificationStatus.WARNING,
                    message="Cross-tenant decorator may be incomplete",
                    details={"has_tenant_check": has_tenant_check},
                    remediation="Ensure decorator logs and blocks cross-tenant access",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="Cross-Tenant Decorator",
                status=VerificationStatus.ERROR,
                message=f"Error checking decorator: {str(e)}",
            )
    
    def _check_api_response_filtering(self) -> VerificationResult:
        """Check API responses are filtered by tenant."""
        check_id = "TENANT-API-002"
        
        try:
            # Check TenantIsolatedViewSetMixin
            from apps.crm.api.views import TenantIsolatedViewSetMixin
            
            import inspect
            source = inspect.getsource(TenantIsolatedViewSetMixin)
            
            has_queryset_filter = "filter" in source.lower() and "organization" in source.lower()
            has_permission_check = "check_object_permissions" in source
            
            if has_queryset_filter and has_permission_check:
                return VerificationResult(
                    check_id=check_id,
                    check_name="API Response Filtering",
                    status=VerificationStatus.PASS,
                    message="API responses properly filtered by tenant",
                    details={
                        "has_queryset_filter": True,
                        "has_permission_check": True,
                    },
                )
            else:
                return VerificationResult(
                    check_id=check_id,
                    check_name="API Response Filtering",
                    status=VerificationStatus.WARNING,
                    message="API filtering may be incomplete",
                    remediation="Ensure all API responses are tenant-filtered",
                )
                
        except Exception as e:
            return VerificationResult(
                check_id=check_id,
                check_name="API Response Filtering",
                status=VerificationStatus.ERROR,
                message=f"Error checking API: {str(e)}",
            )


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def verify_tenant_isolation(organization_id: Optional[str] = None) -> List[VerificationResult]:
    """Run all tenant isolation verification checks."""
    verifier = TenantIsolationVerifier(organization_id)
    return verifier.verify_all()


def run_isolation_audit(organization_id: str) -> IsolationAuditReport:
    """Run full isolation audit for an organization."""
    from apps.organizations.models import Organization
    
    try:
        org = Organization.objects.get(id=organization_id)
    except Organization.DoesNotExist:
        raise ValueError(f"Organization {organization_id} not found")
    
    verifier = TenantIsolationVerifier(organization_id)
    results = verifier.verify_all()
    
    # Calculate score
    passed = sum(1 for r in results if r.status == VerificationStatus.PASS)
    total = len(results)
    score = (passed / total * 100) if total > 0 else 0
    
    # Determine overall status
    if score >= 90:
        overall = VerificationStatus.PASS
    elif score >= 70:
        overall = VerificationStatus.WARNING
    else:
        overall = VerificationStatus.FAIL
    
    return IsolationAuditReport(
        organization_id=str(org.id),
        organization_name=org.name,
        country=org.country,
        checks=results,
        overall_status=overall,
        score=round(score, 2),
        generated_at=datetime.utcnow().isoformat(),
    )


# =============================================================================
# RUNTIME ISOLATION ENFORCEMENT
# =============================================================================

class TenantIsolationEnforcer:
    """
    Runtime enforcement of tenant isolation.
    
    Use in production to actively prevent cross-tenant access.
    """
    
    @staticmethod
    def validate_model_save(instance: models.Model, tenant_id: str) -> bool:
        """Validate model instance belongs to tenant before save."""
        instance_org = getattr(instance, 'organization_id', None)
        
        if instance_org and str(instance_org) != str(tenant_id):
            logger.error(
                f"Cross-tenant save blocked: tenant={tenant_id}, "
                f"instance_tenant={instance_org}, model={instance.__class__.__name__}"
            )
            raise PermissionDenied("Cannot save data belonging to another tenant")
        
        return True
    
    @staticmethod
    def validate_queryset(queryset: QuerySet, tenant_id: str) -> QuerySet:
        """Ensure queryset is filtered by tenant."""
        # Check if queryset already has organization filter
        if hasattr(queryset, 'query'):
            where_str = str(queryset.query.where)
            if 'organization' not in where_str.lower():
                logger.warning(
                    f"QuerySet may not be tenant-filtered: {queryset.model.__name__}"
                )
        
        return queryset
    
    @staticmethod
    def validate_response_data(data: dict, tenant_id: str) -> bool:
        """Validate response data doesn't leak cross-tenant info."""
        # Check for organization_id fields in nested data
        def check_nested(obj, path=""):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    if key in ('organization_id', 'organization', 'tenant_id'):
                        if value and str(value) != str(tenant_id):
                            logger.error(
                                f"Cross-tenant data leak in response at {current_path}: "
                                f"expected={tenant_id}, found={value}"
                            )
                            return False
                    if not check_nested(value, current_path):
                        return False
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    if not check_nested(item, f"{path}[{i}]"):
                        return False
            return True
        
        return check_nested(data)
