"""Tests for GET /api/v1/tenants endpoint."""

from apps.organizations.models import Organization
from django.test import Client, TestCase


class TenantAPITests(TestCase):
    """Tests for the tenant list API endpoint."""

    def setUp(self):
        """Create test data."""
        from apps.tenants.test_utils import set_test_tenant_context, clear_test_tenant_context
        self.client = Client()
        self.test_parish = Organization.objects.create(
            name="Test Parish",
            slug="test-parish",
            org_type=Organization.TYPE_PARISH,
            status=Organization.STATUS_ACTIVE,
            country="LT",
            website="https://test.gyvenimo-kelias.lt",
        )

    def test_tenants_api_returns_resolver_shape(self):
        """API returns the same shape as resolver fixtures."""
        response = self.client.get("/api/v1/tenants/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

        tenant = data[0]
        self.assertEqual(tenant["slug"], "test-parish")
        self.assertEqual(tenant["name"], {"lt": "Test Parish", "en": "Test Parish"})
        self.assertEqual(tenant["vertical"], "parish")
        self.assertEqual(tenant["locale"], "lt")
        self.assertEqual(tenant["schema"], "t_test-parish")
        self.assertEqual(tenant["domain"], "test.gyvenimo-kelias.lt")
        self.assertEqual(tenant["country"], "LT")

    def test_tenants_api_excludes_inactive(self):
        """Only active tenants are returned."""
        Organization.objects.create(
            name="Active Parish",
            slug="active-parish",
            org_type=Organization.TYPE_PARISH,
            status=Organization.STATUS_ACTIVE,
            country="LT",
        )
        Organization.objects.create(
            name="Inactive Parish",
            slug="inactive-parish",
            org_type=Organization.TYPE_PARISH,
            status=Organization.STATUS_INACTIVE,
            country="LT",
        )

        response = self.client.get("/api/v1/tenants/")
        data = response.json()
        slugs = {t["slug"] for t in data}
        self.assertIn("active-parish", slugs)
        self.assertNotIn("inactive-parish", slugs)

    def test_tenants_api_country_locale_mapping(self):
        """Country code maps to correct locale."""
        Organization.objects.create(
            name="Riga Cathedral",
            slug="riga-cathedral",
            org_type=Organization.TYPE_CATHEDRAL,
            status=Organization.STATUS_ACTIVE,
            country="LV",
        )

        response = self.client.get("/api/v1/tenants/")
        data = response.json()
        riga = next(t for t in data if t["slug"] == "riga-cathedral")
        self.assertEqual(riga["locale"], "lv")

    def test_tenants_api_no_duplicate_slugs(self):
        """Each tenant has a unique slug (enforced by model)."""
        response = self.client.get("/api/v1/tenants/")
        data = response.json()
        slugs = [t["slug"] for t in data]
        self.assertEqual(len(slugs), len(set(slugs)))
