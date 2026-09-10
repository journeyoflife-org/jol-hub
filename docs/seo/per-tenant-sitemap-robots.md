# Per-Tenant Sitemap + Robots Specification

> **Date:** 2026-09-11
> **Governing:** SEO strategy §2.3 (non-enumeration), §3 (hreflang)
> **Target:** 400k-site scalability

## robots.txt (per spoke)

Each spoke serves an identical-structure `robots.txt` at `https://{tenant}.gyvenimo-kelias.lt/robots.txt`:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /secrets/

Sitemap: https://{tenant}.gyvenimo-kelias.lt/sitemap.xml
```

## sitemap.xml (per tenant)

Each tenant gets a per-locale sitemap. Structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <!-- One <url> per page per tenant -->
  <url>
    <loc>https://{tenant}.gyvenimo-kelias.lt/lt/</loc>
    <xhtml:link rel="alternate" hreflang="lt-LT"
      href="https://{tenant}.gyvenimo-kelias.lt/lt/" />
    <xhtml:link rel="alternate" hreflang="en-LT"
      href="https://{tenant}.gyvenimo-kelias.lt/en/" />
    <xhtml:link rel="alternate" hreflang="ru-LT"
      href="https://{tenant}.gyvenimo-kelias.lt/ru/" />
    <xhtml:link rel="alternate" hreflang="x-default"
      href="https://{tenant}.gyvenimo-kelias.lt/lt/" />
    <lastmod>{ISO-8601 timestamp}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Additional pages from tenant.pages[].route -->
  <url>
    <loc>https://{tenant}.gyvenimo-kelias.lt/lt/{route}</loc>
    <!-- same hreflang set -->
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

## Sitemap index (hub only, curated)

`jol-hub.com/sitemap.xml` is a sitemap index pointing to per-country directory
pages only — NEVER listing tenant slugs (non-enumeration rule §2.3):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://jol-hub.com/sitemaps/lt-directory.xml</loc>
    <lastmod>{timestamp}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://jol-hub.com/sitemaps/lv-directory.xml</loc>
    <lastmod>{timestamp}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://jol-hub.com/sitemaps/ee-directory.xml</loc>
    <lastmod>{timestamp}</lastmod>
  </sitemap>
</sitemapindex>
```

## IndexNow

Per-tenant IndexNow submission via `buildIndexNowPayload()` (exists in
`packages/seo`). One API key per tenant domain, stored in spoke secrets.

## Sharding for 400k sites

At scale: each tenant sitemap is independent (one file per tenant). The sitemap index
on the hub only lists country-level directory pages, not individual tenants.
Tenant sitemaps are discoverable via the tenant's own `robots.txt`.

## noindex policy

All spokes serve `X-Robots-Tag: noindex` until:
1. Vilnius mandate resolved (owner action)
2. Owner explicitly removes noindex per spoke
3. Removal is a per-spoke config change, not a code change
