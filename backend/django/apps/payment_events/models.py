"""Payment event storage — contract whitelist is the schema."""

from django.db import models


class PaymentEvent(models.Model):
    """One signed payment-event envelope, durably accepted by the hub.

    Columns mirror the contract v1.0.0 whitelist exactly; nothing else is
    stored. ``event_id`` is the sender's dedupe key (at-least-once delivery).
    Correlation to tenants is via the opaque ``payment_intent_id`` — no
    personal data columns by design (ADR-009, contract §3).
    """

    EVENT_TYPES = (
        ("payment_intent.succeeded", "payment_intent.succeeded"),
        ("payment_intent.payment_failed", "payment_intent.payment_failed"),
        ("charge.refunded", "charge.refunded"),
    )

    event_id = models.CharField(max_length=64, unique=True, db_index=True)
    type = models.CharField(max_length=64, choices=EVENT_TYPES)
    product = models.CharField(max_length=32)
    payment_intent_id = models.CharField(max_length=64, db_index=True)
    status = models.CharField(max_length=32)
    amount_cents = models.BigIntegerField()
    currency = models.CharField(max_length=3)
    occurred_at = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "payment_events"

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.event_id} ({self.type})"
