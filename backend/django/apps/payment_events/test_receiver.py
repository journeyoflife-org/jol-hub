"""Offline tests for the internal payment-events receiver.

Contract: docs/payment-api-contract.md v1.0.0 (ADR-009 Model A). All tests
run with the flag ENABLED via override; the flag-off case is tested
separately. The delivery key is a test-only value injected through
settings — never a committed secret.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time

import pytest
from django.test import Client

from apps.payment_events.models import PaymentEvent

TEST_KEY = "test-delivery-key-not-a-secret"
URL = "/internal/v1/payment-events"


@pytest.fixture(autouse=True)
def receiver_settings(settings):
    settings.PAYMENT_EVENTS_ENABLED = True
    settings.HUB_PAYMENT_DELIVERY_KEY = TEST_KEY
    settings.PAYMENT_EVENTS_REPLAY_WINDOW_SECONDS = 300


def make_envelope(**overrides) -> dict:
    envelope = {
        "event_id": "evt_internal_0f3a9c1de2b74a58",
        "type": "payment_intent.succeeded",
        "product": "hub",
        "payment_intent_id": "8123",
        "status": "succeeded",
        "amount_cents": 10000,
        "currency": "EUR",
        "occurred_at": "2026-08-27T14:03:11.204815+00:00",
    }
    envelope.update(overrides)
    return envelope


def signed_post(client: Client, envelope: dict, *, key: str = TEST_KEY, ts: int | None = None):
    body = json.dumps(envelope).encode()
    ts = int(time.time()) if ts is None else ts
    payload = f"{ts}.{hashlib.sha256(body).hexdigest()}".encode()
    signature = hmac.new(key.encode(), payload, hashlib.sha256).hexdigest()
    return client.post(
        URL,
        data=body,
        content_type="application/json",
        HTTP_X_PRODUCT=envelope.get("product", "hub"),
        HTTP_X_JOL_TIMESTAMP=str(ts),
        HTTP_X_JOL_SIGNATURE=signature,
    )


@pytest.mark.django_db
def test_valid_event_accepted_and_persisted():
    response = signed_post(Client(), make_envelope())
    assert response.status_code == 201
    row = PaymentEvent.objects.get()
    assert row.event_id == "evt_internal_0f3a9c1de2b74a58"
    assert row.type == "payment_intent.succeeded"
    assert row.amount_cents == 10000
    assert row.currency == "EUR"


@pytest.mark.django_db
def test_bad_hmac_rejected_without_retry_signal():
    response = signed_post(Client(), make_envelope(), key="wrong-key")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "signature_mismatch"
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_stale_timestamp_rejected():
    response = signed_post(Client(), make_envelope(), ts=int(time.time()) - 400)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "timestamp_out_of_window"
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_future_timestamp_beyond_window_rejected():
    response = signed_post(Client(), make_envelope(), ts=int(time.time()) + 400)
    assert response.status_code == 401
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_duplicate_is_idempotent_noop():
    client = Client()
    first = signed_post(client, make_envelope())
    second = signed_post(client, make_envelope())
    assert first.status_code == 201
    assert second.status_code == 200
    assert second.json()["status"] == "duplicate"
    assert PaymentEvent.objects.count() == 1


@pytest.mark.django_db
def test_missing_required_field_rejected_without_retry_signal():
    envelope = make_envelope()
    del envelope["amount_cents"]
    response = signed_post(Client(), envelope)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "schema_violation"
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_unknown_event_type_rejected():
    response = signed_post(Client(), make_envelope(type="invoice.finalized"))
    assert response.status_code == 400
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_malformed_json_rejected():
    ts = int(time.time())
    body = b"{not json"
    payload = f"{ts}.{hashlib.sha256(body).hexdigest()}".encode()
    signature = hmac.new(TEST_KEY.encode(), payload, hashlib.sha256).hexdigest()
    response = Client().post(
        URL,
        data=body,
        content_type="application/json",
        HTTP_X_PRODUCT="hub",
        HTTP_X_JOL_TIMESTAMP=str(ts),
        HTTP_X_JOL_SIGNATURE=signature,
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_json"


@pytest.mark.django_db
def test_extra_fields_are_dropped_not_stored():
    envelope = make_envelope(donor_name="MUST NEVER APPEAR", email="x@example.org")
    response = signed_post(Client(), envelope)
    assert response.status_code == 201
    row = PaymentEvent.objects.get()
    stored = {field.name for field in PaymentEvent._meta.get_fields()}
    assert "donor_name" not in stored
    assert "email" not in stored
    assert row.payment_intent_id == "8123"


@pytest.mark.django_db
def test_misrouted_product_rejected():
    response = signed_post(Client(), make_envelope(product="marketplace"))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "misrouted_product"
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_missing_headers_rejected():
    response = Client().post(URL, data=b"{}", content_type="application/json")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "missing_headers"


@pytest.mark.django_db
def test_flag_off_presents_no_live_path(settings):
    settings.PAYMENT_EVENTS_ENABLED = False
    response = signed_post(Client(), make_envelope())
    assert response.status_code == 404
    assert PaymentEvent.objects.count() == 0


@pytest.mark.django_db
def test_unprovisioned_delivery_key_is_unavailability(settings):
    settings.HUB_PAYMENT_DELIVERY_KEY = ""
    response = signed_post(Client(), make_envelope())
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "receiver_unconfigured"
