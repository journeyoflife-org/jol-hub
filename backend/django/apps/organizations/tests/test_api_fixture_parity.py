"""Contract test: API response shape ≡ resolver fixture shape.

Wave 1 Task 10 — ensures the backend tenant API and the frontend
resolver fixtures stay in lockstep. If this test fails, either the
API or the fixtures drifted.
"""

from django.test import TestCase, Client


class ApiFixtureParityTests(TestCase):
    """Verify API tenant list matches fixture shape."""

    def setUp(self):
        self.client = Client()

    def test_api_returns_valid_shape(self):
        """API response has all required fields per tenant."""
        response = self.client.get("/api/v1/tenants/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

        required_keys = {
            "slug",
            "name",
            "vertical",
            "locale",
            "schema",
            "domain",
            "country",
        }
        for tenant in data:
            self.assertTrue(
                required_keys.issubset(tenant.keys()),
                f"Tenant {tenant.get('slug', '?')} missing keys: "
                f"{required_keys - set(tenant.keys())}",
            )

    def test_api_schema_follows_adr001(self):
        """Every schema field follows t_<slug> pattern."""
        response = self.client.get("/api/v1/tenants/")
        data = response.json()
        for tenant in data:
            expected_schema = f"t_{tenant['slug']}"
            self.assertEqual(
                tenant["schema"],
                expected_schema,
                f"Schema mismatch for {tenant['slug']}: "
                f"got {tenant['schema']}, expected {expected_schema}",
            )

    def test_api_no_duplicate_slugs(self):
        """No duplicate slugs in API response."""
        response = self.client.get("/api/v1/tenants/")
        data = response.json()
        slugs = [t["slug"] for t in data]
        self.assertEqual(len(slugs), len(set(slugs)))

    def test_api_locale_matches_country(self):
        """Locale is consistent with country code."""
        from apps.organizations.api.tenants import COUNTRY_LOCALE_MAP

        response = self.client.get("/api/v1/tenants/")
        data = response.json()
        for tenant in data:
            expected_locale = COUNTRY_LOCALE_MAP.get(tenant["country"], "lt")
            self.assertEqual(
                tenant["locale"],
                expected_locale,
                f"Locale mismatch for {tenant['slug']}: "
                f"country={tenant['country']}, "
                f"got locale={tenant['locale']}, expected {expected_locale}",
            )
