# Page Package 03 — Basilica Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 3 · Renderer: entity landing = `hero` + `content` + `event-list` + `service-list` + `gallery` + `map` + `contact-form` composition.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb (`BreadcrumbList` parent: diocese/home)
2. `hero` (full-width): basilica name, designation badge, address line, primary CTA (mass times)
3. `content` (two-column-60-40): history + significance prose | fact card (dedication, style, founded, diocese link)
4. `event-list` (contained): liturgy schedule (next 7)
5. `service-list` (contained): sacraments/visitor services offered
6. `gallery` (contained): 6–10 images
7. `map` (contained): location + opening hours card
8. `contact-form` + Footer

## 2. Content model

| Field | Req | Locale behavior | Admin-editable |
|---|---|---|---|
| entity.name | ✓ | per-locale (LT official + EN/RU) | ✓ |
| entity.address + geo | ✓ | address translated; geo shared | ✓ |
| designation ("basilica") | ✓ | system constant, not free text | ✗ |
| history prose | ✓ | translated | ✓ |
| dedication/style/founded | ○ | translated | ✓ |
| parent diocese ref | ✓ | data link (entity graph) | via CRM/entity data |
| liturgy schedule | ✓ | structured events (locale times) | ✓ |
| images+alt | ○ | shared; alt translated | ✓ |

## 3. SEO metadata (row 3 — GAP flagged)

- Title: `{Basilica name} — {city} | {tenant}`
- JSON-LD: `Church` (+ `CatholicChurch` where precise) + `PlaceOfWorship`; required props: **name, address, geo, parentOrganization (diocese)** — builder status **GAP: extend `localBusinessEntity`** (packages/seo); implementation note: add `churchEntity` builder wrapping `localBusinessEntity` with `@type` array + `parentOrganization` org ref. BreadcrumbList emitted per collection pattern.
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · BreadcrumbBar ✓/partial (finish per DS §6) · EntityHero ✓ · EntityFactCard ✗ **build (new, minor)** · EventCalendar ✓ · ServiceList ✓ · Gallery ✓ · MapBlock ✗ **build (CemeteryMapCanvas is the large map; this is a lightweight location map — flag in backlog)** · ContactBlock ✓. Theme: catholic profile default (DS §1.2), DS-THEME-01 applies.

## 5. Audience journeys

- **Parishioner/pilgrim**: confirm identity → mass times → location
- **Funeral director**: verify venue details for a service inquiry (contact path)

## 6. a11y acceptance

DS-A11Y-01, 02 (gallery/map labels), 03, 07 (card targets), 08, 09, 10, 12

## 7. Analytics

`page_view` (essential) · `mass_times_open` · `map_directions_click` (consent-gated; no third-party map SDK — static/self-hosted tiles only) · `contact_form_submit_success`
