# Internal Payment-Events API Contract — Marketplace (sender) → Hub (receiver)

| Attribute | Value |
|---|---|
| Version | **v1.0.0** (documents the wire format implemented at marketplace HEAD `4faef0a`) |
| Parties | sender: `jol-m-marketplace` `payments_app` (`internal_forward.py`) · receiver: `jol-hub` backend |
| Governance | ADR-009 (Model A, boundary CLOSED) · sender-side lineage: jol-m-infrastructure payment-boundary doc ("ADR-0005 §3" in sender code — see ASSUME-MKT-003) · closes O-017(1) |
| Status | Contract ratified docs-only; receiver implementation is separate gated work (M-1); boundary stays CLOSED — dry-run/test-mode only until SAQ A |
| DPIA | §3 of this contract is the data-flow input to the pending DPIA (O-013) |
| Rollback | `git revert <sha>` (docs-only; wire format lives in sender code, unchanged here) |

## 0. Guard-safety statement

This file is **not** on any payment-guard exemption path (verified: VOCAB list
= 5 ledger-vocabulary files only). It therefore complies with the strictest
discipline: no forbidden secret-key setting literals appear anywhere in it
(the two Stripe secret-key setting names are referred to only as *"the
forbidden literals"*), no PSP endpoints, no key material. Secret/key
identifiers use **placeholder names per B8**.

## 1. Endpoint, auth, transport

### 1.1 Endpoint
`POST {hub-internal-base}/internal/v1/payment-events` — the sender resolves
the hub base URL from its own env (`INTERNAL_WEBHOOK_HUB_URL`, marketplace
settings). Path is fixed by the sender's pre-wired channel; the hub MUST
serve exactly this path.

### 1.2 Authentication — signed-envelope HMAC
| Header | Value |
|---|---|
| `Content-Type` | `application/json` |
| `X-Product` | routing label; hub-bound events carry `hub` |
| `X-JOL-Timestamp` | unix seconds at send time |
| `X-JOL-Signature` | `hex( HMAC-SHA256( K_delivery, "{ts}.{sha256_hex(body_bytes)}" ) )` |

**Receiver verification (normative, in order):**
1. Presence of all four headers → else `400`.
2. Timestamp within **±300 s** window (replay protection; ASSUME-PAY-003) → else `401`.
3. Recompute signature over the **raw request body bytes**; compare in
   **constant time** → mismatch `401`. Never log the expected/received
   signature values.
4. `X-Product` == `hub` → else `400` (misrouted event).

### 1.3 Delivery-key handling & rotation
- Key identifiers (placeholders, B8): sender side = marketplace's
  `INTERNAL_WEBHOOK_HUB_KEY` env (their existing naming); hub side =
  `HUB_PAYMENT_DELIVERY_KEY` (new hub placeholder), stored in Vaultwarden,
  injected at deploy, never in git/logs/CLI args (hub secrets policy).
- Sender and hub must hold the **same value**; no derivation, no split
  knowledge.
- **Rotation (90-day cadence, aligned with the ratified Bitrix24 token
  rotation precedent; ASSUME-PAY-002)**: change-controlled; dual-key window
  — hub accepts signatures under `K_new` or `K_old` for ≤7 days; sender
  switches once; hub drops `K_old`; rotation recorded in both trees' logs.
- Compromise suspicion → immediate out-of-band rotation, incident per
  marketplace `INCIDENT_RESPONSE.md` + hub IR runbook.

### 1.4 Transport
- On-prem internal network between marketplace and hub hosts (Proxmox
  estate). **TLS terminated at hub ingress even for internal paths**
  (defense-in-depth / zero internal trust); cert from the estate CA. The
  internal listener spec belongs to jol-infrastructure / jol-m-infrastructure
  (**ASSUME-PAY-001** — confirm config before M-1 code).
- Sender HTTP timeout: **10 s**. Receiver MUST ack well inside it.

### 1.5 Delivery semantics, retries, idempotency, ordering
- **At-least-once**: sender Celery task `max_retries=8`, base delay 30 s,
  retry on transport failure (5xx/timeout/exception). **Duplicates are
  expected.**
- **Receiver MUST dedupe by `event_id`** before any side effect
  (persist-before-process: durable event record first, then processing).
- **Duplicate policy**: a known `event_id` returns `200` no-op (idempotent
  accept), never an error.
- **No ordering guarantee**: events may arrive out of order or replayed.
  Receiver applies **status-precedence by `occurred_at`**, never arrival
  order: terminal-success outranks pending; `charge.refunded` applies after a
  succeeded payment; stale (older `occurred_at`) updates are recorded but do
  not downgrade state.
- **Poison-pill rule**: content/schema problems return `4xx` (which the
  sender does NOT retry — `<500` = delivered). Never `5xx` on validation
  errors; `5xx` is reserved for genuine unavailability.

## 2. Payload schema (v1.0.0 — sender whitelist is normative)

Envelope = exactly these 8 fields (`ENVELOPE_FIELDS`; nothing else crosses
the boundary; unknown fields MUST be ignored, not rejected):

| Field | Type | Req | Notes / example |
|---|---|---|---|
| `event_id` | string | yes | `evt_internal_` + 16 hex; **dedupe key** — e.g. `evt_internal_0f3a9c1de2b74a58` |
| `type` | string | yes | one of §2.1 — e.g. `payment_intent.succeeded` |
| `product` | string | yes | routing label; `hub` for hub-bound events |
| `payment_intent_id` | string | yes | sender-side `InternalPaymentIntent` primary key (opaque identifier; NOT a PSP object id) |
| `status` | string | yes | intent status at emission — e.g. `succeeded`, `failed` |
| `amount_cents` | integer | yes | minor units — `10000` = 100.00 EUR |
| `currency` | string | yes | ISO-4217 — `EUR` |
| `occurred_at` | string (ISO-8601) | yes | sender emission time — `2026-08-27T14:03:11.204815+00:00` |

### 2.1 Event set (derived from sender code at `4faef0a` — ASSUME-MKT-005/ASSUME-PAY-004)

| `type` | Meaning | Receiver action (design) |
|---|---|---|
| `payment_intent.succeeded` | Payment completed | Record donation/payment fact; trigger hub-side fulfillment/acknowledgement flow |
| `payment_intent.payment_failed` | Payment failed | Record failure; no fulfillment; optional tenant-facing notice per tenant config |
| `charge.refunded` | Refund executed | Record refund against the original payment by `payment_intent_id` |

### 2.2 Example request (synthetic values)

```http
POST /internal/v1/payment-events HTTP/1.1
Content-Type: application/json
X-Product: hub
X-JOL-Timestamp: 1756310591
X-JOL-Signature: 9b2f…hex…c41a

{
  "event_id": "evt_internal_0f3a9c1de2b74a58",
  "type": "payment_intent.succeeded",
  "product": "hub",
  "payment_intent_id": "8123",
  "status": "succeeded",
  "amount_cents": 10000,
  "currency": "EUR",
  "occurred_at": "2026-08-27T14:03:11.204815+00:00"
}
```

### 2.3 Response contract

| Code | Meaning | Sender behavior |
|---|---|---|
| `200` | Durably accepted (or duplicate no-op) | Delivered; no retry |
| `400` | Schema/headers/misroute invalid | Delivered; no retry (receiver must alert internally) |
| `401` | Timestamp window or signature failure | Delivered; no retry (key/clock incident path) |
| `4xx` generally | Receiver-side rejection | No retry (`<500` = delivered) |
| `5xx` / timeout | Receiver unavailable | Retried (≤8, 30 s base) |

## 3. Art. 9 minimization — core design constraint

**The envelope carries payment facts plus the minimum tenant identifier
only.** In v1.0.0 the tenant is implied by the hub's own correlation of
`payment_intent_id` (hub-originated checkout reference) — **no personal data
crosses the boundary at all.** Any future field addition requires the §4
change-control path AND a DPIA revisit.

### 3.1 FORBIDDEN fields (never in this envelope; additions are contract violations)

| Forbidden | Reason |
|---|---|
| Donor name, email, phone, address, any free-text message | Personal data unnecessary for payment-fact delivery; Art. 5(1)(c) |
| Religious affiliation beyond the implied tenant id | Art. 9 special-category — linkage belongs hub-side under the DPIA |
| Obituary / memorial content | Art. 9 + deceased-person privacy posture |
| Card data, PAN, PSP object ids, tokens | PCI scope contamination; envelope is PAN-free by construction |
| IP addresses, device/browser fingerprints | ePrivacy; unnecessary |
| CRM/Bitrix24 ids or lead data | Cross-system linkage requires its own reviewed flow |

### 3.2 Legal-basis mapping of allowed fields

| Field | Purpose | Basis |
|---|---|---|
| `event_id`, `occurred_at` | Delivery integrity, dedupe, audit | Legitimate interest (secure processing); audit obligation |
| `type`, `status` | Fulfillment state machine | Performance of the tenant/platform contract |
| `product`, `payment_intent_id` | Routing + correlation to hub-side record | Performance of contract |
| `amount_cents`, `currency` | Financial record-keeping, reconciliation, transparency reporting | Legal obligation (accounting) + contract |

**Special-category note**: donation × religious-affiliation linkage is created
only hub-side, where the DPIA (O-013), consent/retention controls and Art. 9
lawful basis apply. This contract guarantees the boundary itself adds none.

## 4. Versioning & change control

- Contract SemVer; wire format identified by contract version. v1 = the
  sender's implemented whitelist at `4faef0a`.
- **Receiver-side tolerance** (extra-field tolerance, relaxed validation) is
  free; **wire-format changes are NOT unilateral**: require (1) joint
  change-controlled issues in BOTH trees, (2) sender whitelist amendment
  under marketplace ADR discipline, (3) version bump + log entries both
  sides, (4) DPIA revisit if any field touches §3.1 classes.
- Event-type additions: additive, but still joint (receiver must have
  handling before sender emits; coordination via both trees' logs).
- Deprecation: N+1 overlap window; removal only after both trees confirm.

## 5. OpenAPI (receiver endpoint, v1.0.0)

```yaml
openapi: 3.0.3
info:
  title: JOL Hub Internal Payment-Events Receiver
  version: 1.0.0
  description: >
    Hub-side receiver for signed payment-event envelopes from
    jol-m-marketplace payments_app (contract v1.0.0; ADR-009 Model A).
    Boundary CLOSED: test-mode/dry-run only until SAQ A.
paths:
  /internal/v1/payment-events:
    post:
      operationId: receivePaymentEvent
      parameters:
        - { name: X-Product, in: header, required: true, schema: { type: string, enum: [hub] } }
        - { name: X-JOL-Timestamp, in: header, required: true, schema: { type: integer, format: int64 } }
        - { name: X-JOL-Signature, in: header, required: true, schema: { type: string, pattern: "^[0-9a-f]{64}$" } }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/PaymentEventEnvelope" }
      responses:
        "200": { description: Durably accepted, or duplicate no-op (idempotent). }
        "400": { description: Invalid schema, headers, or misrouted product. No retry. }
        "401": { description: Timestamp outside ±300s window or signature mismatch. No retry. }
        "503": { description: Receiver unavailable; sender retries (<=8, 30s base). }
components:
  schemas:
    PaymentEventEnvelope:
      type: object
      additionalProperties: true   # tolerance; unknown fields ignored
      required: [event_id, type, product, payment_intent_id, status, amount_cents, currency, occurred_at]
      properties:
        event_id:          { type: string, pattern: "^evt_internal_[0-9a-f]{16}$" }
        type:              { type: string, enum: [payment_intent.succeeded, payment_intent.payment_failed, charge.refunded] }
        product:           { type: string, enum: [hub] }
        payment_intent_id: { type: string, description: Opaque sender-side identifier; not a PSP object id. }
        status:            { type: string }
        amount_cents:      { type: integer, format: int64 }
        currency:          { type: string, minLength: 3, maxLength: 3 }
        occurred_at:       { type: string, format: date-time }
```

## 6. Assumption Register entries (→ DECISION-LOG per O-014)

ASSUME-PAY-001 internal-path TLS posture confirmed by infra repos before M-1
code · ASSUME-PAY-002 90-day rotation cadence ratified by owner (precedent:
Bitrix24 tokens) · ASSUME-PAY-003 ±300 s replay window accepted by sender
team (clock sync NTP assumed on both hosts) · ASSUME-PAY-004 event set
complete at `4faef0a` — future sender event types need joint handling before
emission.

## 7. Exit-criteria self-check

| Criterion | Status |
|---|---|
| Mid-level dev can implement sender verification + hub receiver | §1.2 verification steps normative; §5 OpenAPI machine-usable |
| Minimization table complete | §3.1 forbidden, §3.2 allowed + legal basis |
| Guard safety | §0; no forbidden literals; file not on exemption path |
| Rollback stated | header table |
