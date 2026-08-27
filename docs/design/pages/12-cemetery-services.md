# Page Package 12 — Cemetery Services

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 12 · Renderer: `cleaning-template` as-built is the starting point (`hero` + `service-list` + `content` + `map` + `contact-form`).

## ⚠ SAFETY GATE (batch-3 pattern, as package 11)

Any grief/bereavement-adjacent entry (memorial-care support contacts) loads from safety.yml (O-010); **absent config HIDES those entries — never hardcoded, never degraded.**

## 1. Wireframe (mobile-first) — pastoral-first, same ethics as package 11 §2

1. Header/nav + breadcrumb · 2. `hero` (contained): cemetery name + services summary + contact CTA
3. `service-list` (contained): grave care, cleaning, memorial upkeep, seasonal care — plain-language cards with what's included (prices shown factually where published — no dark patterns, no urgency)
4. `content` (contained): how care works, schedules, regulations
5. `map` (contained): cemetery location + opening hours (→ page 22 for the plot map; this page links, never embeds plot data)
6. `contact-form` · 7. Footer

## 2. Content model

Package 11 §2 tone rules apply. Fields: service cards (name, includes, price-if-published — **○ optional; absent = "contact for details", never a fabricated price**), opening hours (✓ structured), regulations prose (✓ translated). Graves-as-products distinction: where grave plots are SOLD, they are commerce objects (package 13 territory) — this page covers CARE services only.

## 3. SEO metadata (row 12 — GAP flagged)

- Title: `{Cemetery Services} — {tenant} | {city}`
- JSON-LD: `LocalBusiness` + `Service` (cleaning/care); **graves as `Product` where sold** — props: geo, openingHours, offers — builder status **GAP: `localBusinessEntity` available** (strategy row 12); Product emission for sold plots is wired ONLY where the commerce flag is set (and inherits package 13's boundary rules)
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · EntityHero ✓ · ServiceList ✓ (cleaning-template) · MapBlock ✗ (shared backlog, packages 03/04) · BereavementSupportBlock ✗ (shared, package 11) · ContactBlock ✓

## 5. Audience journeys

- **Family member**: arrange ongoing grave care → order/inquire
- **Parish admin**: keep service offerings/hours current

## 6. a11y acceptance

DS-A11Y-01, 02, 03, 07, 09, 10, 12 + DS-UX-11 (safety.yml gating)

## 7. Analytics

`page_view` (essential) · `service_card_open` · `contact_form_submit_success` (consent-gated) — pastoral restraint per package 11 §7
