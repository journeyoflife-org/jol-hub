"""
Test utilities for multi-tenant tests.

Provides helpers to set/clear tenant context without going through
the HTTP middleware stack.
"""


def set_test_tenant_context(org):
    """Set tenant context for the given Organization (test helper).

    Call this before creating objects with organization FKs (e.g.
    OrganizationMember, Page) — their save() validates tenant context.
    """
    from apps.crm.middleware import TenantContext, set_tenant_context

    set_tenant_context(
        TenantContext(
            tenant_id=str(org.id),
            tenant_name=org.name,
            country_code=org.country,
            data_residency_region="EU",
            compliance_level=getattr(org, "compliance_level", "gdpr") or "gdpr",
            request_id="test",
        )
    )


def clear_test_tenant_context():
    """Clear tenant context (test helper)."""
    from apps.crm.middleware import clear_tenant_context

    clear_tenant_context()
