# Page Package 08 — Protestant Churches Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 8 · Collection page (as package 06) with a denomination dimension.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb
2. `hero` (contained): "Protestant churches in {region}" + one-line intro
3. Collection grid (contained): EntityCard per congregation — name, tradition label (Lutheran/Reformed/etc. from entity data, system-controlled vocabulary), location, service-time hint
4. PaginationBar (>12 items)
5. `content` (optional): brief denomination context prose (neutral, factual)
6. Footer

## 2. Content model

Package 06 §2 with: entity field `tradition` (✓, **controlled vocabulary — never free text**, locale-translated labels); no sacrament schedule assumption (events optional per congregation).

## 3. SEO metadata (row 8 — GAP flagged)

- Title: `Protestant Churches in {region/country}`
- JSON-LD: **`PlaceOfWorship` + `additionalProperty` denomination** — props: name, address, denomination — builder status **GAP — as row 3** (strategy): the shared `churchEntity` extension covers this with `@type: PlaceOfWorship` + denomination property; items in the collection additionally emitted via `ItemList` (package 06 pattern).
- hreflang/canonical: as package 01 §3

## 4. Component mapping

Package 06 §4 set (PageShell, BreadcrumbBar, EntityHero, CollectionGrid, EntityCard, PaginationBar) — **no new backlog beyond the already-flagged BreadcrumbBar/PaginationBar finishes**. Theme: `protestant` profile applies to tenants whose `theme_ref` says so (DS §1.2) — the landing page itself renders in the tenant's theme; DS-THEME-01 forbids denomination literals in components (vocabulary flows through data).

## 5. Audience journeys

- **Parishioner (Protestant)**: find a congregation of my tradition near me → service times
- **Parish admin**: verify congregation listing + tradition labeling accuracy

## 6. a11y acceptance

DS-A11Y-01, 02, 03 (roving tabindex), 07, 09, 12

## 7. Analytics

`page_view` (essential) · `entity_card_open` (consent-gated) · `tradition_filter_use` (consent-gated, aggregate)
