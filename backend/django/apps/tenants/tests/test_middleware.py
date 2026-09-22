"""
C2: Middleware must validate entitlement, not just presence.
"""

import uuid
from unittest.mock import MagicMock, patch

import pytest

from apps.tenants.test_utils import clear_test_tenant_context, set_test_tenant_context
from django.http import HttpResponse
from django.test import RequestFactory


@pytest.mark.django_db
class TestTenantEntitlementMiddleware:

    def _make_request(self, user, tenant_header=None):
        factory = RequestFactory()
        request = factory.get("/api/v1/content/pages/")
        request.user = user
        if tenant_header:
            request.META["HTTP_X_TENANT_ID"] = tenant_header
        return request

    def test_forged_x_tenant_id_returns_404(self):
        """X-Tenant-ID for a tenant the user is NOT entitled to -> 404."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User

        user = User.objects.create_user(email="test@test.lt", password="Test1234!")
        org = Organization.objects.create(
            name="My Parish",
            slug="my-parish",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_my_parish",
        )
        set_test_tenant_context(org)
        OrganizationMember.objects.create(organization=org, user=user, role="admin")
        clear_test_tenant_context()

        # Forge a different tenant ID
        forged_id = str(uuid.uuid4())
        request = self._make_request(user, tenant_header=forged_id)

        middleware = TenantEntitlementMiddleware(lambda r: HttpResponse("ok"))
        response = middleware(request)

        assert response.status_code == 404  # 404, not 403 — no enumeration

    def test_valid_tenant_passes(self):
        """X-Tenant-ID matching entitlement -> passes through."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User

        user = User.objects.create_user(email="test2@test.lt", password="Test1234!")
        org = Organization.objects.create(
            name="My Parish 2",
            slug="my-parish-2",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_my_parish_2",
        )
        set_test_tenant_context(org)
        OrganizationMember.objects.create(organization=org, user=user, role="editor")
        clear_test_tenant_context()

        request = self._make_request(user, tenant_header=str(org.id))

        middleware = TenantEntitlementMiddleware(lambda r: HttpResponse("ok"))
        response = middleware(request)

        assert response.status_code == 200

    def test_no_tenant_context_for_authenticated_api_request_denies(self):
        """Authenticated API request without any tenant context -> 403."""
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User

        user = User.objects.create_user(email="nomember@test.lt", password="Test1234!")
        request = self._make_request(user)  # No tenant header, no membership

        middleware = TenantEntitlementMiddleware(lambda r: HttpResponse("ok"))
        response = middleware(request)

        # For API paths, deny. For non-API (health, static), pass.
        assert response.status_code == 403

    def test_exempt_path_passes_without_tenant(self):
        """Exempt paths (health, auth) pass without tenant context."""
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from apps.users.models import User

        user = User.objects.create_user(email="health@test.lt", password="Test1234!")
        factory = RequestFactory()
        request = factory.get("/health/")
        request.user = user

        middleware = TenantEntitlementMiddleware(lambda r: HttpResponse("ok"))
        response = middleware(request)

        assert response.status_code == 200

    def test_unauthenticated_request_passes(self):
        """Unauthenticated requests pass through (DRF handles auth)."""
        from apps.tenants.middleware import TenantEntitlementMiddleware
        from django.contrib.auth.models import AnonymousUser

        factory = RequestFactory()
        request = factory.get("/api/v1/content/pages/")
        request.user = AnonymousUser()

        middleware = TenantEntitlementMiddleware(lambda r: HttpResponse("ok"))
        response = middleware(request)

        assert response.status_code == 200
