# Page Package 09 — Russian Orthodox Churches Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 9 · Collection page (as packages 06/08) — the RU-locale-heavy page of batch 1.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb
2. `hero` (contained): "Russian Orthodox churches in {region}" + intro
3. Collection grid (contained): EntityCard per parish — name (native + locale transliteration), jurisdiction label (controlled vocabulary), location, service hint
4. PaginationBar (>12)
5. `content` (optional): jurisdiction context prose
6. Footer

## 2. Content model

Package 08 §2 with: entity fields `name_native` (✓, Cyrillic source of truth) + `name_transliterated` (○, per-locale); `jurisdiction` (✓ controlled vocabulary); **RU locale is PRIMARY audience here** — string-expansion budget RU +30% binds hardest (DS §5, DS-I18N-01/02); LT/EN render the same data with translated labels.

## 3. SEO metadata (row 9 — GAP flagged)

- Title: `Russian Orthodox Churches in {region/country}`
- JSON-LD: **`Church` (Orthodox) + denomination property** — builder status **GAP — as row 3**: shared `churchEntity` builder with Orthodox typing + denomination property; `ItemList` for the collection (package 06 pattern).
- hreflang/canonical: as package 01 §3 — note RU alternates (`ru-{c}`) must exist reciprocally where RU locale is enabled (verifyHreflangReciprocity enforces)

## 4. Component mapping

Package 08 §4 set unchanged — **no new backlog items**. Theme: `orthodox` profile for matching tenants (DS §1.2); DS §4 season-table extension point is orthodox-profile-eligible (config). DS-THEME-01 binds.

## 5. Audience journeys

- **Parishioner (Orthodox, RU-speaking)**: find parish in native language → service times (calendar note: Julian/Gregorian date display is DATA — `event.occurred_at` + display-calendar flag, not a component fork)
- **Parish admin**: listing accuracy + native-name correctness

## 6. a11y acceptance

DS-A11Y-01, 02, 03, 07, 09, 11 (`lang` per Cyrillic segments — binds here explicitly), 12 + DS-I18N-03 glyph coverage (Cyrillic subset)

## 7. Analytics

`page_view` (essential) · `entity_card_open` (consent-gated) · `jurisdiction_filter_use` (consent-gated, aggregate)
