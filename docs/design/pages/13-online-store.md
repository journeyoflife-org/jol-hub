# Page Package 13 — Online Store

Batch 2/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 13 · Boundary docs: ADR-009 (Model A, CLOSED) + docs/payment-api-contract.md v1.1.0.

## ⚠ BOUNDARY — "connectable separately" (task-mandated)

The store is **connectable separately**: it must function as a catalog-only tenant surface AND as a transacting surface — the transacting part lives in the **marketplace tree** (`/opt/jol-m/repos/jol-m-marketplace`, Tier-1, own governance), never in hub. Model A consistency: **PSP integration exists ONLY in marketplace `payments_app`; zero PSP SDKs, keys, or card fields in the hub tree, ever** (ADR-009 §2). Boundary is CLOSED: test-mode only until SAQ A verification (§4) — the store displays catalog + test-mode checkout posture only, in the interim.

## 1. Wireframe (mobile-first)

1. Header/nav + breadcrumb · 2. `hero` (contained): store name + category nav
3. StorefrontGrid (contained): ProductCard grid (image, name, **VAT-inclusive price display**, availability)
4. Product detail route: gallery, description, price (VAT-incl, per EU law), add-to-cart → **checkout handoff to marketplace surface** (redirect, not embed)
5. Footer

## 2. Content model — hub vs marketplace split

| Concern | Lives in | Note |
|---|---|---|
| Catalog content (products, descriptions, images, VAT-incl prices) | **hub** (tenant CMS) | admin-editable per DS §3 |
| Cart/checkout, PSP, order lifecycle | **marketplace tree** | zero hub surface |
| Order events back to hub | contract v1.1.0 envelope | opaque `payment_intent_id`, 8-field whitelist, zero personal data crossing |
| VAT rates/display rules | hub config (`countries/{cc}/config`) | VAT-inclusive is the only display mode |

## 3. SEO metadata (row 13 — GAP flagged)

- Title: `{Product name} — {store} | {tenant}` / index: `{Online Store} — {tenant}`
- JSON-LD: `WebSite` + `Product` (+ `Offer`, **VAT-inclusive price**) — props name, image, offers.price + priceCurrency — builder status **GAP: `productEntity` builder available** (wire it); prices in JSON-LD match on-page VAT-inclusive values (never diverge)
- hreflang/canonical: as package 01 §3

## 4. Component mapping

PageShell ✓ · StorefrontGrid ✗ build · ProductCard ✗ build · PriceDisplay (VAT-incl) ✗ build (DS §6 backlog trio) · CheckoutHandoffLink ✗ build (redirect semantics, no embed). Theme-neutral commerce styling.

## 5. Audience journeys

- **Parishioner/buyer**: browse → product → handoff to marketplace checkout
- **Vendor**: catalog accuracy (vendor surface itself = package 15)

## 6. a11y acceptance

DS-A11Y-01, 02 (product images), 03, 07, 09, 12 — handoff link announces destination (screen-reader users must know they are leaving the tenant site)

## 7. Analytics

`page_view` (essential) · `product_open` · `checkout_handoff_click` (consent-gated) — **no cart-contents tracking in hub** (cart lives marketplace-side; hub sees only the handoff click)
