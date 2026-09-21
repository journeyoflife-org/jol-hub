"""
C3/C5: Queryset scoping and serializer org-forcing tests.
"""
import pytest
from unittest.mock import MagicMock
from django.test import RequestFactory


@pytest.mark.django_db
class TestTenantScopedFilter:

    def test_filter_backend_scopes_to_tenant(self):
        """TenantScopedFilterBackend injects organization_id filter."""
        from apps.tenants.filters import TenantScopedFilterBackend
        from apps.content.models import Page
        from apps.crm.middleware import TenantContext, set_tenant_context, clear_tenant_context

        set_tenant_context(TenantContext(
            tenant_id="00000000-0000-0000-0000-000000000001",
            tenant_name="Test", country_code="LT",
            data_residency_region="EU", compliance_level="gdpr",
            request_id="t1",
        ))

        qs = Page.objects.all()
        backend = TenantScopedFilterBackend()
        request = MagicMock()
        request.user = MagicMock()

        filtered = backend.filter_queryset(request, qs, MagicMock())
        # Check that the queryset has the organization_id filter applied
        assert "organization_id" in str(filtered.query)

        clear_tenant_context()

    def test_filter_backend_returns_empty_without_tenant(self):
        """Without tenant context, returns empty queryset."""
        from apps.tenants.filters import TenantScopedFilterBackend
        from apps.content.models import Page
        from apps.crm.middleware import clear_tenant_context

        clear_tenant_context()

        qs = Page.objects.all()
        backend = TenantScopedFilterBackend()
        request = MagicMock()
        request.user = MagicMock()

        filtered = backend.filter_queryset(request, qs, MagicMock())
        assert filtered.count() == 0

    def test_serializer_organization_read_only(self):
        """PageCreateSerializer must have organization as read-only."""
        from apps.content.serializers import PageCreateSerializer

        serializer = PageCreateSerializer()
        org_field = serializer.fields.get("organization")
        if org_field is not None:
            assert org_field.read_only is True, "organization must be read-only"
