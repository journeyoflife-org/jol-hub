"""C1: JWT must carry server-signed tenant claim."""

from unittest.mock import MagicMock

import pytest


@pytest.mark.django_db
class TestJWTTenantClaim:
    """JWT token must include tenant_id from entitlement."""

    def test_token_contains_tenant_id(self):
        """Login response JWT must include tenant_id claim."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.tokens import RefreshToken
        from apps.users.models import User

        user = User.objects.create_user(email="test@test.lt", password="Test1234!")
        org = Organization.objects.create(
            name="Test Parish",
            slug="test-parish",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_test_parish",
        )
        # Set tenant context before creating org-scoped objects
        from apps.tenants.test_utils import set_test_tenant_context, clear_test_tenant_context

        set_test_tenant_context(org)
        OrganizationMember.objects.create(organization=org, user=user, role="admin")
        clear_test_tenant_context()

        token = RefreshToken.for_user(user)
        assert "tenant_id" in token, "JWT token must include tenant_id claim"

    def test_token_tenant_id_matches_entitlement(self):
        """tenant_id in JWT must match user's entitled organization."""
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.tokens import RefreshToken
        from apps.users.models import User

        user = User.objects.create_user(email="test2@test.lt", password="Test1234!")
        org = Organization.objects.create(
            name="Test Parish 2",
            slug="test-parish-2",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_test_parish_2",
        )
        from apps.tenants.test_utils import set_test_tenant_context, clear_test_tenant_context

        set_test_tenant_context(org)
        OrganizationMember.objects.create(organization=org, user=user, role="editor")
        clear_test_tenant_context()

        token = RefreshToken.for_user(user)
        assert token.get("tenant_id") == str(org.id)
