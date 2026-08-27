# Performance — STEP 13 (Core Web Vitals Budgets)

JOL renders ~400,000 tenant sites from one Next.js app on **modest on-prem
hardware** (Proxmox VMs on a Dell R640 — no AWS/GCP, no cloud CDN in the
pilot; an EU-jurisdiction CDN or self-hosted caching may join later). Every
performance decision here is made against that constraint: bytes cost real
CPU and NIC on our own box. Targets: **Lighthouse ≥ 90 mobile**, Core Web
Vitals green (LCP < 2.5s, INP < 200ms, CLS < 0.1).

```
packages/perf                     apps/template-renderer
─────────────                     ──────────────────────
budget.ts        ─────────────►   budget.json          (budget contract)
measure.ts                            scripts/check-perf-budget.ts (offline gate)
report.ts                             lighthouserc.js    (Lighthouse CI)
types.ts                              src/components/WebVitals.tsx (RUM)
                                      src/app/api/perf/route.ts   (RUM ingress)
```

## Budgets (single source of truth: `budget.json`)

Standard Lighthouse budget format; consumed by BOTH enforcement paths.

| Resource | Budget (KiB, transfer) | Notes |
| --- | --- | --- |
| JavaScript (initial) | 200 | per-route first-load JS, gzipped |
| CSS (initial) | 50 | per-route, gzipped |
| Images | 500 / page | AVIF/WebP via `next/image` |
| Fonts | 100 | system-first stacks → 0 in pilot |
| Third-party scripts | 100 | Stripe is backend-hosted → ~0 in pilot |
| Document (HTML) | 50 | RSC output |
| Total | 1000 | whole page transfer |

| Timing (emulated mobile, 4G) | Budget |
| --- | --- |
| Time to Interactive | 3500ms |
| First Contentful Paint | 1800ms |
| Largest Contentful Paint | 2500ms |
| Cumulative Layout Shift | 0.1 |
| Total Blocking Time | 200ms |

## Enforcement

**1. Offline byte-budget gate — `pnpm --filter template-renderer check-perf`**
The development workspace has no Chrome, so `scripts/check-perf-budget.ts`
enforces the JS/CSS budgets WITHOUT a browser: it reads
`.next/app-build-manifest.json`, measures the REAL gzipped (level 9)
first-load payload of every user-facing route via `@jol-hub/perf`, excludes
legacy `noModule` polyfills (modern-browser baseline), and exits non-zero on
any breach. Runs after `next build` (SOC 2 CC7.2 automated quality control).

**2. Lighthouse CI — `lighthouserc.js`**
For environments WITH Chrome (CI runners / Chromium-equipped stage box):
`npx @lhci/cli autorun`. Asserts `budget.json` PLUS score floors
(performance/a11y/best-practices ≥ 0.9, SEO ≥ 0.95) and explicit CWV numeric
floors across 5 representative tenant page types. Mobile emulation is the
default form factor (spec: "≥ 90 mobile"). `uses-http2` is skipped — that is
nginx's job, not `next start`'s.

Rule: **the build fails when a budget is exceeded.** Bisect with
`pnpm --filter template-renderer analyze` (`ANALYZE=true next build` →
`@next/bundle-analyzer` client/server views) when the gate trips.

## Bundle posture (code splitting)

| Surface | Strategy |
| --- | --- |
| Templates | Dynamic `import()` per vertical family in `lib/template-registry.ts` — a funeral visitor never downloads the diocese template (server-side chunk split) |
| Routes | App Router route-based splitting: per-route client JS only loads on that route (`app-build-manifest.json` is exactly what the gate measures) |
| Workspace barrels | `experimental.optimizePackageImports` for `@jol-hub/ui`, `@jol-hub/commerce`, `lucide-react`. Found by the gate + `pnpm analyze`: a bare `import { formatEur } from '@jol-hub/commerce'` dragged the Stripe browser SDK (44 KiB stat) and `import { Card } from '@jol-hub/ui'` dragged the ENTIRE ui surface (compliance pages, donation widgets, zod forms) into every route. Fix cut the worst route 235 → 151.9 KiB gzipped |
| Commerce (Stripe) | Backend-hosted Checkout + PaymentIntents — **no Stripe browser SDK in the client bundle** (payment-boundary guard enforces); commerce widgets are client islands on commerce routes only |
| CRM (Bitrix24) | Zero Bitrix JS ships to the browser: CRM surfaces call same-origin `/api/crm/*` route handlers → server-only `CrmBackendClient` (`lib/bitrix-client.ts`) |
| Polyfills | Legacy `noModule` polyfills excluded from the modern baseline (gate) |

Hard rules (from the STEP-13 spec, enforced by review + gate):

- Never import an entire library for one function — tree-shake or replace.
- Never render-blocking scripts in `<head>` (theme init is the ONE inline
  script, ~200B, CLS-critical).
- Client components only where interactivity exists; templates, collections,
  articles and JSON-LD are pure React Server Components.

## Images

`next.config.js` → `images.formats: ['image/avif', 'image/webp']` (AVIF
~30% smaller than WebP; both fall back to the original for legacy agents),
tuned `deviceSizes`/`imageSizes`, `minimumCacheTTL` 30 days (immutable
hashed URLs). `next/image` provides responsive `srcset`, lazy loading
below the fold, explicit width/height (CLS rule), and `priority` for
above-the-fold heroes only.

Tenant uploads: the backend optimizes at ingest (Sharp pipeline, backend
repo) and serves WebP; the renderer never hot-links unoptimized originals.
SVG: svgo at authoring time; icons ride the lucide/inline-SVG path.

## Fonts

**System-first token stacks** (`@jol-hub/ui/styles/tokens.css`): Inter /
Source Serif 4 preferred when present on the device, deterministic
fallbacks otherwise. Zero webfont requests → zero font-bytes, zero
FOUT/FOIT, zero CLS from font swap. When webfonts are vendored later
(`next/font/local`, offline builds allow no CDN fetch):

- Subset to Latin + Latin Extended + Cyrillic (lt/en/ru pilot).
- `font-display: swap` with `size-adjust` on the fallback metric match.
- `<link rel="preload">` the heading weight only; variable fonts over
  static families.

## Third-party scripts

- **Stripe**: server-side intent creation + hosted surfaces — nothing
  global in `<head>` (commerce spec, STEP 12).
- **Analytics**: consent-gated (GDPR Art. 6/7) — nothing loads before the
  visitor grants the `analytics` category.
- **Bitrix24**: no browser widget at all — server-side CRM client behind
  same-origin route handlers (STEP 9 security posture).

## Caching

**App layer (`next.config.js` headers):**

| Path | Cache-Control |
| --- | --- |
| `/_next/static/*` | `public, max-age=31536000, immutable` (hashed) |
| `/_next/image/*` | `public, max-age=604800, stale-while-revalidate=86400` |
| `/sitemap.xml` | `public, max-age=600, stale-while-revalidate=3600` |
| `/robots.txt` | `public, max-age=3600` |

**Rendering layer:** per-route ISR windows (see RENDERING.md) — home 300s,
about/contact 3600s, news 60s; events/services intentionally `no-store`
(live inventory). `compress: true` keeps gzip on at the Next layer as the
FALLBACK; the reverse proxy does the real work. `poweredByHeader: false`
(no tech disclosure, smaller responses).

**nginx/Proxmox layer (jol-infrastructure):** brotli ≥ gzip for static +
HTML (verify `Content-Encoding: br`), HTTP/2, keep-alive upstreams,
`proxy_cache` for `/_next/static` + `/_next/image` so repeat hits never
touch Node, HTTP/3 when the cert stack supports it.

**Backend:** Redis for frequent tenant/content queries (backend repo,
STEP 6 fetch contracts give the renderer ISR on top).

## Monitoring (RUM + lab)

**Real User Monitoring:** `src/components/WebVitals.tsx` (mounted in the
root layout) collects LCP / INP+FID / CLS / TTFB / FCP via
`next/web-vitals` and POSTs to the same-origin `/api/perf` ingress —
**only after analytics consent** (`jol-cookie-consent` localStorage
contract, re-checked per metric so mid-session consent starts reporting).
Payload carries NO personal data: metric id/name/value/rating + page path.
The route validates with zod and forwards to
`BACKEND_API_URL/api/v1/perf/web-vitals` when configured; pilot answers
204 and drops (RUM must never surface errors). `keepalive: true` so
metrics survive page hide.

**Lab:** Lighthouse CI per PR (above); weekly bundle-size review of the
gate report keeps trend lines visible. Custom metrics (e.g. time-to-first-
prayer) can attach to the same ingress when the content model lands them.

**Resource hints:** DNS prefetch/preconnect for external origins belong to
the tenant layouts once third-party origins (Stripe, YouTube embeds) are
actually referenced by a rendered page — hints are never emitted
speculatively (CSP + privacy).

## Mobile

- Viewport meta set by Next.js; touch targets ≥ 44px (WCAG 2.2 AA, STEP 12).
- Correct input types (`tel`, `email`, `date`) across forms.
- `prefers-reduced-motion` honored in `@jol-hub/ui` (spinner/skeleton,
  globals.css transitions).
- No 300ms tap delay (modern viewport semantics).
- Future: `navigator.connection`-aware image quality on slow links.

## Compliance

| Obligation | Posture |
| --- | --- |
| SOC 2 CC7.2 | Automated performance quality control: byte-budget gate in build, Lighthouse CI on PR, RUM ingress for field data |
| GDPR Art. 32 | Availability as security: budgets sized for the R640, proxy caching, no third-party dependency for first paint |
| GDPR Art. 6/7 | RUM strictly consent-gated; metric payload carries no personal data |
| Core Web Vitals | Google ranking factor — budgets pinned to the green thresholds |

## Acceptance verification

| Criterion | Status |
| --- | --- |
| Initial JS < 200KB gzip / CSS < 50KB | **PASS** — gate measured 25 routes: worst 151.9 KiB (tenant layout), tenant pages 134.7 KiB, shell 87.6 KiB, CSS 0 KiB (tokens inlined via RSC) |
| Lighthouse mobile ≥ 90 on all page types | `lighthouserc.js` ready; requires a Chrome-equipped environment (offline workspace has none) |
| CWV green (LCP/INP/CLS) | Budget floors asserted in both gates; RUM collects field data post-consent |
| Bundle analyzer: no unexpected heavy deps | No Stripe browser SDK, no chart/map libs in client bundle; lucide barrel tree-shaken |
| Images WebP/AVIF + responsive srcset | `next/image` with AVIF/WebP formats configured |
| Fonts swap, no FOUT/FOIT | System-first stacks → zero webfont requests in pilot |
| Third-party scripts only on relevant pages | Stripe backend-hosted; Bitrix24 on-demand; analytics consent-gated |
| Brotli active | nginx-layer (jol-infrastructure); app-level gzip fallback verified via `compress: true` |
| Lighthouse CI passes | Config committed; runs where Chrome exists |
| Web Vitals RUM logging | `/api/perf` ingress + consent-gated reporter wired in root layout; runtime-verified (valid POST → 204, malformed → 400) |
| No functional regression from splitting | Renderer tests 21/21, a11y check 0 violations across 7 pages, HTML renders with gzip + immutable-cache headers |

Rollback: every STEP-13 change is additive (config, gate script, reporter);
reverting the commit restores the pre-STEP-13 build with no functional
impact. If a future change blows a budget, the gate report names the route;
bisect with the bundle analyzer and revert the offending import.
