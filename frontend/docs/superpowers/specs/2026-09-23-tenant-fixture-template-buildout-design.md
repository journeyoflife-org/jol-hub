# Tenant Fixture & Template Family Build-Out

## Goal

Populate all 44 tenant fixtures with 5 standard page archetypes each (~220 pages), and implement the 7 missing block renderers in `TemplateRenderer`. Pages emerge from data + templates, not from hand-coding 200 individual pages.

## Architecture

```
page-archetypes.ts          5 factory functions → TenantPage[]
        │
        ▼
generate-pages.ts           Script: run factories → write fixture JSON
        │
        ▼
fixtures/tenants/*.json     44 tenants × 5 pages = ~220 pages
        │
        ▼
TemplateRenderer.tsx        14/14 block types rendered (was 7/14)
```

## Scope

### In scope

- 5 page archetype factories (`homePage`, `aboutPage`, `contactPage`, `servicesPage`, `schedulePage`)
- `generateTenantPages(fixture)` composition function
- Generation script (`generate-pages.ts`)
- 7 missing block renderers in `TemplateRenderer` (massSchedule, gallery, faq, sacramentList, clergyRoleList, visitingInfo, mapLocation)
- Updated fixture JSON for all 44 tenants
- Changeset for `@journeyoflife-org/seed-data`

### Out of scope

- New Zod schema types (all 14 block types already exist)
- New template families (5 existing families remain)
- Route changes (`app/[locale]/[tenant]/[...slug]/page.tsx` handles arbitrary slugs)
- Content API changes (`fetchTenantPage()` still wins over fixture pages)
- i18n changes (`LocalizedText` already carries lt/en/ru/pl)
- Hand-tuning individual tenant content (factories produce good-enough content)

## Section 1: Page Archetype Factories

File: `packages/seed-data/src/page-archetypes.ts`

### homePage(fixture) → TenantPage

Route: `/`

| Block order | sacred/eastern | congregation | administrative | memorial |
|-------------|---------------|--------------|----------------|----------|
| 1 | hero (name + tagline) | hero | hero | hero |
| 2 | massSchedule | schedule | schedule | list (services) |
| 3 | stats | stats | stats | stats |
| 4 | cta (shop + sacraments) | cta (contact + news) | cta (contact + news) | cta (contact) |

### aboutPage(fixture) → TenantPage

Route: `/about`

| Block order | sacred/eastern | congregation | administrative | memorial |
|-------------|---------------|--------------|----------------|----------|
| 1 | text (history from tagline) | text | text | text |
| 2 | keyValue (identity facts) | keyValue | keyValue | keyValue |
| 3 | clergyRoleList | clergyRoleList | visitingInfo | visitingInfo |
| 4 | mapLocation | mapLocation | mapLocation | mapLocation |

### contactPage(fixture) → TenantPage

Route: `/contact`

| Block order | All verticals |
|-------------|--------------|
| 1 | keyValue (address, email, phone from identity) |
| 2 | mapLocation (from identity.address) |
| 3 | schedule (office hours) |

### servicesPage(fixture) → TenantPage

Route: `/services`

| Block order | sacred/eastern | congregation | memorial |
|-------------|---------------|--------------|----------|
| 1 | hero | hero | hero |
| 2 | sacramentList | list (services) | list (services + prices) |
| 3 | faq | faq | faq |

### schedulePage(fixture) → TenantPage

Route: `/schedule`

| Block order | sacred/eastern | congregation | administrative | memorial |
|-------------|---------------|--------------|----------------|----------|
| 1 | hero | hero | hero | hero |
| 2 | massSchedule | schedule | schedule | schedule |
| 3 | gallery (sacred only) | gallery | — | — |

### generateTenantPages(fixture) → TenantPage[]

Composes all 5 archetypes. Returns `[homePage, aboutPage, contactPage, servicesPage, schedulePage]`.

## Section 2: Missing Block Renderers

File: `apps/template-renderer/src/components/TemplateRenderer.tsx`

### massSchedule

Card grid: day + time + language badge + notes. Uses `Card`/`CardContent`/`Badge`. Pattern: similar to `schedule` but with liturgical context (language tag per mass).

### gallery

Responsive grid (1/2/3/4 cols via `md:grid-cols-2 lg:grid-cols-3`). Each image: `loading="lazy"`, explicit width/height (CLS), localized alt, optional caption below.

### faq

Native `<details>/<summary>` accordion. Zero JS. Question in `<summary>`, answer in body. `font-heading` for questions.

### sacramentList

Card list: name (localized) + description + schedule + requirements. Uses `Card`/`CardContent`.

### clergyRoleList

Definition list (`<dl>`): role + description + contact email link. No names (GDPR Art. 9 — names come from RLS content API, never from fixtures).

### visitingInfo

Table: day / open / close. Admission note below table. Uses `Card` wrapper.

### mapLocation

Static map image (fallback for JS-disabled browsers) + directions link. Coordinates in `data-lat`/`data-lng` attributes for future JS map integration.

## Section 3: Fixture Generation

File: `packages/seed-data/scripts/generate-pages.ts`

1. Import all fixtures from registry
2. For each fixture, run `generateTenantPages(fixture)`
3. Merge generated pages into fixture (preserve existing hand-crafted pages by route — if a fixture already has a `/` page, the generated one replaces it)
4. Write updated JSON back to `fixtures/tenants/*.json`
5. Re-validate all fixtures against `TenantFixtureSchema`

### Execution order

1. Implement 7 missing block renderers in `TemplateRenderer`
2. Write `page-archetypes.ts` with 5 factories + `generateTenantPages()`
3. Write `generate-pages.ts` script
4. Run script → fixture JSON updated
5. Verify: `pnpm typecheck`, `pnpm test`, `pnpm verify:parity`, `pnpm verify:contrast`
6. Commit block renderers + archetypes + script in one commit
7. Commit fixture JSON in a second commit (large diff)

## Section 4: Error Handling & Conventions

- Generation script fails if a fixture doesn't validate (registry throws at load time — already enforced)
- Block renderers degrade gracefully: empty arrays produce no output
- Missing `identity` fields → blocks that need them (mapLocation, clergyRoleList) are skipped
- Generated `ru` text follows existing convention: `"en text [TODO: verify with parish/diocese — do not publish unverified]"`
- Existing hand-crafted pages in reference fixtures (parish-st-john-vilnius, basilica-vilnius-cathedral, etc.) are replaced by archetype output for consistency

## Deliverables

| File | Change |
|------|--------|
| `packages/seed-data/src/page-archetypes.ts` | New: 5 factories + `generateTenantPages()` |
| `packages/seed-data/scripts/generate-pages.ts` | New: generation script |
| `apps/template-renderer/src/components/TemplateRenderer.tsx` | Modified: 7 new block renderers |
| `packages/seed-data/src/fixtures/tenants/*.json` | Modified: 44 tenants × 5 pages |
| `.changeset/tenant-page-archetypes.md` | New: changeset |
