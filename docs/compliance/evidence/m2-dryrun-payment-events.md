# M-2 Dry-Run Delivery Evidence — DPIA Condition C2 Closure

Date: 2026-08-27 · Authorization: D-020 (m2-exercise AUTHORIZED) · DPIA: CONDITIONAL-GO (D-021) · Mode: TEST-MODE ONLY, test keys, zero production personal data · Boundary remains CLOSED after the exercise (flag reset to default false).

## 0. Pre-flight verifications

| Check | Evidence | Result |
|---|---|---|
| Prereq 1 | `grep D-020 … AUTHORIZED` in DECISION-LOG | 1 match ✓ |
| Prereq 2 | contract v1.0.0 + ADR-009 on disk | present ✓ |
| Prereq 3 | D-021 CONDITIONAL-GO recorded | present ✓ |
| Sender matches contract | `git status` on `payments_app/internal_forward.py` | tracked, CLEAN vs HEAD ✓ |
| Class-(c) review (§4 of triage) | full `services.py` delta inspected | **no contract-affecting delta** — change is checkout-surface only (client-secret return for embedded Payment Element, SAQ-A); envelope build/sign/forward path untouched |

## 1. Configuration (env-injected, nothing committed, both trees untouched)

- Hub instance: `manage.py runserver 127.0.0.1:8321` under `/tmp` settings shim (SQLite DB) with process-env `PAYMENT_EVENTS_ENABLED=true` and `HUB_PAYMENT_DELIVERY_KEY=<test key>` — never written to any tree file.
- Sender: marketplace `internal_forward.py` imported verbatim from its tree, settings shimmed to `INTERNAL_WEBHOOK_TARGETS={"hub": "http://127.0.0.1:8321/internal/v1/payment-events"}`, `INTERNAL_WEBHOOK_HUB_KEY=<same test key>`.
- Adaptation recorded: marketplace backend `.venv` is provisioned empty (deps normally via Docker; offline host), so the sender module ran under the hub venv interpreter — the exercised code is byte-identical to the marketplace tree at `4faef0a` (verified clean above).
- Synthetic intent stub only (pk=8123, amount 10000 EUR) — no real orders, no personal data anywhere in the exercise.

## 2. Six delivery cases (sender audit line + hub response)

| # | Case | Sender audit log | Hub status | Hub body | Dedupe |
|---|---|---|---|---|---|
| 1 | `payment_intent.succeeded` | `internal_webhook_forwarded event_type=payment_intent.succeeded product=hub status_code=201` | **201** | accepted | new row |
| 2 | `payment_intent.payment_failed` | `… payment_failed … status_code=201` | **201** | accepted | new row |
| 3 | `charge.refunded` | `… charge.refunded … status_code=201` | **201** | accepted | new row |
| 4 | deliberate duplicate (identical signed envelope re-posted) | n/a (direct replay) | **200** | `{"status": "duplicate"}` | **no-op** — row count unchanged |
| 5 | stale timestamp (now−400s, valid signature) | n/a | **401** | `timestamp_out_of_window` | nothing stored |
| 6 | bad signature (wrong key) | n/a | **401** | `signature_mismatch` | nothing stored |

Hub access log corroborates: four 201, one 200, two 401 for exactly these requests. Poison-pill honored: 401s carry no retry signal; sender treats <500 as delivered (`raise_for_status` passes).

## 3. Stored-row whitelist proof

Table columns (PRAGMA): `id, event_id, type, product, payment_intent_id, status, amount_cents, currency, occurred_at, received_at` — **the 8-field whitelist + surrogate id + receipt timestamp; zero extra columns, zero personal-data columns**.

Exactly **4 rows** stored (cases 1–4 accepted; 4 deduped to one; 5–6 rejected):
each row carries only `evt_internal_<hex>` id, the three event types, product `hub`, opaque intent id `8123`, status, 10000, EUR, occurred_at.

## 4. Reset & post-state

- Flag proof: server restarted WITHOUT the env override → `POST /internal/v1/payment-events` → **404 "Unknown endpoint"** (default false restored; no env file carries the flag).
- Test keys existed only in process environments; sqlite test DB and /tmp scripts removed after the run.
- `scripts/check-payment-boundary.sh` after: **exit 0** (`PAYMENT BOUNDARY OK`) — no new hits; forbidden literals nowhere introduced.
- Both trees verified unchanged: marketplace still exactly 197 dirty entries; hub dirty tree limited to the standing two items.

## 5. C2 closure

DPIA condition **C2 (dry-run delivery evidence) — CLOSED by this document**. Remaining flag-on blockers: C1 (retention schedule) and C3 (facts-table placement) — both NEEDS-OWNER. C4 (no-body-logging) re-verified during this run: hub access log contains no request bodies; receiver emitted no log statements.
