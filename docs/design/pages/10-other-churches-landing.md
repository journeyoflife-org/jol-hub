# Page Package 10 — Other Churches Landing

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 10 · Collection page — shared reference structure = package 06 (collections) + package 08 (denomination dimension).

## 1. Wireframe (mobile-first, reading order)

1. Header/nav + breadcrumb · 2. `hero` (contained): "Other churches & communities in {region}" + neutral intro
3. Collection grid: EntityCard per community — name, tradition label (controlled vocabulary), location, service hint
4. PaginationBar (>12) · 5. `content` (optional): inclusive context prose (neutral, factual) · 6. Footer

## 2. Content model

Package 06 §2 with: entity field `tradition` (✓, **controlled vocabulary — never free text**, locale-translated labels; the vocabulary is DATA in the entity graph, editable only via CRM/entity data, not per-page). This is the denomination-agnostic landing: cards MUST render identically regardless of tenant theme.

## 3. SEO metadata (row 10 — GAP flagged)

- Title: `Churches & Communities in {region/country}`
- JSON-LD: **`PlaceOfWorship` (denomination-agnostic)** — props: name, address — builder status **GAP — as row 3** (strategy): the shared `churchEntity` builder (packages 03/04/07/08/09) covers this with plain `PlaceOfWorship` typing and NO denomination property; collection `ItemList` per package 06 pattern
- hreflang/canonical: as package 01 §3

## 4. Component mapping

Package 06 §4 set unchanged — **no new backlog items**. **DS-THEME-01 binds explicitly** (task-mandated): zero denomination string literals in `packages/ui` or renderer components — this page's grep-gate case is the strongest, since it must NOT visually privilege any profile; vocabulary flows through data only.

## 5. Audience journeys

- **Parishioner (any/none)**: find a community without denominational filtering being imposed
- **Parish admin**: verify listing neutrality + vocabulary accuracy

## 6. a11y acceptance

DS-A11Y-01, 02, 03 (roving tabindex), 07, 09, 12 + DS-THEME-01 (grep gate)

## 7. Analytics

`page_view` (essential) · `entity_card_open` (consent-gated) — no tradition-value tracking (neutrality: filter analytics would profile denomination, so `tradition_filter_use` is deliberately ABSENT here unlike package 08)
