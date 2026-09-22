"""
GET /api/v1/tenants — resolver-compatible tenant list.

Server-to-server endpoint. Returns all active tenants in the shape
expected by the tenant-resolver package.

Wave 1, Task 1 — adapted to actual Organization model.
"""

from rest_framework.response import Response
from rest_framework import viewsets

from apps.organizations.models import Organization

# Country → locale mapping (ISO 3166-1 alpha-2 → BCP 47)
COUNTRY_LOCALE_MAP = {
    "LT": "lt",
    "LV": "lv",
    "EE": "et",
    "PL": "pl",
    "DE": "de",
    "FR": "fr",
    "IT": "it",
    "ES": "es",
    "PT": "pt",
    "NL": "nl",
    "BE": "nl",
    "AT": "de",
    "IE": "en",
    "GB": "en",
    "HU": "hu",
    "SK": "sk",
    "SI": "sl",
    "HR": "hr",
    "RO": "ro",
    "BG": "bg",
    "CZ": "cs",
    "FI": "fi",
    "SE": "sv",
    "DK": "da",
    "GR": "el",
    "CY": "el",
    "MT": "mt",
    "LU": "fr",
}


def _extract_domain(url: str) -> str | None:
    """Extract domain from a URL field value."""
    if not url:
        return None
    # Remove protocol
    domain = url.replace("https://", "").replace("http://", "")
    # Remove trailing path
    domain = domain.split("/")[0]
    return domain or None


class TenantListView(viewsets.ViewSet):
    """
    GET /api/v1/tenants — returns resolver-compatible tenant list.

    Server-to-server only (mTLS at ingress).
    Response shape matches tenant-resolver Tenant fixture schema.
    """

    authentication_classes = []  # mTLS at ingress
    permission_classes = []  # mTLS at ingress

    def list(self, request):
        """Return all active tenants in resolver-compatible shape."""
        tenants = Organization.objects.filter(
            status=Organization.STATUS_ACTIVE,
        ).order_by("slug")

        result = []
        for org in tenants:
            locale = COUNTRY_LOCALE_MAP.get(org.country, "lt")
            result.append(
                {
                    "slug": org.slug,
                    "name": {"lt": org.name, "en": org.name},
                    "vertical": org.org_type,
                    "locale": locale,
                    "schema": f"t_{org.slug}",
                    "domain": _extract_domain(org.website),
                    "country": org.country,
                }
            )

        return Response(result)
