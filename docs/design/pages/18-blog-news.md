# Page Package 18 — Blog / News

Batch 3/3 (Phase 2.2) · Governing: design-system-spec v1 (c9165a3e) · SEO strategy (6da34b18) row 18 · Renderer modules: `hero`, `news-list`, `content`.

## 1. Wireframe (mobile-first, reading order)

1. Header/nav + breadcrumb · 2. `hero` (contained): section title + featured post
3. `news-list` (contained): paginated post cards (image, title, excerpt, date, author)
4. Post detail (separate route): `content` prose + `gallery` + author/date line + `BreadcrumbList` render
5. Footer

## 2. Content model

| Field | Req | Locale behavior | Admin-editable |
|---|---|---|---|
| post.headline | ✓ | translated per locale (or locale-scoped posts) | ✓ |
| post.body | ✓ | translated | ✓ |
| post.author | ✓ | display name only (GDPR: no personal contact) | via CMS |
| datePublished / dateModified | auto | ISO, locale-formatted display | ✗ (system) |
| featured image + alt | ○ | shared; alt translated | ✓ |

## 3. SEO metadata (row 18 — Implemented)

- Title: `{Post headline} — {tenant}` / index: `{News|Blog} — {tenant}`
- JSON-LD: `NewsArticle` + `BreadcrumbList` (+ list `ItemList` on index) — props headline, author, datePublished/dateModified — **Implemented** builders in packages/seo
- hreflang/canonical: as package 01 §3 (post URLs get reciprocal alternates only where the post exists in that locale)

## 4. Component mapping

PageShell ✓ · BreadcrumbBar ✓/partial · NewsList ✓ · ArticleView/ProseBlock ✓ · Gallery ✓ · PaginationBar ✓/partial — no backlog items.

## 5. Audience journeys

- **Parishioner**: stay informed → event awareness (post → linked event)
- **Parish admin**: publish workflow with preview semantics (DS §3)

## 6. a11y acceptance

DS-A11Y-01, 02 (images), 03, 07, 09 (article heading chain), 12

## 7. Analytics

`page_view` (essential) · `post_open` · `pagination_use` (consent-gated, aggregate)
