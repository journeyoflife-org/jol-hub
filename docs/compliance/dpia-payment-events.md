# DPIA — Marketplace → Hub Payment-Events Flow (O-013)

Status: **DRAFT — verdict pending platform owner** · Date: 2026-08-27 · Trigger: MASTER-PROMPT §13 "church + marketplace data sharing" (exact match) · Governing: GDPR Art. 35; ADR-009; `docs/payment-api-contract.md` v1.0.0.

This document plus the contract v1.0.0 fully reconstructs the flow for a regulator. The verdict is a RECOMMENDATION; the decision belongs to the platform owner.

---

## 1. Processing description

### 1.1 Parties & roles
- **Marketplace `payments_app`** (sole PSP integrator, Model A / ADR-009): origin of payment events. Holds donor personal data under the marketplace's own GDPR responsibilities and legal bases — out of scope of this DPIA except as the flow's boundary.
- **Hub `apps/payment_events` receiver** (as-built `c0ce4c8c`, dormant flag-gated): durable acceptance of signed payment facts only. Controller context: JOL hub platform (tenant-facing platform operator).

### 1.2 What crosses the boundary — 8-field whitelist, zero personal data
Contract §3: "no personal data crosses the boundary at all." Verified envelope (contract §2 / OpenAPI): `event_id`, `type`, `product`, `payment_intent_id`, `status`, `amount_cents`, `currency`, `occurred_at`. Contract §3.1 forbidden list is enforced by receiver schema whitelist — extra fields are dropped, never stored (asserted by automated test). Legal-basis map per contract §3.2 (delivery integrity / performance of contract / legal accounting obligation).

### 1.3 What stays where
- **Marketplace tree**: donor identity, contact data, PSP objects, card rails (PCI — marketplace scope only). Never transmitted here.
- **Hub tree**: the 8 payment facts, stored in PostgreSQL table `payment_events_paymentevent` (columns = whitelist + `received_at`). Tenant correlation happens **hub-side** via the opaque `payment_intent_id` (hub-originated checkout reference) under existing consent controls and schema-per-tenant + RLS isolation (ADR-001).

### 1.4 Data flow (text diagram)
```
Donor → marketplace checkout (Stripe Payment Element, SAQ-A, marketplace scope)
      → marketplace payments_app PaymentRecord [personal data remains here]
      → signed envelope (HMAC-SHA256 over {ts}.{sha256(body)}, 8 fields ONLY)
      → HTTPS POST /internal/v1/payment-events
      → hub receiver: headers → ±300s window → constant-time HMAC → product
        routing → whitelist schema → event_id dedupe → persist
      → hub payment_events table [payment facts only]
      → hub-side correlation: payment_intent_id → tenant donation context
        [inside tenant schema, RLS, consent controls — linkage created HERE]
```

### 1.5 Storage locations & retention
- Hub: PostgreSQL (shared infrastructure; placement relative to tenant schemas is condition C3 below). Marketplace: its own store, its own schedule.
- **Retention: not yet fixed for the new table — condition C1.** Recommended anchor: accounting/legal-obligation retention of the jurisdiction of the tenant, applied to payment facts (not personal data); erasure requests cannot target these rows directly as personal data (they contain none), but the hub-side correlation record remains subject to Art. 15/17 in the tenant schema.

## 2. Necessity & proportionality

**Zero-personal-data crossing is the maximal minimization posture** (Art. 5(1)(c)): the same fulfillment outcome (knowing that a payment for a product succeeded) is achievable with facts alone, so facts alone are transmitted. Any future envelope field addition requires contract §4 change control AND a DPIA revisit — minimization is procedurally locked, not merely implemented.

Residual risks and mitigations:

| Residual risk | Mitigation | Status |
|---|---|---|
| Correlation-key abuse (`payment_intent_id` linking facts to tenants) | Key is opaque, hub-side only, never returns to marketplace; tenant-scope access via schema-per-tenant + RLS (ADR-001); DB-level access controls | Mitigated |
| Log leakage of envelopes | **Verified today**: receiver has ZERO logging statements; `django.request` logger is ERROR-level metadata only; no middleware logs bodies. Standing obligation: no raw-body logging in this flow, asserted at any future change | Verified clean — no pre-flag-on fix needed |
| Timing analysis of signature check | `hmac.compare_digest` (constant-time); uniform 401 error shape for window and signature failures | Mitigated |
| Replay / duplicate injection | ±300s window + `event_id` unique dedupe (persist-before-process) | Mitigated |
| Scope creep (personal fields added later) | Contract §3.1 forbidden table + §4 versioning + schema whitelist drops unknown fields | Procedurally locked |

## 3. Art. 9 analysis — precise location map

Special-category data (religious affiliation, implied by donation to a parish):
- **EXISTS** in the marketplace's own donor records (their GDPR scope/basis).
- **EXISTS** hub-side in tenant parish records (schema-per-tenant; existing lawful basis and consent controls).
- **IS CREATED as linkage** (donation × affiliation) **only hub-side** at correlation time — that is the processing this DPIA governs; it occurs inside the tenant-isolated schema under existing consent/retention controls.
- **DOES NOT EXIST** on the boundary: the envelope carries no affiliation, no donor identity, no content; contract §3.1 forbids religious affiliation beyond the implied tenant id, obituary/memorial content, and CRM linkages.

## 4. Risk assessment & consultation

| Risk | Likelihood | Impact | Mitigation / Owner |
|---|---|---|---|
| Envelope schema drift re-introducing personal data | Low | High | Contract versioning + whitelist schema + DPIA revisit clause / platform architect |
| Receiver enabled without change control | Low | High | Flag default false; flag-off returns 404; enabling requires on-record owner authorization / platform owner |
| Hub DB compromise exposes payment facts | Low | Medium (facts only, no identities) | Encryption at rest (ZFS aes-256-gcm, MASTER-PROMPT §13), backups/DR baseline / security owner |
| Marketplace-side breach of donor data | n/a here | High | Out of scope — marketplace's own DPIA obligation; boundary design limits contagion to facts / marketplace owner |

**Consultation**: no statutory DPO consultation is triggered at this scale; recommend (a) security-owner review before flag-on, (b) no clerical review needed — no religious content crosses or is generated. Art. 36 consultation not required (residual risk after mitigations: low).

## 5. Verdict recommendation — CONDITIONAL-GO

**Recommendation: CONDITIONAL-GO.** Reasons: the design is the strongest available posture (zero personal data in transit/storage at the boundary), residual risks are mitigated or procedurally locked, and verification found no blocking defect (logging check clean). Conditions:

| # | Condition | Gates |
|---|---|---|
| C1 | Retention schedule fixed for `payment_events_paymentevent` (jurisdiction-anchored) | flag-on |
| C2 | Dry-run delivery evidence recorded (marketplace sender → hub dev instance, flag on, test keys both sides) | flag-on |
| C3 | Storage placement relative to tenant schemas decided (shared vs tenant schema for the facts table) | flag-on |
| C4 | No-raw-body-logging obligation carried into the flow's change checklist | ongoing |

**Dry-run itself is NOT blocked by this DPIA** (test-mode, test keys, flag-gated, zero production personal data involved) — subject to the owner's explicit authorization.

## 6. Change control

Any envelope field addition: contract bump + this DPIA revisited before implementation (contract §4). Receiver behavior changes follow hub commit governance. Evidence of as-built verification (2026-08-27): receiver logging grep = 0; `django.request` ERROR-only; `payment_events/views.py` verification order matches contract §1.2; schema = 8-field whitelist (+received_at).
