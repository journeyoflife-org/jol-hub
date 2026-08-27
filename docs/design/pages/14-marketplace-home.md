# Page Package 14 — Marketplace Home

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 14 · **CROSS-TREE BOUNDARY EXPLICIT (task-mandated): hub RENDERS, marketplace TRANSACTS; zero PSP surface in hub.**

## 1. Wireframe (mobile-first)

1. Header/nav (marketplace variant of PageShell) · 2. `hero` (full-width): marketplace value proposition + search (VIP SearchAction source) + vendor signup CTA
3. Category grid (`feature-grid`): product/service categories (vendors' offerings)
4. Featured vendors (`content`): curated vendor cards (public vendor data only)
5. "Become a vendor" block → onboarding (package 24 pattern, marketplace-flavored)
6. Footer

## 2. Content model — tree split

| Surface | Tree | Note |
|---|---|---|
| Home marketing content, category catalog, vendor public profiles | **hub** (this page renders) | indexable, SEO-bearing |
| Search index for VIP `SearchAction` | hub-rendered, **marketplace-sourced data** | via internal API — no personal data in search results beyond vendor public fields |
| Cart, checkout, vendor transactions | **marketplace** | zero PSP in hub (Model A, ADR-009 §2); boundary CLOSED → transactions test-mode only |
| Payment events back | contract v1.1.0 | product label distinguishes marketplace-bound events; hub stores facts only (DPIA C3) |

## 3. SEO metadata (row 14 — GAP flagged)

- Title: `{Marketplace name} — {country}`
- JSON-LD: `WebSite` (+ `SearchAction` for VIP) — builder status **GAP: `websiteWithSearchEntity` available** (wire it); SearchAction target URL template points at the hub-rendered search route only
- hreflang/canonical: as package 01 §3 (marketplace home is per-country domain, D-006)

## 4. Component mapping

PageShell ✓ · EntityHero ✓ · FeatureGrid ✓ · VendorCardGrid ✗ build · SearchBox ✗ build (VIP) · no backlog overlap with tenant pages except PageShell.

## 5. Audience journeys

- **Buyer**: discover categories → vendor profile → handoff to marketplace for transaction
- **Vendor**: value proposition → signup CTA → package 15 dashboard

## 6. a11y acceptance

DS-A11Y-01, 03, 07, 09, 10 (search input labeling), 12

## 7. Analytics

`page_view` (essential) · `category_open` · `search_submit` (query text NEVER logged — aggregate counts only) · `vendor_signup_start` (consent-gated)
