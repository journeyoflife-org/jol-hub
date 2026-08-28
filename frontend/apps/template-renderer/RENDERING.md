# Rendering Strategy — template-renderer (STEP 6)

How each page class is rendered (SSG / ISR / SSR), why, and the one platform
constraint that shapes all of it.

## The lang constraint (read this first)

The root layout (`app/layout.tsx`) sets `<html lang>` from the middleware-set
`x-locale` request header, i.e. it calls `headers()`. In Next.js App Router,
reading a dynamic API in a layout opts the **entire route subtree** into
per-request (dynamic) rendering. Consequence: **no tenant page can be emitted
as a build-time static HTML file or a fully cached ISR page.** Every
`/[locale]/[tenant]/...` request is server-rendered on demand (the build output
marks them all `ƒ Dynamic`).

This is deliberate and correct: the document language is request-scoped (a
`/lt/...` and `/en/...` hit for the same tenant must not share one cached
shell), and tenant resolution itself is request-scoped (host/subdomain/`X-Tenant`).

### What `revalidate` still does

Even though full-page caching is off, each page still exports its intended
`revalidate` window. That window is honored at the **data cache** layer
(`fetch(..., { next: { revalidate } })` in `lib/content-api.ts`), so the
underlying content is cached and refreshed within the interval even though the
HTML is assembled per request. Net visitor-facing behavior is equivalent to
ISR for the content that matters; only the (cheap) render pass runs each hit.

If the lang dependency is ever lifted (e.g. move `lang` to a client effect or
per-locale layouts), the exported `revalidate` values immediately upgrade these
pages to true ISR/SSG with **no code changes**.

## Per-page strategy

| Route                       | Intent | Export                     | Why                                                                    |
| --------------------------- | ------ | -------------------------- | ---------------------------------------------------------------------- |
| `[tenant]` (home)           | ISR    | `revalidate = 300`         | Content changes infrequently; 5 min staleness is acceptable.           |
| `[tenant]/about`            | SSG    | `revalidate = 3600`        | Rarely changes; 1 h window.                                            |
| `[tenant]/contact`          | SSG    | `revalidate = 3600`        | Contact details change rarely; 1 h window.                            |
| `[tenant]/news` (list)      | ISR    | `revalidate = 60`          | News changes frequently; short staleness window.                       |
| `[tenant]/news/[slug]`      | ISR    | `revalidate = 300`         | Detail tolerates a longer window than the list.                        |
| `[tenant]/events` (list)    | SSR    | `dynamic = 'force-dynamic'`| Time-sensitive: "upcoming" is re-evaluated against the clock per hit.  |
| `[tenant]/events/[slug]`    | SSR    | `dynamic = 'force-dynamic'`| Registration/availability must be fresh.                               |
| `[tenant]/services` (list)  | SSR    | `dynamic = 'force-dynamic'`| Commercial pricing/availability must be fresh.                         |
| `[tenant]/services/[slug]`  | SSR    | `dynamic = 'force-dynamic'`| Price/booking state must be fresh.                                     |

Data-fetch caching mirrors this (`lib/content-api.ts`): news fetches use
`revalidate = 60`; events/services fetch with `cache: 'no-store'`.

## Routing architecture

`[tenant]` is served by a set of **specific routes** plus a **required
catch-all**:

- `page.tsx` → home
- `about/`, `contact/`, `news/`, `events/`, `services/` (+ `[slug]/`) → specific
- `[...slug]/` → everything else (compliance routes, arbitrary fixture pages,
  unknown → 404)

Next.js resolution order (static > dynamic > catch-all) means the specific
routes win for their exact paths and the catch-all handles the remainder. The
previous **optional** catch-all `[[...slug]]` owned the home path too, which
would have collided with `page.tsx`; it was converted to the **required**
`[...slug]` so home is unambiguous.

### Fixture-first delegation

Every specific route runs `resolveTenantRoute()` then `renderFixtureRoute()`
(`lib/route-dispatch.tsx`): if the seed fixture carries content for that route,
it wins (the 12 pilot tenants keep their exact output). Only when there is no
fixture page does the route fall through to the STEP 6 composition/collection
system. Detail routes (`news/[slug]`, etc.) have no fixture equivalent
(fixtures are flat) and are always collection-driven.

## Collections in the pilot

There is no backend content service yet (`BACKEND_API_URL` unset), so news /
events / services collections resolve to **empty**. The list pages render
accessible, translated empty states and the detail routes return a bare 404 for
any slug. Content is never fabricated for real institutions; it flows from the
backend when that service ships, at which point these exact pages hydrate with
real items (pagination 10/page, calendar indicators, filters — already wired).

## SEO contract (every page)

- `<title>`, `<meta name="description">`, canonical + per-locale hreflang
  alternates + Open Graph via `lib/page-seo.ts` (`buildTenantMetadata`).
- JSON-LD structured data via `lib/json-ld.tsx`:
  - home → Organization (vertical-aware `@type`) + WebSite
  - about → AboutPage; contact → ContactPage
  - news list → ItemList + BreadcrumbList; news detail → NewsArticle + BreadcrumbList
  - events list → ItemList + BreadcrumbList; event detail → Event + BreadcrumbList
  - services list → ItemList + BreadcrumbList; service detail → Service(+Offer) + BreadcrumbList

## Error handling

- `[tenant]/not-found.tsx` — tenant-branded 404 for known tenants (unknown
  tenants never reach it; see middleware).
- `[tenant]/error.tsx` — client error boundary: retry, contact-support link,
  error reference (`digest`) for log correlation.
- `about/loading.tsx` + `contact/loading.tsx` — skeletons matching page
  dimensions (no layout shift), `aria-busy` announcement.

### Why there is no tenant-level `loading.tsx`

A `loading.tsx` at `[tenant]/` wraps every tenant page in an implicit Suspense
boundary. A documented Next.js limitation then turns `notFound()` thrown by the
async collection detail routes (`news/[slug]`, `events/[slug]`,
`services/[slug]`) and the catch-all into **soft-200s** — the 404 body streams
but the HTTP status is 200. That breaks the hard "slug not found → 404" SEO
rule. Verified empirically: removing the boundary restores real 404 status.

Correct 404 semantics outrank the skeleton here, and the tenant pages are fully
server-rendered (no client-side data fetch), so a loading skeleton adds little.
Skeletons are therefore only placed on `about/` and `contact/`, which never
`notFound()` for a known tenant and are safe to wrap.
