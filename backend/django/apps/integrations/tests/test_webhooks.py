"""
Comprehensive test suite for the Bitrix24 Webhook Receiver view.

All tests use ``core.settings.test`` which configures:
- **mongomock** as the MongoDB backend (no real MongoDB required).
- **CELERY_TASK_ALWAYS_EAGER = True** (tasks execute synchronously).
- **SQLite in-memory** for PostgreSQL (fast, isolated).

Test cases:
1. **Success path** — valid signature, new payload → 202 Accepted.
2. **Idempotency** — duplicate payload → 409 Conflict.
3. **Invalid signature** — tampered body or wrong secret → 401.
4. **Malformed payload** — invalid JSON or missing fields → 400.
"""

import hashlib
import hmac
import json
from typing import Any
from unittest.mock import patch

import pytest

from conftest import (
    BITRIX24_TEST_SECRET,
    build_bitrix24_payload,
    compute_bitrix24_signature,
)

# URL for the Bitrix24 webhook endpoint.
WEBHOOK_URL = "/api/v1/integrations/webhooks/bitrix24/"


@pytest.fixture(autouse=True)
def _bitrix24_secret(settings):
    """Ensure BITRIX24_WEBHOOK_SECRET is set for every test in this module."""
    settings.BITRIX24_WEBHOOK_SECRET = BITRIX24_TEST_SECRET


def _post_webhook(
    client,
    payload: dict[str, Any],
    secret: str = BITRIX24_TEST_SECRET,
    extra_headers: dict[str, str] | None = None,
):
    """Helper: POST a Bitrix24 webhook with computed HMAC signature.

    The body is serialized with the *exact same* ``json.dumps`` parameters
    used in ``compute_bitrix24_signature`` so the HMAC matches.

    Args:
        client: DRF ``APIClient``.
        payload: The webhook payload dict.
        secret: The HMAC secret to sign with.
        extra_headers: Additional HTTP headers to include.

    Returns:
        The DRF ``Response`` object.
    """
    body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    signature = compute_bitrix24_signature(payload, secret=secret)

    headers = {
        "HTTP_X_BITRIX24_SIGNATURE": signature,
    }
    if extra_headers:
        headers.update(extra_headers)

    return client.post(
        WEBHOOK_URL,
        data=body,
        content_type="application/json",
        **headers,
    )


# =========================================================================
# Test 1: Success Path
# =========================================================================


@pytest.mark.django_db
class TestBitrix24WebhookSuccess:
    """Valid signature + new payload → 202 Accepted."""

    @patch("apps.integrations.tasks.process_bitrix24_webhook")
    def test_returns_202_and_stores_in_mongodb(
        self, mock_task, api_client,
    ):
        """A valid webhook returns 202, stores in MongoDB, and queues a task."""
        payload = build_bitrix24_payload(
            event="ONCRMLEADADD",
            entity_id="100",
            domain="success-portal.bitrix24.com",
            ts="1700000001",
        )

        response = _post_webhook(api_client, payload)

        # -- HTTP response assertions --
        assert response.status_code == 202
        data = response.json()
        assert data["status"] == "queued"
        assert "event_id" in data
        assert data["country"] == "default"

        # -- MongoDB insertion assertion --
        from apps.core.mongodb import WebhookPayloadCollection

        stored = WebhookPayloadCollection.find_one(
            {"idempotency_key": "bitrix24:success-portal.bitrix24.com:ONCRMLEADADD:100:1700000001"},
        )
        assert stored is not None
        assert stored["source"] == "bitrix24"
        assert stored["event_type"] == "ONCRMLEADADD"
        assert stored["raw_payload"]["event"] == "ONCRMLEADADD"
        assert "created_at" in stored
        assert "updated_at" in stored

        # -- Celery dispatch assertion --
        mock_task.delay.assert_called_once_with(
            str(stored["_id"]),
            country="default",
        )


# =========================================================================
# Test 2: Idempotency
# =========================================================================


@pytest.mark.django_db
class TestBitrix24WebhookIdempotency:
    """Sending the same payload twice → second request returns 409."""

    @patch("apps.integrations.tasks.process_bitrix24_webhook")
    def test_duplicate_returns_409(self, mock_task, api_client):
        """First request → 202.  Second identical request → 409."""
        payload = build_bitrix24_payload(
            event="ONCRMDEALUPDATE",
            entity_id="200",
            domain="idempotent-portal.bitrix24.com",
            ts="1700000002",
        )

        # -- First request: should succeed --
        response_1 = _post_webhook(api_client, payload)
        assert response_1.status_code == 202
        assert response_1.json()["status"] == "queued"

        # -- Second request: should be rejected as duplicate --
        response_2 = _post_webhook(api_client, payload)
        assert response_2.status_code == 409
        data = response_2.json()
        assert data["status"] == "error"
        assert data["error"]["code"] == "webhook.duplicate_event"

        # -- Celery task should only have been dispatched once --
        assert mock_task.delay.call_count == 1


# =========================================================================
# Test 3: Invalid Signature
# =========================================================================


@pytest.mark.django_db
class TestBitrix24WebhookInvalidSignature:
    """Tampered payload or wrong secret → 401 Unauthorized."""

    def test_wrong_secret_returns_401(self, api_client):
        """A payload signed with a different secret is rejected."""
        payload = build_bitrix24_payload(
            event="ONCRMLEADADD",
            entity_id="300",
        )

        # Sign with a WRONG secret.
        response = _post_webhook(
            api_client,
            payload,
            secret="completely-wrong-secret",
        )

        assert response.status_code == 401
        data = response.json()
        assert data["status"] == "error"
        assert data["error"]["code"] == "webhook.signature_invalid"

    def test_missing_signature_returns_401(self, api_client):
        """A request without the signature header is rejected."""
        payload = build_bitrix24_payload(entity_id="301")

        response = api_client.post(
            WEBHOOK_URL,
            data=json.dumps(payload),
            content_type="application/json",
            # No X-Bitrix24-Signature header
        )

        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "webhook.signature_invalid"

    def test_tampered_body_returns_401(self, api_client):
        """A valid signature with a modified body is rejected."""
        payload = build_bitrix24_payload(entity_id="302")
        signature = compute_bitrix24_signature(payload)

        # Tamper with the body after signing.
        tampered_body = json.dumps(
            {**payload, "event": "ONTAMPEREDEVENT"},
            separators=(",", ":"),
            sort_keys=True,
        )

        response = api_client.post(
            WEBHOOK_URL,
            data=tampered_body,
            content_type="application/json",
            HTTP_X_BITRIX24_SIGNATURE=signature,
        )

        assert response.status_code == 401
        assert response.json()["error"]["code"] == "webhook.signature_invalid"


# =========================================================================
# Test 4: Malformed Payload
# =========================================================================


@pytest.mark.django_db
class TestBitrix24WebhookMalformedPayload:
    """Invalid JSON or missing required fields → 400 Bad Request."""

    def test_missing_event_field_returns_400(self, api_client):
        """A payload without the 'event' field is rejected."""
        payload = {
            "ts": "1700000003",
            "auth": {"domain": "malformed.bitrix24.com"},
            "data": {"FIELDS": {"ID": "400"}},
            # NOTE: no 'event' key
        }

        response = _post_webhook(api_client, payload)

        assert response.status_code == 400
        data = response.json()
        assert data["status"] == "error"
        assert data["error"]["code"] == "webhook.malformed_payload"
        assert "event" in data["error"]["message"].lower()

    def test_non_object_body_returns_400(self, api_client):
        """A JSON array (not object) is rejected."""
        payload: list = [{"event": "ONCRMLEADADD"}]  # type: ignore[assignment]
        body = json.dumps(payload)
        signature = hmac.new(
            BITRIX24_TEST_SECRET.encode("utf-8"),
            body.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        response = api_client.post(
            WEBHOOK_URL,
            data=body,
            content_type="application/json",
            HTTP_X_BITRIX24_SIGNATURE=signature,
        )

        assert response.status_code == 400
        data = response.json()
        assert data["error"]["code"] == "webhook.malformed_payload"
