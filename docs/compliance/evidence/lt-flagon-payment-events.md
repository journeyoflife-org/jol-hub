# LT Flag-On Evidence — payment-events receiver, scope=LT, mode=TEST

Date: 2026-08-27 · Authorization: **flag-on=AUTHORIZED scope=LT mode=TEST** (verbatim, task message of record) · DPIA: CONDITIONAL-GO with C1–C4 resolved (D-021…D-024) · SAQ A: **not required** — ADR-009 gates SAQ A on LIVE mode only; this is TEST mode. LIVE mode untouched.

## 1. Configuration (env-injected; nothing committed; C3 placement honored)

- Migration: `manage.py migrate payment_events --plan` → single ADD-only op `payment_events.0001_initial (Create model PaymentEvent)`, exit 0 → applied against the **real dev DB `jol_lt_platform_prod`**, exit 0. Table lands in the **shared/public schema with no tenant-id column** — exactly the C3 decision (D-023).
- Flag + key: `PAYMENT_EVENTS_ENABLED=true`, `HUB_PAYMENT_DELIVERY_KEY=<test key>` injected as **process environment only** for the LT dev instance; no tree file carries them; default remains false.
- Sender: marketplace `internal_forward.py` (tracked clean, contract-verified by dry-run a3e1f240) pointed at `http://127.0.0.1:8321/internal/v1/payment-events` via env-injected settings shim; TEST keys both sides; zero writes to the marketplace tree.

## 2. Smoke — 6/6 cases against the real LT dev DB

| # | Case | Result |
|---|---|---|
| 1 | payment_intent.succeeded | sender audit 201; hub 201 |
| 2 | payment_intent.payment_failed | sender audit 201; hub 201 |
| 3 | charge.refunded | sender audit 201; hub 201 |
| 4 | duplicate (identical signed envelope) | first 201, replay **200 no-op**, single row |
| 5 | stale timestamp (now−400s) | **401**, nothing stored |
| 6 | bad signature | **401**, nothing stored |

## 3. Stored rows (real DB, shared schema)

Exactly **4 rows** in `jol_lt_platform_prod` (synthetic intent pk 9417, 25000 EUR): all 3 event types + the deduped case-4. Columns verified = whitelist + id + received_at — **zero personal-data columns, whitelist intact** (DPIA §2).

## 4. C4 obligation (no raw-body logging)

Receiver emits zero log statements (code grep = 0). The only envelope content observed in the dev-server log is Django **DEBUG-mode SQL** (dedupe SELECT + INSERT of whitelist columns) — not raw request bodies, no headers, absent at INFO/production levels. Obligation holds.

## 5. Rollback drill (executed)

- Flag off (clean environment, no env vars): POST → **404 "Unknown endpoint"** ✓
- Migration reverse plan (stated, not executed): `manage.py migrate payment_events zero` — drops the add-only table; nothing else depends on it.
- Post-drill state: receiver **off** on this host; enablement is runtime/env-scoped and re-applied by the LT deployment configuration when the instance runs; durable per-environment provisioning belongs to deployment work (Vaultwarden pattern, B8).

## 6. Boundary state

Test-mode only; boundary remains CLOSED to LIVE per ADR-009 (SAQ A is the sole LIVE-opening condition). The four test rows in the dev DB carry synthetic values only.
