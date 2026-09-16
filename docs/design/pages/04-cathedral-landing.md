# Page Package 04 — Cathedral Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 4 · Structurally an entity landing (see package 03 for shared composition); deltas specified here — implementable without reading 03's prose, but reuse its module sequence.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb (parent: diocese)
2. `hero` (full-width): cathedral name, **see/diocese seat badge**, address, CTA (mass times)
3. `content` (two-column-60-40): history + cathedra significance | fact card (diocese, dedication, founded, bishop link)
4. `event-list`: liturgy schedule incl. diocesan celebrations
5. `service-list`: sacraments + visitor info
6. `gallery` · 7. `map` + hours · 8. `contact-form` + Footer

## 2. Content model

As package 03 §2 with substitutions: designation = "cathedral" (system constant); additional field `diocese_seat_of` (✓, entity-graph link, admin-visible read-only); liturgy schedule may include diocesan-level events (flag per event).

## 3. SEO metadata (row 4 — GAP flagged)

- Title: `{Cathedral name} — Seat of {Diocese} | {tenant}`
- JSON-LD: `Church` (**cathedral role expressed via `additionalProperty`**, per strategy row 4) — required props as row 3: name, address, geo, parentOrganization. Builder status **GAP — same `localBusinessEntity` extension as package 03** (one `churchEntity` builder serves 03/04/07 with type/role parameters — implement once).
- hreflang/canonical: as package 01 §3

## 4. Component mapping

Identical to package 03 §4 (shares **EntityFactCard ✗** and **MapBlock ✗** backlog items — single build serves both pages). Theme: catholic profile.

## 5. Audience journeys

- **Parishioner/pilgrim**: diocesan mother-church discovery → celebration schedule
- **Parish admin** (diocesan): verify seat representation + event flags

## 6. a11y acceptance

DS-A11Y-01, 02, 03, 07, 08, 09, 10, 12 (as package 03 §6)

## 7. Analytics

`page_view` (essential) · `mass_times_open` · `diocesan_event_open` (consent-gated) · `contact_form_submit_success` (consent-gated)
