# Page Package 06 — Deaneries Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 6 · Renderer: collection page = `hero` + collection grid (existing `collection-view.ts`/`collections.ts` surface) + `content` intro.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb (diocese → deaneries)
2. `hero` (contained): "Deaneries of {diocese}" + one-line explainer
3. Collection grid (contained): EntityCard per deanery — name, parish count, dean name, region
4. PaginationBar (contained, if >12 items)
5. `content` (contained, optional): what a deanery is (educational prose)
6. Footer

## 2. Content model

| Field | Req | Locale behavior | Admin-editable |
|---|---|---|---|
| collection title/intro | ✓ | translated | ✓ |
| deanery entities (name, region, dean, parish count) | auto | names per-locale; counts computed | via entity data (CRM) |
| prose explainer | ○ | translated | ✓ |

## 3. SEO metadata (row 6 — GAP flagged)

- Title: `Deaneries — {Diocese name}`
- JSON-LD: **`ItemList` of `ReligiousOrganization`** — `itemListElement` with member orgs — builder status **GAP: reuse ItemList builder** (strategy row 6); implementation note: `itemListEntity` wrapping the existing `ReligiousOrganization` path; each item carries absolute URL (SEO hard rule 1). Collection additionally emits `BreadcrumbList` (implemented pattern).
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · BreadcrumbBar ✓/partial · EntityHero ✓ · CollectionGrid ✓ · EntityCard ✓ · PaginationBar ✓/partial (finish per DS §6) — **no new backlog items**; reuse-first page.

## 5. Audience journeys

- **Parishioner**: locate neighboring parishes within a deanery
- **Parish admin**: verify deanery membership listing accuracy

## 6. a11y acceptance

DS-A11Y-01, 02 (card imagery), 03 (roving tabindex in grid per DS §2 keyboard maps), 07, 09, 12

## 7. Analytics

`page_view` (essential) · `entity_card_open` (consent-gated) · `pagination_use` (consent-gated, aggregate only)
