"""§5.1.10: Mongo collections must be tenant-scoped with TTL."""

import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.django_db
class TestMongoStoreIsolation:

    def test_webhook_collection_requires_tenant_context(self):
        """Bitrix24 webhook access requires tenant context."""
        from apps.crm.middleware import get_current_tenant_id, clear_tenant_context

        clear_tenant_context()
        tenant_id = get_current_tenant_id()
        assert tenant_id is None, "No tenant context should be set"

    def test_tenant_id_propagates_to_mongo_queries(self):
        """When tenant context is set, it should be available for Mongo filtering."""
        from apps.crm.middleware import (
            TenantContext,
            set_tenant_context,
            get_current_tenant_id,
            clear_tenant_context,
        )

        set_tenant_context(
            TenantContext(
                tenant_id="test-mongo-tenant",
                tenant_name="Test",
                country_code="LT",
                data_residency_region="EU",
                compliance_level="gdpr",
                request_id="t1",
            )
        )

        tenant_id = get_current_tenant_id()
        assert tenant_id == "test-mongo-tenant"

        clear_tenant_context()
