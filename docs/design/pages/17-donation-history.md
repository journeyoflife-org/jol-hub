# Page Package 17 — Donation History / Impact

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 17 · ADR-009 (CLOSED) · contract v1.1.0 · DPIA a5324427 — boundary posture identical to package 16 (design + dry-run only; no LIVE until SAQ A + owner flag-on).

## 1. Wireframe (mobile-first) — TWO SURFACES, strictly separated

1. **Public impact page** (indexable): `hero` ("what your gifts built") + aggregated impact blocks (totals, projects funded, testimonial-style outcomes) + `content` prose + donation CTA (→ 16)
2. **Per-donor view** (authenticated, **noindex**): AuthGate → donor's own giving facts, rendered from contract facts correlated by `payment_intent_id` — aggregate status/amounts/dates only; no PSP data, no cross-tenant joins

## 2. Content model

| Surface | Data source | Rules |
|---|---|---|
| Public impact | tenant CMS aggregates (admin-curated) + computed totals from facts table | **aggregation threshold: public totals only, never per-donor breakdowns public**; curated figures admin-editable, computed figures system-only |
| Per-donor view | contract facts (DPIA C3 facts table) | donor identity exists ONLY marketplace-side; hub view is keyed by the authenticated session's marketplace-linked identity — hub stores no donor PII; retention per D-022 (LT 10y; **LV/EE "being confirmed"** — honesty rule) |

## 3. SEO metadata (row 17 — GAP flagged)

- Public impact page: `WebPage` (+ aggregated `ItemList` of impact items) — builder status **GAP: new builder** (trivial, wire existing primitives)
- Per-donor views: **noindex authenticated surfaces** (row 17 explicit); no JSON-LD ever; robots policy by kind
- hreflang/canonical: public page per package 01 §3; donor view none

## 4. Component mapping

PageShell ✓ · EntityHero ✓ · ImpactList ✗ build (DS §6 backlog, shared with 16 trio) · DonorFactTable ✗ build (authenticated; renders contract facts, masked opaque IDs) · AuthGate ✓ — **same DPIA-adjacent phasing as package 16: lands after DPIA-gated safety patterns are proven.**

## 5. Audience journeys

- **Donor**: see impact → trust → give again (public surface; no login wall on impact)
- **Parish admin**: curate impact narrative honestly (curated figures must be substantiated — no fabricated impact numbers; honesty rule extends from legal values to impact claims)

## 6. a11y acceptance

DS-A11Y-01, 03, 07, 09, 12 (public); +10 and 05 on the authenticated table/dialogs — authenticated ≠ exempt

## 7. Analytics

`page_view` (essential) · `impact_block_open` (consent-gated) · `donation_cta_click` — per-donor views: essential telemetry only; giving amounts NEVER in analytics even in aggregate without consent review
