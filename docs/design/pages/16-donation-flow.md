# Page Package 16 — Donation Flow

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 16 · ADR-009 (boundary **CLOSED**, Model A) · docs/payment-api-contract.md v1.1.0 · DPIA `docs/compliance/dpia-payment-events.md` (a5324427, conditions C1–C4 resolved).

## ⚠ BOUNDARY STATUS (task-mandated, explicit)

**The payment boundary is CLOSED (ADR-009 §1): this package is DESIGN + DRY-RUN territory only.** No LIVE donation acceptance until: SAQ A verification + change-controlled opening plan (ADR-009 §4) + explicit owner flag-on authorization (DPIA flag-on prerequisites a/b/c). Interim UX: the flow must render in **test-mode posture** — and the option to keep donations OFF entirely per tenant is the default until then.

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): cause/mission framing, "why your gift matters" (pastoral, never guilt-driven — package 11 §2 ethics apply)
3. DonationForm: amount presets + custom amount (VAT handling: donations are typically out-of-scope; display states the truth per jurisdiction — **if unconfirmed: "being confirmed", never a fabricated tax claim**), frequency (one-off / recurring)
4. Consent step (Art. 9 — below) · 5. **Handoff to marketplace checkout** (Model A: PSP capture is `payments_app`-side only; zero PSP surface in hub) · 6. Confirmation state: thank-you + receipt facts (opaque reference only — below)
7. Footer

## 2. Contract consumption (task-mandated)

- What crosses back to hub after payment: **ONLY the contract v1.1.0 8-field whitelist** — `event_id`, `type`, `product`, `payment_intent_id` (opaque sender-side key, NOT a PSP object id), `status`, `amount_cents`, (+ remaining envelope fields), `ts` — **zero personal data crosses the boundary** (contract §1; DPIA C3: hub stores RLS-free facts, no tenant-id column, no donor identity)
- Hub-side correlation: `payment_intent_id` only; donor identity stays marketplace-side; the confirmation UI shows the opaque reference, never card/PSP details
- Dedupe + idempotency per contract (duplicate `event_id` = 200 no-op) governs the receipt state rendering

## 3. Art. 9 / DPIA consent patterns (a5324427)

- Donations to religious organizations can imply **religious-belief data (Art. 9 special category)** — therefore: **explicit consent** for processing the donation-as-membership-signal, separate from payment processing itself (which is contract-performance-based and lives marketplace-side)
- Consent UI: unbundled checkbox (never pre-checked), plain-language purpose statement, withdraw-as-easy-as-grant, consent record stored with the retention anchor of D-022 (LT 10y for fiscal records; **LV/EE retention "being confirmed" — honesty rule**)
- No profiling of donors; no donation-history inference across tenants (schema isolation, ADR-001)

## 4. PSD2/SCA-ready copy (task-mandated)

- Checkout handoff copy states: strong customer authentication may be required by the donor's bank; 3DS challenges happen **marketplace-side** (hub never renders PSP frames); recurring donations carry SCA exemption-language only when the PSP configuration supports it — **until verified: "your bank may ask you to confirm this payment", never a fabricated exemption claim**
- Amount clarity pre-handoff: final amount incl. currency, frequency, cancel-anytime statement for recurring

## 5. SEO metadata (row 16 — GAP flagged)

- JSON-LD: `DonateAction` + `Organization` (recipient) — **agent omitted (donor privacy)** — builder status **GAP: new builder** (strategy compliance note applies); no personal data in structured data, ever
- noindex the flow steps themselves; only the cause page is indexable; hreflang/canonical as package 01 §3 for the indexable cause page

## 6. Component mapping

PageShell ✓ · EntityHero ✓ · DonationForm ✗ build (DS §6 backlog) · ConsentStep ✗ build · CheckoutHandoffLink ✗ (shared, package 13) · DonationBanner ✗ (shared, packages 01/07). **DPIA-adjacent phasing (2.1 note): donation components land AFTER the DPIA-gated AI work's safety patterns are proven — the consent/gating machinery is reused, not rebuilt.**

## 7. Audience journeys

- **Donor**: moved by cause → amount → consent → handoff → confirmation (≤4 steps to handoff)
- **Parish admin**: enable/disable donation surface per tenant (visibility toggle level only until boundary opens)

## 8. a11y acceptance

DS-A11Y-01, 03, 07, 09, 10 (form binds hardest: consent checkbox labeling, error linkage), 12 + DS-FORM-25-style minimization (collect nothing beyond what consent + receipt require)

## 9. Analytics

`page_view` (essential) · `amount_select` (consent-gated, amount band only) · `consent_grant` / `consent_decline` (aggregate, no identity join) · `checkout_handoff_click` — **donor identity never enters analytics; C4 obligation (contract §2.3: receivers MUST NOT log raw bodies) applies to all donation-event consumers**
