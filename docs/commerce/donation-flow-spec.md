# Donation Flow Specification — v1

Status: RATIFIED SPEC (Phase 2.3, docs-only) · Date: 2026-08-28 · Governing: ADR-009 (Model A, CLOSED) · docs/payment-api-contract.md v1.1.0 · DPIA docs/compliance/dpia-payment-events.md (a5324427) · D-038/D-039 · Consumes: page packages 16/17 (c1bdbcdb/6d84c17e) · Adjudicates O-021 via DONATION-WIDGET-DISPOSITION-O-021.md.

## 1. Flow architecture

```
tenant site (hub-rendered, package 16)
  → donation form (amount, frequency, Art. 9 consent — hub)
  → HANDOFF (redirect, never embed) → marketplace-hosted checkout
  → Stripe capture (marketplace payments_app — SOLE PSP integrator, Model A)
  → PSP webhook → payments_app internal_forward.py
  → contract v1.1.0 envelope (HMAC-SHA256 over {ts}.{sha256(body)}, ±300s)
  → hub receiver /internal/v1/payment-events → facts table (DPIA C3)
  → return leg: donor lands back on tenant confirmation state
```

- **Handoff UX**: CheckoutHandoffLink (package 13 pattern) carries only non-personal context (cause/tenant ref, amount, frequency, consent ref id); donor identity is collected AT the marketplace checkout, never pre-passed by hub (minimization)
- **Return states**: success → thank-you + opaque `payment_intent_id` reference (shown masked; NEVER card/PSP details); failed → humane message from the marketplace return code, retry path, no guilt copy; abandoned → no hub-side record of the abandonment beyond aggregate analytics (consent-gated)
- **Failure paths per the contract's 3 event types**: `payment_intent.succeeded` → receipt fact (201, or 200 no-op on duplicate `event_id`); `payment_intent.failed` → failure fact, confirmation UI shows retry guidance; `charge.refunded` → refund fact recorded AGAINST the original `payment_intent_id` (contract §2.1), donor dashboard shows both lines; out-of-order arrivals tolerated (no ordering guarantee — render latest fact per intent); 4xx never retried by sender (poison-pill contract)
- **Zero personal data crosses** (contract §1): the envelope's 8-field whitelist is the entire surface; donor identity exists ONLY marketplace-side

## 2. Donor consent & Art. 9

- **Explicit consent capture** (package 16 §3): unbundled checkbox, purpose = "processing your donation in connection with {tenant} (religious-affiliation context)" — donation × affiliation is the Art. 9 signal; never pre-checked; plain-language; withdraw = as easy as grant
- **Purpose limitation**: consent covers receipting + tenant acknowledgment only; NOT marketing, NOT cross-tenant analytics, NOT profiling; separate opt-in for any communication
- **Retention** (D-022 pattern): LT fiscal/accounting records 10 years; **LV/EE: "being confirmed"** (never a fabricated value); consent records retained with the fiscal anchor they justify; withdrawal stops future processing, not lawful past retention
- **DSAR/erasure path**: donor requests route through package 23's DSR flow → hub erases its facts rows (they are pseudonymous — keyed by opaque intent id) and forwards the identity-bearing portion to the marketplace (processor, Art. 28 DPA obligation); erasure propagation is a contractual requirement on the marketplace side
- **Anonymous-donation analysis**: SUPPORTED — the architecture makes it nearly free: hub never receives identity anyway; "anonymous" = donor skips the optional name/message fields at marketplace checkout AND opts out of the affiliation-consent (then no Art. 9 signal is recorded at all); impact page (17) shows anonymous gifts in aggregates only; receipting for anonymous donors uses the opaque reference alone

## 3. Donation History / Impact data model (hub-side)

- **Facts table** (DPIA C3): shared schema, RLS-free, NO tenant-id column, NO donor identity columns — columns = contract envelope fields + received_at; correlation key = `payment_intent_id` (opaque)
- **Impact reporting**: aggregates computed from facts (totals per cause/tenant from the CMS-curated cause ref); public page shows totals only — per-donor breakdowns NEVER public (package 17 aggregation threshold)
- **Donor dashboard boundary**: hub RENDERS (package 17 surface 2), facts come from the whitelist table only; the dashboard's identity resolution (which donor owns which intents) is marketplace-side — hub asks the marketplace session layer, never stores the mapping; masked display of the opaque id

## 4. Transparency requirements

- **Fee disclosure (D-001)**: where the 10% platform commission applies to donations (per ratified pricing), the donor sees the split BEFORE handoff — "{amount} to the cause · {commission} platform support" in plain numbers; if donation commission policy is unsettled for a jurisdiction: **"being confirmed"** shown, never a hidden charge
- **VAT display**: donations are typically outside VAT scope — display states the jurisdiction truth; unconfirmed → "being confirmed" (honesty rule, batch-3 precedent)
- **SCA-ready copy**: "your bank may ask you to confirm this payment" (3DS happens marketplace-side; hub never renders PSP frames); exemption language only when PSP-verified — never fabricated
- **Tax-deductibility claims: NEVER fabricated** — per-jurisdiction verified statement or "being confirmed"

## 5. Phasing

1. **Default OFF**: donations disabled per tenant (renderer `donations` feature flag; donation-cta module returns null without it — as-built behavior already matches)
2. **Enablement gate** (per tenant): change-controlled record (DECISION-LOG entry) + test-mode validation pass (M-2 dry-run pattern, a3e1f240) + owner authorization
3. **LIVE gate** (per jurisdiction): SAQ A verification + change-controlled opening plan (ADR-009 §4) + LV/EE retention advice for those jurisdictions + DPIA flag-on prerequisites a/b/c
4. **Build ordering** (DPIA-adjacent, 2.1 note): donation components (DonationForm v2, ConsentStep, CheckoutHandoffLink, DonationBanner, ImpactList, DonorFactTable) land AFTER the DPIA-gated AI safety patterns are proven — consent/gating machinery is reused, not rebuilt. **SUPERSEDED IN PRIORITY 2026-08-28 (DECISION-LOG D-052/D-053): the entire payment track is FROZEN and donation components are DEFERRED — excluded from all build plans until explicit owner unfreeze; the DPIA-adjacent ordering applies only after unfreeze**
5. **O-021 dependency**: the legacy PSP widget must be dispositioned (DONATION-WIDGET-DISPOSITION-O-021.md S1–S3) BEFORE donation components build starts — the guard extension (S3) is the build's entry gate

## 6. Test plan

| Layer | Tests | Mode |
|---|---|---|
| Flow (hub-side) | offline-mocked end-to-end: form → handoff URL construction (asserts no personal data in handoff params) → return-state rendering for all 3 event types + duplicate 200 + out-of-order | mocked; no network |
| Receiver | existing 13-test suite (M-2) remains the contract conformance suite; extend with `charge.refunded` correlation case if not covered | offline |
| Consent | consent-capture assertions: unbundled, default-unchecked, withdraw-path exists (DS-A11Y-10 pattern + DS-FORM-style minimization) | jsdom |
| Boundary | **zero PSP imports in hub** — the guard extension of Part A §3 IS this assertion; canary falsification in both directions (planted import → exit 1; clean tree → exit 0; today's tree pre-S2 → exit 1) | offline, ADR-010 discipline |
| Transparency | fee/VAT/SCA copy assertions: every monetary display carries its disclosure; "being confirmed" renders where value unverified (grep-gate over templates) | offline |

## 7. Open inputs

Owner disposition verdict on O-021 (Part A §5 decision points) · D-001 donation-commission policy per jurisdiction · LV/EE retention advice · SAQ A verification (LIVE only).
