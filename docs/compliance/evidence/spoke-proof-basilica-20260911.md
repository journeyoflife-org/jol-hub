# Spoke Proof Evidence — jol-site-basilica (Task 3.3)

> **Date:** 2026-09-11
> **Spoke commit:** `1197427` (jol-site-basilica)
> **Hub commit:** `aff1caa0` (jol-hub)
> **Page spec:** `docs/design/pages/03-basilica-landing.md`

## Step 1: Full Gate Battery

### Shell gates (all run locally, all exit 0)

| Gate | Script | Result |
|---|---|---|
| INV-3 Payment boundary | `check-payment-boundary.sh` | PASS — no PSP SDK imports |
| INV-7 Theme literals | `check-theme-literals.sh` | PASS — no denomination/country literals |
| Secrets scan | `check-secrets.sh` | PASS — no plaintext secrets |
| INV-6 Workflow completeness | `check-workflow-completeness.sh` | PASS — all 5 reusable workflows present |
| Satellite kit drift | `sops-validate.py --branch feat/pages-step6` | PASS — 3/3 files byte-identical |

### Hub invariant tests

| Test suite | Result |
|---|---|
| `adr011-invariants.test.ts` | 17/17 PASS, exit 0 |

### Gates requiring published @jol-hub/* packages (deferred)

| Gate | Status | Blocker |
|---|---|---|
| `type-check` (tsc --noEmit) | BLOCKED | @jol-hub/* packages not yet published |
| `test:unit` / `test:vitest` | BLOCKED | No test runner without node_modules |
| `test:e2e` (Playwright) | BLOCKED | Requires running dev server |
| `test:a11y` (check-a11y-pages.ts) | BLOCKED | Requires built .next output |
| `check-perf` (check-perf-budget.ts) | BLOCKED | Requires built .next output |
| `test:security` | BLOCKED | Requires dependency tree |

**Resolution:** These gates activate when `pnpm install` runs against published @jol-hub/* packages. The CI pipeline (`.github/workflows/ci.yml`) calls all 5 reusable workflows + drift-check, which will execute these gates in GitHub Actions.

## Step 2: Lighthouse ≥ 90 Mobile

**Status:** DEFERRED — requires deployed instance on Proxmox.

Target metrics (throttled mobile profile):
- Performance ≥ 90
- LCP < 2.5s
- CLS < 0.1
- Accessibility ≥ 90

## Step 3: Breakpoint Check (360 / 768 / 1024 / 1440 px)

**Status:** DEFERRED — requires running dev server.

All components use Tailwind responsive classes:
- `grid-cols-1 md:grid-cols-2` (keyValue, visiting hours)
- `grid-cols-2 md:grid-cols-3` (gallery)
- `grid-cols-2 md:grid-cols-4` (services list)
- `flex flex-wrap gap-4` (CTA buttons)

## Step 4: Three-Locale Parity

```
Total localized text objects: 39
Missing ru: 0
Missing en: 0

3-LOCALE PARITY: PASS
```

All 39 localized text objects carry `lt`, `en`, and `ru` keys.
No silent English fallback possible.

## Step 5: Deploy to Proxmox

**Status:** DEFERRED — requires:
1. GitHub repo `journeyoflife-org/jol-site-basilica` created
2. Spoke pushed to GitHub
3. `pnpm install` with published @jol-hub/* packages
4. Proxmox ingress + TLS configured
5. `noindex` until Vilnius mandate resolved

Rollback plan: redeploy previous immutable image tag (seconds).

## Step 6: A11y Acceptance (Static Analysis)

| Criterion | Requirement | Result |
|---|---|---|
| DS-A11Y-01 | html lang attribute | PASS — `<html lang="lt">` |
| DS-A11Y-02 | gallery/map labels | PASS — aria-label on all sections |
| DS-A11Y-03 | main landmark | PASS — `<main id="main-content">` |
| DS-A11Y-07 | skip-navigation | PASS — sr-only skip link |
| DS-A11Y-08 | target sizes | PASS — px-6 py-3 on all buttons |
| DS-A11Y-09 | focus visible | PASS — Tailwind focus: classes |
| DS-A11Y-10 | heading hierarchy | PASS — h1 → h2 → h3 |
| DS-A11Y-12 | landmark roles | PASS — nav, main, footer |
| WCAG 1.1.1 | img alt text | PASS — all images have alt |
| WCAG 1.1.1 | lazy loading | PASS — loading="lazy" |
| SEO | hreflang | PASS — lt/en/ru alternates |
| SEO | canonical | PASS — rel="canonical" |
| SEO | JSON-LD | PASS — Church + Event + BreadcrumbList |
| Analytics | consent-gated | PASS — localStorage check |

## TODO Markers (Unverified Liturgical Facts)

11 instances of `[TODO: verify with parish/diocese — do not publish unverified]`:

1. Tagline: basilica status year (1922 vs 1985 unresolved)
2. Hero body: consecration date + basilica elevation date
3. Sacrament: Mass intention description
4. Sacrament: Confession schedule
5. Sacrament: Baptism requirements
6. Clergy: Parish priest description
7. Clergy: Vicar description
8. Visiting info: Sunday notes
9. Visiting info: Admission text
10. (Fixture-level) tagline ru translation
11. (Fixture-level) hero body ru translation

**None of these may be published until the owner supplies an authoritative citation.**

## JSON-LD Verification

Page emits 3 JSON-LD scripts:
1. `Church` + `CatholicChurch` + `PlaceOfWorship` with `parentOrganization`
2. `BreadcrumbList` with home item
3. Mass schedule entries emit `Event` with `startDate` (NOT `openingHoursSpecification`)

## Summary

| Proof | Status |
|---|---|
| Shell gates (5/5) | PASS |
| Hub invariants (17/17) | PASS |
| 3-locale parity (39/39) | PASS |
| A11y static analysis (14/14) | PASS |
| TODO markers (11) | PRESENT |
| Lighthouse ≥ 90 | DEFERRED (needs deploy) |
| Breakpoints | DEFERRED (needs dev server) |
| Full gate battery | DEFERRED (needs published packages) |
