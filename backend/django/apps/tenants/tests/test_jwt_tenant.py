"""C1: JWT must carry server-signed tenant claim."""
import pytest
from unittest.mock import MagicMock


@pytest.mark.django_db
class TestJWTTenantClaim:
    """JWT token must include tenant_id from entitlement."""

    def test_token_contains_tenant_id(self):
        """Login response JWT must include tenant_id claim."""
        from apps.users.models import User
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.tokens import RefreshToken

        user = User.objects.create_user(email="test@test.lt", password="Test1234!")
        org = Organization.objects.create(
            name="Test Parish", slug="test-parish", org_type="parish",
            country="LT", status="active", schema_name="t_test_parish",
        )
        OrganizationMember.objects.create(
            organization=org, user=user, role="admin"
        )

        token = RefreshToken.for_user(user)
        assert "tenant_id" in token, "JWT token must include tenant_id claim"

    def test_token_tenant_id_matches_entitlement(self):
        """tenant_id in JWT must match user's entitled organization."""
        from apps.users.models import User
        from apps.organizations.models import Organization, OrganizationMember
        from apps.tenants.tokens import RefreshToken

        user = User.objects.create_user(email="test2@test.lt", password="Test1234!")
        org = Organization.objects.create(
            name="Test Parish 2", slug="test-parish-2", org_type="parish",
            country="LT", status="active", schema_name="t_test_parish_2",
        )
        OrganizationMember.objects.create(
            organization=org, user=user, role="editor"
        )

        token = RefreshToken.for_user(user)
        assert token.get("tenant_id") == str(org.id)
