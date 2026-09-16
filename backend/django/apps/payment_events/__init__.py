"""Payment-event ingress from the marketplace (Model A, ADR-009).

This app stores PAYMENT FACTS ONLY. Per
``docs/payment-api-contract.md`` v1.0.0 the wire envelope is an 8-field
whitelist carrying zero personal data; tenant correlation happens hub-side
via the opaque ``payment_intent_id``. No PSP SDK, no keys, no card data —
the marketplace payments_app remains the sole PSP integrator.
"""
