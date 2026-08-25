/**
 * Per-tenant sitemap (STEP 4 SEO i18n; STEP 11 architecture upgrade).
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): there is deliberately NO hub-level
 * sitemap index — a global index would enumerate every tenant in the
 * registry (the STEP-11 spec's "sitemap index lists tenant sitemaps" is
 * superseded by this posture). This file only emits URLs when a tenant is
 * resolved for the request (subdomain or X-Tenant header); it lists that ONE
 * tenant's pages across all supported locales with reciprocal hreflang
 * alternates. Unresolved requests get an empty sitemap.
 *
 * STEP 11 additions:
 *   - ABSOLUTE URLs (protocol + public domain);
 *   - changefreq/priority from `@jol-hub/seo` SITEMAP_POLICY
 *     (home=daily/1.0, news=daily/0.8, events=hourly/0.9, others monthly/0.5);
 *   - registry-only tenants (no fixture content) emit the base route set;
 *   - collection detail URLs (news/events/services) once the backend content
 *     plane is configured — in the pilot collections are empty, so the list
 *     routes cover the surface;
 *   - lastmod: content `updatedAt` where available, else the fixture request
 *     time;
 *   - sharding (`shardUrls`, 50k cap) is exercised by the package tests; a
 *     single tenant's pilot URL count is far below the limit — when a tenant
 *     grows past it, split this into `sitemap/[shard].ts` + index.
 */
import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { SUPPORTED_LOCALES } from '@jol-hub/i18n';
import { buildHreflangSet, SITEMAP_POLICY, type SeoPageKind } from '@jol-hub/seo';
import { findTenantBySlug } from '@jol-hub/tenant-resolver';
import { loadTenantFixture, SHARED_ROUTES } from '@/lib/content-loader';
import { isContentApiConfigured } from '@/lib/content-api';
import { getNews, getEvents, getServices } from '@/lib/collections';
import { resolveSeoOrigin } from '@/lib/seo';

/** Route → sitemap kind (drives changefreq/priority). */
function kindFor(route: string): SeoPageKind {
  if (route === '/') return 'home';
  if (route === '/about') return 'about';
  if (route === '/contact') return 'contact';
  if (route === '/news') return 'news-list';
  if (route === '/events') return 'events-list';
  if (route === '/services') return 'services-list';
  if (route.startsWith('/news/')) return 'news-article';
  if (route.startsWith('/events/')) return 'event-detail';
  if (route.startsWith('/services/')) return 'service-detail';
  return 'generic';
}

/** Base route set every tenant exposes (registry-only tenants included). */
const BASE_ROUTES: readonly string[] = [
  '/',
  '/about',
  '/contact',
  '/news',
  '/events',
  '/services',
  // STEP 12 (EAA): the accessibility statement is public + indexable.
  '/accessibility-statement',
];

/** Map a supported locale to its hreflang key (lt→lt-LT, en→en-LT, ru→ru-LT). */
function localeHreflangKey(locale: string): string {
  return `${locale}-LT`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenantSlug = headers().get('x-resolved-tenant');
  if (!tenantSlug) return [];
  const tenant = findTenantBySlug(tenantSlug);
  if (!tenant) return [];

  const fixture = loadTenantFixture(tenantSlug);
  const origin = resolveSeoOrigin();

  // Fixture tenants: fixture pages + shared compliance routes + collections.
  // Registry-only tenants: the base route set (vertical templates compose it).
  const routes: string[] = fixture
    ? [
        '/',
        ...fixture.pages.filter((page) => page.route !== '/').map((page) => page.route),
        ...SHARED_ROUTES,
        '/news',
        '/events',
        '/services',
        '/accessibility-statement',
      ]
    : [...BASE_ROUTES];

  // Deduplicate while preserving order.
  const unique = Array.from(new Set(routes));
  const fallbackLastmod = new Date();

  const toEntry = (
    route: string,
    lastModified: Date | string,
  ): MetadataRoute.Sitemap[number] => {
    const kind = kindFor(route);
    const path = route === '/' ? '' : route;
    const set = buildHreflangSet(origin, tenantSlug, route, 'lt');

    // Sitemap hreflang: every locale alternate (x-default excluded here —
    // it is a <link> concept, not a sitemap one).
    const languages: Record<string, string> = {};
    for (const locale of SUPPORTED_LOCALES) {
      const key = localeHreflangKey(locale);
      const hreflang = set.languages[key];
      if (hreflang) languages[key] = hreflang;
    }

    return {
      url: `${origin}/lt/${tenantSlug}${path}`,
      lastModified: new Date(lastModified),
      changeFrequency: SITEMAP_POLICY[kind].changefreq,
      priority: SITEMAP_POLICY[kind].priority,
      alternates: { languages },
    };
  };

  const entries = unique.map((route) => toEntry(route, fallbackLastmod));

  // Collection detail URLs (spec: all news articles, events, services).
  // Pilot: the content API is not configured → collections are empty and the
  // list routes above carry the surface. The wiring lands with the backend.
  if (isContentApiConfigured()) {
    const [news, events, services] = await Promise.all([
      getNews(tenant),
      getEvents(tenant),
      getServices(tenant),
    ]);
    for (const item of news) {
      entries.push(toEntry(`/news/${item.slug}`, item.updatedAt ?? item.publishedAt));
    }
    for (const item of events) {
      entries.push(toEntry(`/events/${item.slug}`, fallbackLastmod));
    }
    for (const item of services) {
      entries.push(toEntry(`/services/${item.slug}`, fallbackLastmod));
    }
  }

  return entries;
}
