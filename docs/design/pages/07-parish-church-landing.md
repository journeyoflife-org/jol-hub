# Page Package 07 — Parish Church Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 7 · Entity landing family (module sequence as package 03; this is the highest-volume template — the church-template as-built in the renderer is its starting point).

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb (deanery → parish)
2. `hero` (full-width): parish name, patron saint, address, CTA (mass times)
3. `event-list` (contained, **promoted**: mass/sacrament schedule is the primary journey)
4. `content` (two-column-60-40): parish life prose | fact card (patron, founded, deanery/diocese links, priest)
5. `service-list`: sacraments, baptisms, marriages, funerals (→ page 11 link)
6. `news-list` (latest 3) · 7. `gallery` · 8. `map` + office hours
9. `donation-cta` — **backlog DonationBanner (DS §6)** · 10. `contact-form` + Footer

## 2. Content model

Package 03 §2 with: designation = "parish"; fields `patron_saint` (✓), `priest` (○, name only — no personal contact data published without consent, GDPR), `sacrament_schedule` (✓ structured events). Mass times are EVENTS (module `event-list`), not free text — locale times preserved verbatim.

## 3. SEO metadata (row 7 — GAP flagged)

- Title: `{Parish name} ({patron}) — {city}`
- JSON-LD: `Church` — props **name, address, geo, parentOrganization** (as rows 3/4) — builder status **GAP — same `churchEntity` builder as packages 03/04** (implement once, parameterized). BreadcrumbList + collection ItemList patterns apply.
- hreflang/canonical: as package 01 §3

## 4. Component mapping

Package 03 §4 set + NewsList ✓ + **DonationBanner ✗ backlog** + EntityFactCard ✗ + MapBlock ✗ (shared builds). Theme: tenant's `theme_ref` (typically catholic); DS-THEME-01 binds.

## 5. Audience journeys

- **Parishioner**: mass times → sacrament info → contact (primary; wireframe promotes event-list)
- **Funeral director**: funeral service path (service-list → page 11)
- **Donor**: parish mission → donation CTA

## 6. a11y acceptance

DS-A11Y-01, 02, 03, 05 (any schedule dialogs), 07, 08, 09, 10, 12

## 7. Analytics

`page_view` (essential) · `mass_times_open` · `sacrament_link_click` · `funeral_service_click` · `donation_cta_click` · `contact_form_submit_success` (all non-essential consent-gated)
