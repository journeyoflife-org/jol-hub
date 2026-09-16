# SEO Architecture — STEP 11

JOL is an SEO platform: ~400,000 tenant sites across 27 EU countries. This
document is the operating manual for the renderer's SEO surface. The pure,
unit-tested primitives live in `packages/seo`; this app composes them into
Next.js `Metadata`, JSON-LD, `robots.txt` and `sitemap.xml`.

```
packages/seo                      apps/template-renderer
────────────────                  ──────────────────────
canonical.ts     ─────────────►   lib/seo.tsx        (origin resolution,
hreflang.ts                           absoluteUrl / buildSeoAlternates /
metadata.ts                           buildTenantBaseMetadata)
structured-data.ts                lib/page-seo.ts    (page Metadata)
sitemap.ts                        lib/json-ld.tsx    (JSON-LD components)
robots.ts                         app/robots.ts, app/sitemap.ts
open-graph.ts                     app/[locale]/[tenant]/** pages
indexing.ts
```

## Hard rules

1. **Every SEO URL is absolute** — protocol + public domain. Canonicals,
   hreflang, og:url, sitemap `<loc>` and ALL JSON-LD URLs. Internal `<a>`
   navigation stays relative.
2. **Canonicals carry no query parameters** and are trailing-slash
   normalized (`packages/seo/src/canonical.ts`). UTM forks are additionally
   kept out of the index by `Disallow: /*?*` in robots.
3. **hreflang is reciprocal by construction**: every localized page emits
   the SAME complete alternate set (all locales + `x-default`). Audited by
   `verifyHreflangReciprocity` in the package tests.
4. **Public content is always `index,follow`.** Robots policy is keyed by
   page KIND in one table (`robotsPolicyFor`); only `admin` / `editor` /
   `api` kinds are noindexed. A public page cannot be accidentally
   noindexed.
5. **No tenant enumeration.** Sitemaps, hreflang and 404s are scoped to the
   single tenant resolved for the request (GDPR Art. 9 / SOC 2 CC6.1).

## Origin resolution (proxy-safe)

`resolveSeoOrigin()` (`lib/seo.tsx`) derives the public origin from
`X-Forwarded-Host` (first hop) + `X-Forwarded-Proto`, falling back to
`Host`. Behind Proxmox/nginx the Next bind host is internal and must never
leak into SEO URLs. Same discipline as the middleware's `publicHost`.

## Metadata

| Layer | Source | Content |
| --- | --- | --- |
| Root layout | `app/layout.tsx` | White-label pass-through template `%s` (hub brand never wraps tenant titles); default `JOL-HUB` for title-less surfaces; no tenant hints |
| Tenant layout | `generateMetadata` + `buildTenantBaseMetadata` | Title template `%s \| {tenant.name}`, description from tagline (clamped 150–160), absolute home canonical + hreflang |
| Pages | `buildTenantMetadata` / per-page `generateMetadata` | SHORT page title (layout template appends the tenant suffix), auto/clamped description, per-route canonical/hreflang, OG/Twitter titles fully composed |
| News detail | `generateMetadata` | `og:type=article`, `publishedTime`/`modifiedTime`, headline as title |

- Descriptions target 150–160 chars (`clampDescription`, word-boundary cut).
  Missing descriptions fall back to tenant tagline; never fabricated.
- `keywords` meta is intentionally NOT emitted (deprecated signal).
- Twitter card: `summary` in the pilot (no raster OG image yet — see below);
  upgrades to `summary_large_image` when the OG image route lands.

## Structured data (JSON-LD)

Emitted via `<JsonLd>` (`lib/json-ld.tsx`) with `<script
type="application/ld+json">`; pure builders in `packages/seo/src/
structured-data.ts` cover the remaining schema types. All entity URLs are
absolute.

| Page | Entities |
| --- | --- |
| Home (fixture) | Organization (ReligiousOrganization / FuneralHome / LocalBusiness by vertical) + WebSite |
| Home (composed) | Vertical Organization subtype + WebSite (`base-template.tsx`) |
| About / Contact | AboutPage / ContactPage + Organization |
| News list | BreadcrumbList + ItemList |
| News detail | NewsArticle + BreadcrumbList |
| Events list/detail | Event (startDate/endDate/location/organizer) + BreadcrumbList + ItemList |
| Services list/detail | Service (provider/offers) + BreadcrumbList + ItemList |

Package builders available for the next surfaces: `localBusinessEntity`
(geo/openingHours/telephone), `productEntity` (PriceSpecification,
VAT-inclusive), `faqPageEntity`, `websiteWithSearchEntity` (SearchAction).

GDPR: generators never embed personal data beyond what the tenant publishes;
obituary names etc. are tenant content decisions, never derived here.

## Sitemap

`app/sitemap.xml` — per-request, per-tenant, force-dynamic:

- **No hub-level sitemap index.** A global index would enumerate the entire
  tenant registry. The STEP-11 spec's "index lists tenant sitemaps" is
  superseded by this security posture; per-domain indexes arrive with
  tenant domains (see Indexing).
- Unresolved requests → empty sitemap.
- URLs: home, fixture pages, shared compliance routes, collection lists;
  collection DETAIL URLs join automatically once the backend content plane
  is configured (`isContentApiConfigured()` gate).
- Policy (`SITEMAP_POLICY`): home daily/1.0, news daily/0.8, events
  hourly/0.9, about/contact/services monthly/0.5.
- lastmod: content `updatedAt`/`publishedAt` where available, else request
  time (pilot).
- hreflang alternates per URL (lt-LT, en-LT, ru-LT).
- Sharding: `shardUrls()` enforces the 50,000-URL protocol cap; the pilot
  tenant count is far below it. Country/region index sharding happens at
  the per-domain level, not here.

## robots.txt

`app/robots.ts` renders the `@jol-hub/seo` policy:

- Allow: `/` (public tenant content — SEO is the mission).
- Disallow: `/admin`, `/editor`, `/dashboard`, `/settings`, `/profile`,
  `/api/`, `/dev/`, error targets, and `/*?*` (query-string forks).
- `Crawl-delay: 1` — politeness for agents that honour it (Bing/Yandex).
  Google ignores it; the middleware rate limiter is the real protection.
- `Sitemap:` and `Host:` use the resolved PUBLIC origin.

## hreflang

Pilot matrix: `lt-LT`, `en-LT`, `ru-LT`; `x-default` → Lithuanian
(`X_DEFAULT_LOCALE`). Every page emits all alternates + x-default, so
reciprocity holds structurally. The full 27-country matrix replaces
`PILOT_HREFLANG` with per-country codes without touching call sites.

## Open Graph images

Contract fixed in `packages/seo/src/open-graph.ts`: **1200×630px, < 1MB**,
branded with tenant identity, route `/{tenant}/og.png?r={route}`.
Status: the rasterizer (`@vercel/og`/satori) is not installed in this
workspace (offline builds); metadata uses the documented fallback chain —
tenant-provided image → generated path → omit og:image rather than break
it. Twitter cards stay `summary` until images exist.

## Core Web Vitals — audit notes

Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1, TTFB < 600ms.

| Metric | Current posture | Notes / follow-ups |
| --- | --- | --- |
| TTFB | Tenant pages are RSC with ISR (`revalidate=300`) or cached fetches; events/services intentionally `no-store` | Add edge caching/CDN when domains land; backend queries are RLS-scoped single-schema lookups |
| LCP | System-first font stacks (zero webfont requests), no hero raster images in the pilot, no render-blocking third-party CSS/JS | When hero images land: `next/image` + `priority` and `<link rel="preload" as="image">` |
| INP | Client JS limited to interactive modules (auth/commerce/CRM/locale switcher); collection pages, articles and templates are pure server components | Debounce search input when VIP site search ships |
| CLS | `THEME_INIT_SCRIPT` inlined before first paint (no theme-change shift); fonts are system stacks (no FOUT/swap shift); no ads/dynamic slots | Keep explicit dimensions on any future media |

Field measurement (CrUX/Lighthouse CI) joins the SOC 2 CC7.2 quality gate
once public domains exist; the offline pilot build cannot produce field
data.

## Indexing strategy

- **IndexNow** (Bing/Yandex/Seznam): `buildIndexNowPayload()` in
  `packages/seo/src/indexing.ts` is the contract; the backend owns the key
  and submits changed URLs after content mutations (never from the frontend
  bundle).
- **Google Search Console**: one property per tenant domain, provisioned by
  jol-infrastructure; the renderer will emit the backend-injected
  verification meta tag. Not applicable before tenant domains.
- **Crawl budget**: robots crawl-delay + middleware rate limiting + sitemap
  changefreq/priority freshness signals.
- **Log analysis**: the middleware already logs
  `[tenant] <slug> <vertical> <method> <path>` per request; the analytics
  pipeline (jol-analytics-ai) filters crawler UAs there.
- **Google Business Profile** (future, local SEO): backend `apps/gbp`
  syncs reviews/photos/posts via the GBP API; frontend surface = reviews
  widget + GBP links in the Organization `sameAs` array.

## Acceptance verification

| Criterion | Status |
| --- | --- |
| Rich Results: Organization/LocalBusiness/Event/Article field sets | Builders emit required fields (name/url/address; name+startDate+location; headline+author+dates); validated by package tests — full Rich Results run requires a public URL |
| Sitemap valid + complete | Per-tenant, absolute URLs, policy-compliant; detail URLs gated on content plane |
| robots blocks admin, allows public | Verified by runtime curl |
| hreflang present + reciprocal | Reciprocity unit-tested (`verifyHreflangReciprocity`); runtime curl shows lt/en/ru + x-default |
| OG images 1200×630 | Contract fixed; rasterizer pending (fallback chain active) |
| Canonicals correct | Absolute, query-free, trailing-slash normalized — unit-tested |
| Descriptions unique, 150–160 | `clampDescription` unit-tested |
| BreadcrumbList on nested pages | All collection + detail pages |

Rollback: all STEP-11 changes are metadata-level; reverting the commit
restores the STEP-6 relative alternates without functional impact.
