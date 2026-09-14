"""Hub receiver for marketplace payment events (contract v1.0.0, ADR-009).

TEST-MODE ONLY: gated behind ``PAYMENT_EVENTS_ENABLED`` (default false); the
payment boundary stays CLOSED — there is no live processing path here, only
durable acceptance of signed payment facts.

Verification order follows contract §1.2: headers → replay window →
constant-time HMAC → product routing → schema whitelist → dedupe → persist.
Error contract (§2.3): 4xx never signals retry; 5xx is reserved for genuine
unavailability; duplicates return 200 no-op.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import time
from datetime import datetime

from django.conf import settings
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import PaymentEvent

#: Contract §2.1 — the only event types v1.0.0 may carry.
ALLOWED_EVENT_TYPES = frozenset(
    {
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "charge.refunded",
    }
)

#: Contract §2 — required whitelist fields. Extra fields are ignored
#: (tolerance), never stored.
REQUIRED_FIELDS = (
    "event_id",
    "type",
    "product",
    "payment_intent_id",
    "status",
    "amount_cents",
    "currency",
    "occurred_at",
)


def _error(status_code: int, code: str, detail: str) -> JsonResponse:
    return JsonResponse({"error": {"code": code, "detail": detail}}, status=status_code)


def _expected_signature(body: bytes, delivery_key: str, ts: int) -> str:
    payload = f"{ts}.{hashlib.sha256(body).hexdigest()}".encode()
    return hmac.new(delivery_key.encode(), payload, hashlib.sha256).hexdigest()


def _valid_envelope(data: dict) -> str | None:
    """Return an error code, or None when the envelope satisfies the whitelist."""
    for field in REQUIRED_FIELDS:
        if field not in data:
            return f"missing_field:{field}"
    if data["type"] not in ALLOWED_EVENT_TYPES:
        return "unknown_event_type"
    for field in ("event_id", "product", "payment_intent_id", "status", "currency"):
        if not isinstance(data[field], str) or not data[field]:
            return f"invalid_field:{field}"
    if not isinstance(data["amount_cents"], int) or isinstance(data["amount_cents"], bool):
        return "invalid_field:amount_cents"
    try:
        datetime.fromisoformat(data["occurred_at"])
    except (TypeError, ValueError):
        return "invalid_field:occurred_at"
    return None


@csrf_exempt
@require_http_methods(["POST"])
def receive_payment_event(request: HttpRequest) -> HttpResponse:
    # Feature flag: boundary CLOSED until enabled by change control; the
    # receiver presents no live path while disabled.
    if not getattr(settings, "PAYMENT_EVENTS_ENABLED", False):
        return _error(404, "not_found", "Unknown endpoint.")

    product = request.headers.get("X-Product")
    ts_raw = request.headers.get("X-JOL-Timestamp")
    signature = request.headers.get("X-JOL-Signature")
    if product is None or ts_raw is None or signature is None:
        return _error(400, "missing_headers", "X-Product, X-JOL-Timestamp and X-JOL-Signature are required.")

    try:
        ts = int(ts_raw)
    except ValueError:
        return _error(400, "invalid_timestamp", "X-JOL-Timestamp must be unix seconds.")

    window = getattr(settings, "PAYMENT_EVENTS_REPLAY_WINDOW_SECONDS", 300)
    if abs(int(time.time()) - ts) > window:
        return _error(401, "timestamp_out_of_window", "Timestamp outside the replay window.")

    delivery_key = getattr(settings, "HUB_PAYMENT_DELIVERY_KEY", "")
    if not delivery_key:
        # Misconfiguration is unavailability-class: loud, and retriable once fixed.
        return _error(503, "receiver_unconfigured", "Delivery key not provisioned.")

    body = request.body
    expected = _expected_signature(body, delivery_key, ts)
    if not hmac.compare_digest(expected, signature):
        return _error(401, "signature_mismatch", "Envelope signature verification failed.")

    if product != "hub":
        return _error(400, "misrouted_product", "This receiver accepts product 'hub' only.")

    try:
        data = json.loads(body)
    except (ValueError, UnicodeDecodeError):
        return _error(400, "invalid_json", "Body must be a JSON object.")
    if not isinstance(data, dict):
        return _error(400, "invalid_json", "Body must be a JSON object.")

    problem = _valid_envelope(data)
    if problem is not None:
        return _error(400, "schema_violation", f"Envelope rejected: {problem}.")

    # Dedupe before side effects (at-least-once delivery; duplicates are
    # expected). Known event_id → idempotent 200 no-op.
    if PaymentEvent.objects.filter(event_id=data["event_id"]).exists():
        return JsonResponse({"status": "duplicate", "event_id": data["event_id"]}, status=200)

    # Persist-before-process: durable acceptance first; downstream
    # fulfillment hooks are later gated work (none exist in this scope).
    PaymentEvent.objects.create(
        event_id=data["event_id"],
        type=data["type"],
        product=data["product"],
        payment_intent_id=data["payment_intent_id"],
        status=data["status"],
        amount_cents=data["amount_cents"],
        currency=data["currency"],
        occurred_at=datetime.fromisoformat(data["occurred_at"]),
    )
    return JsonResponse({"status": "accepted", "event_id": data["event_id"]}, status=201)
