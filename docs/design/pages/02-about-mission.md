# Page Package 02 — About / Mission

Batch 1/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 2 · Renderer: modules `hero`, `content`, `gallery`, `testimonial`, `contact-form`.

## 1. Wireframe (reading order, mobile-first)

1. Header/nav (PageShell)
2. `hero` (contained): page title + one-line mission
3. `content` (contained): history/mission prose (2–4 sections, h2 per section)
4. `gallery` (contained, optional): 4–8 images, all alt-texted or decorative-flagged
5. `testimonial` (contained, optional): 1–2 quotes with attribution
6. `contact-form` (two-column-60-40) — "visit us / write us"
7. Footer

## 2. Content model

| Field | Req | Locale behavior | Admin-editable |
|---|---|---|---|
| page.title | ✓ | translated LT/EN (RU opt) | ✓ |
| mission.summary | ✓ | translated | ✓ |
| prose sections (heading+body) | ✓ | translated; RTL future-only (DS §5) | ✓ |
| gallery images + alt/decorative flags | ○ | images shared; alt translated | ✓ |
| testimonials (quote+attribution) | ○ | translated | ✓ |

## 3. SEO metadata (row 2, Implemented)

- Title: `{About|Mission} — {tenant name}`
- Meta description: mission summary excerpt ≤155 chars
- JSON-LD: `AboutPage` + `Organization` (props: url, name) — **Implemented** builders
- hreflang/canonical: as package 01 §3 (self-canonical, reciprocal alternates, x-default lt)

## 4. Component mapping

PageShell ✓ · EntityHero ✓ · Prose/ContentBlock ✓ · Gallery ✓ · Testimonial ✓ · ContactBlock ✓ — no backlog items.

## 5. Audience journeys

- **Parishioner (newcomer)**: who are you → what you believe → how to visit (contact)
- **Donor**: mission credibility before donation page (journey continues to page 16 via footer/CTA)

## 6. a11y acceptance

DS-A11Y-01, 02 (gallery alt policy), 03, 08 (gallery transitions reduced-motion), 09 (heading chain h1→h2), 10 (contact form), 12

## 7. Analytics

`page_view` (essential) · `gallery_image_open` (consent-gated) · `contact_form_submit_success` (consent-gated). No scroll-depth or third-party pixels.
