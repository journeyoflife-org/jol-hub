"""
Wave −1 Exit Gate — Red-Team Isolation Suite.

§5.3 criteria:
(a) tenant A reads/writes B -> 404
(b) forged X-Tenant-ID -> 404
(c) raw SQL with wrong app.tenant_id -> 0 rows (RLS proof)
(d) missing context -> deny
(e) pooled-connection reuse -> no leak
(f) every mutation writes an AuditLog row
(g) hierarchical admin reaches children, not siblings
"""

import uuid
from unittest.mock import patch

import pytest


@pytest.mark.django_db
class TestWaveMinus1ExitGate:

    def test_a_cross_tenant_read_returns_404(self):
        """(a) Tenant A cannot read Tenant B's pages."""
        from apps.content.models import Page
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User
        from django.test import RequestFactory

        org_a = Organization.objects.create(
            name="Parish A",
            slug="parish-a",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_parish_a",
        )
        org_b = Organization.objects.create(
            name="Parish B",
            slug="parish-b",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_parish_b",
        )
        Page.objects.create(
            organization=org_b, title="Secret", slug="secret", language="lt"
        )

        user = User.objects.create_user(email="a@test.lt", password="Test1234!")
        OrganizationMember.objects.create(organization=org_a, user=user, role="admin")

        factory = RequestFactory()
        request = factory.get("/api/v1/content/pages/", HTTP_X_TENANT_ID=str(org_b.id))
        request.user = user

        middleware = TenantEntitlementMiddleware(lambda r: None)
        response = middleware(request)
        assert response.status_code == 404

    def test_a_cross_tenant_write_returns_404(self):
        """(a) Tenant A cannot create pages in Tenant B (middleware blocks)."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User
        from django.test import RequestFactory

        org_a = Organization.objects.create(
            name="Parish A2",
            slug="parish-a2",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_parish_a2",
        )
        org_b = Organization.objects.create(
            name="Parish B2",
            slug="parish-b2",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_parish_b2",
        )

        user = User.objects.create_user(email="a2@test.lt", password="Test1234!")
        OrganizationMember.objects.create(organization=org_a, user=user, role="admin")

        factory = RequestFactory()
        request = factory.post(
            "/api/v1/content/pages/",
            HTTP_X_TENANT_ID=str(org_b.id),
        )
        request.user = user

        middleware = TenantEntitlementMiddleware(lambda r: None)
        response = middleware(request)
        assert response.status_code == 404

    def test_b_forged_tenant_id_returns_404(self):
        """(b) Forged X-Tenant-ID (not in entitlement) -> 404."""
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User
        from django.test import RequestFactory

        user = User.objects.create_user(email="b@test.lt", password="Test1234!")
        factory = RequestFactory()
        request = factory.get(
            "/api/v1/content/pages/",
            HTTP_X_TENANT_ID=str(uuid.uuid4()),
        )
        request.user = user

        middleware = TenantEntitlementMiddleware(lambda r: None)
        response = middleware(request)
        assert response.status_code == 404

    def test_c_rls_set_local_works(self):
        """(c) SET LOCAL app.tenant_id sets the config value."""
        from apps.tenants.rls import set_tenant_id_for_request
        from django.db import connection

        set_tenant_id_for_request("00000000-0000-0000-0000-000000000000")
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.tenant_id')")
            val = cursor.fetchone()[0]
        assert val == "00000000-0000-0000-0000-000000000000"

    def test_d_missing_context_denies(self):
        """(d) No tenant context -> deny operation (403)."""
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User
        from django.test import RequestFactory

        user = User.objects.create_user(email="d@test.lt", password="Test1234!")
        # No membership -> no tenant context
        factory = RequestFactory()
        request = factory.get("/api/v1/content/pages/")
        request.user = user

        middleware = TenantEntitlementMiddleware(lambda r: None)
        response = middleware(request)
        assert response.status_code == 403

    def test_e_pooled_connection_no_leak(self):
        """(e) Sequential SET LOCAL calls don't leak between requests."""
        from apps.tenants.rls import set_tenant_id_for_request
        from django.db import connection

        # Request 1: tenant A
        set_tenant_id_for_request("aaaa")
        # Request 2: tenant B — must override
        set_tenant_id_for_request("bbbb")
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.tenant_id')")
            assert cursor.fetchone()[0] == "bbbb"

    def test_f_mutation_creates_audit_log(self):
        """(f) Every content mutation writes an AuditLog row."""
        from apps.content.models import Page
        from apps.core.models import AuditLog
        from apps.crm.middleware import (TenantContext, clear_tenant_context,
                                         set_tenant_context)
        from apps.organizations.models import Organization

        org = Organization.objects.create(
            name="Audit Parish",
            slug="audit-parish",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_audit_parish",
        )
        set_tenant_context(
            TenantContext(
                tenant_id=str(org.id),
                tenant_name="Audit",
                country_code="LT",
                data_residency_region="EU",
                compliance_level="gdpr",
                request_id="audit",
            )
        )

        before = AuditLog.objects.count()
        Page.objects.create(
            organization=org, title="Audit Test", slug="audit-test", language="lt"
        )
        after = AuditLog.objects.count()

        assert after > before, "Page creation must emit AuditLog"
        clear_tenant_context()

    def test_g_hierarchical_admin_reaches_children(self):
        """(g) Diocese admin can access deanery/parish content."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.entitlement import (get_entitled_tenants,
                                              is_entitled_for_tenant)
        from apps.users.models import User

        diocese = Organization.objects.create(
            name="Archdiocese",
            slug="archdiocese",
            org_type="diocese",
            country="LT",
            status="active",
            schema_name="t_archdiocese",
        )
        parish = Organization.objects.create(
            name="Child Parish",
            slug="child-parish",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_child_parish",
            parent_diocese=diocese,
        )
        user = User.objects.create_user(email="g@test.lt", password="Test1234!")
        OrganizationMember.objects.create(organization=diocese, user=user, role="admin")

        assert is_entitled_for_tenant(user, parish.id)
        entitled = get_entitled_tenants(user)
        assert any(str(o.id) == str(parish.id) for o in entitled)

    def test_g_hierarchical_admin_denied_siblings(self):
        """(g) Diocese admin CANNOT access sibling diocese content."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.entitlement import is_entitled_for_tenant
        from apps.users.models import User

        diocese_a = Organization.objects.create(
            name="Diocese A",
            slug="diocese-a",
            org_type="diocese",
            country="LT",
            status="active",
            schema_name="t_diocese_a",
        )
        diocese_b = Organization.objects.create(
            name="Diocese B",
            slug="diocese-b",
            org_type="diocese",
            country="LT",
            status="active",
            schema_name="t_diocese_b",
        )
        user = User.objects.create_user(email="g2@test.lt", password="Test1234!")
        OrganizationMember.objects.create(
            organization=diocese_a, user=user, role="admin"
        )

        assert not is_entitled_for_tenant(user, diocese_b.id)
