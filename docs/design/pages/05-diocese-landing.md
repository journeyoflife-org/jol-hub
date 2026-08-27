# Page Package 05 — Diocese Landing

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 5 · Renderer: `hero` + `content` + `feature-grid` (deaneries/parishes entry) + `news-list` + `event-list` + `contact-form`.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav + breadcrumb (home)
2. `hero` (contained): diocese name, patron, bishop line, CTA (find a parish)
3. `feature-grid` (contained): Deaneries · Parishes · Cathedrals/Basilicas · News — the entity-graph entry points
4. `content` (contained): about the diocese (history, structure)
5. `event-list`: diocesan events (next 5)
6. `news-list`: latest 3 diocesan news
7. `contact-form` (curia office) + Footer

## 2. Content model

| Field | Req | Locale behavior | Admin-editable |
|---|---|---|---|
| entity.name | ✓ | per-locale | ✓ |
| patron / bishop | ○ / ✓ | translated / name shared | ✓ |
| about prose | ✓ | translated | ✓ |
| child counts (deaneries, parishes) | auto | computed from entity graph | ✗ |
| events/news | auto | locale-filtered | via CMS |

## 3. SEO metadata (row 5 — Partial)

- Title: `{Diocese name} — {country/region}`
- JSON-LD: `ReligiousOrganization` — props: **name, address, memberOf/parent, numberOfEmployees (optional)** — builder status **Partial: `ReligiousOrganization` path exists** in `packages/seo/src/structured-data.ts`; implementation note: wire the existing path with parent/memberOf refs; no new builder needed.
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · BreadcrumbBar ✓/partial · EntityHero ✓ · FeatureGrid ✓ · CollectionGrid ✓ (child lists) · EventCalendar ✓ · NewsList ✓ · ContactBlock ✓ — **no new backlog items**.

## 5. Audience journeys

- **Parishioner**: find my parish through structure (diocese → deanery → parish)
- **Parish admin**: confirm organizational placement and curia contacts

## 6. a11y acceptance

DS-A11Y-01, 02, 03, 07 (grid targets), 09, 10, 12

## 7. Analytics

`page_view` (essential) · `feature_tile_open` · `parish_finder_start` (consent-gated) · `contact_form_submit_success` (consent-gated)
