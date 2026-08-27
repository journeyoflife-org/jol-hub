# Page Package 11 — Funeral Services

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 11 · Renderer: `hero` + `service-list` + `content` + `contact-form`; `funeral-template` as-built is the starting point.

## ⚠ SAFETY GATE (batch-3 pattern)

Crisis-adjacent entries (bereavement support contacts, grief resources) load from owner-curated `countries/{cc}/config/safety.yml` (O-010, OPEN). **Graceful degradation rule: absent safety.yml HIDES crisis-adjacent entries entirely — never renders hardcoded numbers, never degrades to partial content.**

## 1. Wireframe (mobile-first) — PASTORAL-FIRST ordering

1. Header/nav + breadcrumb · 2. `hero` (contained): calm, direct — "We are here to help" + immediate contact CTA (phone first on mobile)
3. `service-list` (contained): funeral service offerings (what happens, steps, what families need to prepare) — plain language, no commercial pressure
4. `content` (contained): guidance prose (arranging a funeral, what to expect) + safety.yml-fed bereavement support block (gated as above)
5. `contact-form` (contained): "speak with someone" — topic preset to funeral service
6. Footer

## 2. Pastoral-first crisis-keyword ethics (task-mandated, per SEO strategy)

- **Keyword posture**: crisis/bereavement keywords are served pastorally, never commercially — no upsell modules, no price-first presentation, no urgency patterns on this page; SEO value is a byproduct of genuinely helpful content, not the design driver
- Copy tone: second person, plain, short sentences; no euphemism overload, no clinical coldness
- Grief/bereavement resources section: safety.yml constants only (same pattern as package 21); DS-UX-style assertion **DS-UX-11**: crisis block renders ONLY when safety.yml resolves non-empty for the locale

## 3. SEO metadata (row 11 — Implemented path)

- Title: `{Funeral Services} — {tenant} | {city}`
- JSON-LD: `FuneralHome` + `Service` — props: **name, address, telephone, areaServed, offers** — **Implemented** path (`FuneralHome` vertical builder); offers present but presented pastorally on-page (schema completeness ≠ commercial UX)
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · EntityHero ✓ · ServiceList ✓ (funeral-template as-built) · BereavementSupportBlock ✗ **build (safety.yml-fed, gated)** · ContactBlock ✓ — small backlog addition.

## 5. Audience journeys

- **Bereaved family (primary)**: immediate contact → understand steps → arrange (≤3 clicks to a human)
- **Funeral director (partner)**: venue/service facts for coordination

## 6. a11y acceptance

DS-A11Y-01, 03, 07, 09, 10 (contact form), 12 + DS-UX-11 (safety.yml gating) — crisis contexts raise the a11y stakes: screen-reader users must reach the contact CTA first (Tab order)

## 7. Analytics

`page_view` (essential) · `contact_call_click` · `contact_form_submit_success` (consent-gated) — **NO journey-funnel tracking of bereaved users beyond these; no retargeting hooks, ever**
