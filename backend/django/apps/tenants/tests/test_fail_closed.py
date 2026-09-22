"""
Tests for fail-closed tenant validation guards.

Verifies that missing/misconfigured tenant context DENIES operations
rather than silently skipping validation (C3 fix).
"""

from unittest.mock import MagicMock, patch

import pytest

from django.core.exceptions import PermissionDenied, ValidationError


@pytest.mark.django_db
class TestFailClosedGuards:
    """C3: Missing context -> deny, never skip."""

    def test_page_save_denies_when_import_fails(self):
        """ImportError in tenant middleware must DENY, not skip."""
        from apps.content.models import Page

        page = Page(
            title="Test",
            slug="test",
            language="lt",
            organization_id="00000000-0000-0000-0000-000000000001",
        )

        with patch.dict("sys.modules", {"apps.crm.middleware": None}):
            with pytest.raises((ValidationError, PermissionDenied)):
                page.save()

    def test_page_save_denies_on_unexpected_exception(self):
        """Unexpected exceptions in tenant validation must DENY."""
        from apps.content.models import Page

        page = Page(
            title="Test",
            slug="test",
            language="lt",
            organization_id="00000000-0000-0000-0000-000000000001",
        )

        with patch(
            "apps.crm.middleware.get_current_tenant_id",
            side_effect=RuntimeError("boom"),
        ):
            with pytest.raises((ValidationError, PermissionDenied)):
                page.save()

    def test_organization_member_save_denies_on_cross_tenant(self):
        """OrganizationMember save with mismatched tenant must DENY."""
        from apps.organizations.models import OrganizationMember

        member = OrganizationMember(
            organization_id="00000000-0000-0000-0000-000000000001",
            user_id="00000000-0000-0000-0000-000000000002",
        )

        with patch(
            "apps.crm.middleware.get_current_tenant_id",
            return_value="99999999-9999-9999-9999-999999999999",
        ):
            with pytest.raises(ValidationError):
                member.save()

    def test_no_org_set_allows_system_operation(self):
        """When organization_id is None, validation passes (system op)."""
        from apps.tenants.validators import validate_tenant_context

        # Should not raise — None org means system-level operation
        validate_tenant_context(None, "Page")

    def test_matching_tenant_context_passes(self):
        """When tenant context matches organization_id, validation passes."""
        from apps.tenants.validators import validate_tenant_context

        org_id = "00000000-0000-0000-0000-000000000001"

        with patch(
            "apps.crm.middleware.get_current_tenant_id",
            return_value=org_id,
        ):
            # Should not raise
            validate_tenant_context(org_id, "Page")
