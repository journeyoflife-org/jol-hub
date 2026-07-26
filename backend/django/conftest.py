"""
Root conftest for the JOL-HUB Django test suite.

Provides shared fixtures used across all ``apps/*/tests/`` directories.

Settings module is configured for pytest via the ``--ds`` flag or the
``DJANGO_SETTINGS_MODULE`` env var (expected: ``core.settings.test``).
"""

import hashlib
import hmac
import json
from typing import Any

import pytest
from django.test import RequestFactory
from rest_framework.test import APIClient


# ---------------------------------------------------------------------------
# Bitrix24 webhook test helpers
# ---------------------------------------------------------------------------

#: Shared HMAC secret used in tests.  Must match the value overridden in
#: test fixtures via ``settings.BITRIX24_WEBHOOK_SECRET``.
BITRIX24_TEST_SECRET = "test-bitrix24-hmac-secret-key"


def compute_bitrix24_signature(payload: dict[str, Any], secret: str = BITRIX24_TEST_SECRET) -> str:
    """Compute the HMAC-SHA256 signature for a Bitrix24 webhook payload.

    Args:
        payload: The JSON-serialisable payload dict.
        secret: The HMAC shared secret (must match the test override).

    Returns:
        Hex-encoded HMAC-SHA256 digest string.
    """
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()


def build_bitrix24_payload(
    event: str = "ONCRMLEADADD",
    entity_id: str = "42",
    domain: str = "testportal.bitrix24.com",
    ts: str = "1700000000",
    **extra: Any,
) -> dict[str, Any]:
    """Build a realistic Bitrix24 webhook payload.

    Args:
        event: The Bitrix24 event name.
        entity_id: The entity ID inside ``data.FIELDS.ID``.
        domain: The Bitrix24 portal domain.
        ts: Unix timestamp string.
        **extra: Additional top-level keys merged into the payload.

    Returns:
        A dict mimicking a real Bitrix24 webhook body.
    """
    payload: dict[str, Any] = {
        "event": event,
        "ts": ts,
        "auth": {
            "domain": domain,
            "member_id": "test-member-id-001",
            "application_token": "test-app-token",
        },
        "data": {
            "FIELDS": {
                "ID": entity_id,
                "TITLE": "Test Lead",
            },
        },
    }
    payload.update(extra)
    return payload


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def api_client() -> APIClient:
    """Return a fresh DRF ``APIClient`` for each test."""
    return APIClient()


@pytest.fixture()
def rf() -> RequestFactory:
    """Return a Django ``RequestFactory``."""
    return RequestFactory()
