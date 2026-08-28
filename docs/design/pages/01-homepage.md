# Page Package 01 — Homepage (tenant)

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) · Renderer: `page-config.ts` module vocabulary, `page-defaults.ts` `buildHomeConfig` (as-built default exists — this package refactors it, does not replace the config mechanism).

## 1. Wireframe (reading order, mobile-first)

1. Header/nav (PageShell banner landmark; skip-link first focusable)
2. `hero` (full-width): tenant name, one-sentence mission, primary CTA (mass times / contact), hero image with enforced scrim when text overlays (DS spec §3)
3. `feature-grid` (contained): 3–4 tiles — mass times, sacraments, news, donate
4. `news-list` (contained): latest 3 posts
5. `event-list` (contained): next 3 liturgical/parish events
6. `donation-cta` (contained) — **backlog component DonationBanner (DS §6)**
7. `contact-form` (two-column-60-40: form + address/map excerpt)
8. Footer (contentinfo landmark; tenant address, legal links, locale switcher)

## 2. Content model

| Field | Req | Locale behavior | Admin-editable (DS §3) |
|---|---|---|---|
| tenant.name | ✓ | per-locale display name | ✓ |
| hero.headline / hero.subline | ✓ / ○ | translated LT (req) · EN (req) · RU (opt, falls back EN) | ✓ |
| hero.image + alt | ✓ | one image all locales; alt translated | ✓ (palette-presets guardrails) |
| feature tiles (label+target) | ✓ | labels translated | visibility toggle only (renderer 10% rule) |
| news/events | auto | from content API, locale-filtered | via CMS posts/events |
| contact block | ✓ | translated | ✓ |

## 3. SEO metadata (traces: strategy doc row 1, builder status Implemented)

- Title: `{tenant name} — {primary keyword, one per route}` pattern (strategy §cluster-to-routes)
- Meta description: ≤155 chars, tenant mission + locale primary keyword
- JSON-LD: vertical subtype of `Organization` (`ReligiousOrganization`/`FuneralHome`/`LocalBusiness` per tenant vertical) + `WebSite` — builders **Implemented** in `packages/seo/src/structured-data.ts`; props: name, url, address, sameAs
- hreflang: per-locale alternates `{l}-{c}` → `https://{tenant}.D_c/{l}/` + `x-default` → `lt` URL (strategy §3; `buildSeoAlternates` in `packages/seo/src/hreflang.ts`, reciprocity unit-tested); absolute URLs only
- Canonical: self-referential per locale URL

## 4. Component mapping

PageShell/Header/Footer ✓ · EntityHero ✓ · FeatureGrid ✓ (module `feature-grid`) · NewsList ✓ · EventCalendar/EventCard ✓ · ContactBlock ✓ · **DonationBanner ✗ backlog (DS §6)**

## 5. Audience journeys

- **Parishioner**: land → find mass times within 10s (feature tile → event-list) → subscribe/contact
- **Parish admin**: verify published identity matches CMS edits (preview semantics, DS §3)

## 6. a11y acceptance (bindings)

DS-A11Y-01 (contrast, all theme profiles), 02 (hero alt), 03 (Tab order = reading order), 07 (tile targets ≥24px), 08 (hero motion reduced-motion variant), 09 (single main, h1→h2), 10 (contact form), 12 (axe 0 critical/serious)

## 7. Analytics (consent-first, ePrivacy; first-party only, no third-party trackers)

`page_view` (essential, no consent needed, no identifiers beyond session) · `hero_cta_click` · `feature_tile_open` · `event_card_open` · `contact_form_submit_success` — all non-essential events fire only after consent grant (cookie gate per MASTER-PROMPT §13); no cross-site identifiers.
