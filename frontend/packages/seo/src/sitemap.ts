/**
 * Sitemap utilities — STEP 11.
 *
 * Crawl-budget policy (changefreq/priority per route kind), the 50k-URL
 * sharding rule, and entry assembly. The renderer (`app/sitemap.ts`) owns
 * tenant resolution and the no-enumeration security posture.
 */
import type { SeoPageKind, SitemapEntryInput, SitemapPolicy } from './types';

/** Hard sitemap URL limit (protocol: 50,000 per file). */
export const SITEMAP_MAX_URLS = 50_000;

/**
 * changefreq/priority policy per page kind (spec):
 *   home=daily/1.0, news=daily/0.8, events=hourly/0.9, others=monthly/0.5.
 */
export const SITEMAP_POLICY: Record<SeoPageKind, SitemapPolicy> = {
  home: { changefreq: 'daily', priority: 1.0 },
  'news-list': { changefreq: 'daily', priority: 0.8 },
  'news-article': { changefreq: 'daily', priority: 0.8 },
  'events-list': { changefreq: 'hourly', priority: 0.9 },
  'event-detail': { changefreq: 'hourly', priority: 0.9 },
  'services-list': { changefreq: 'monthly', priority: 0.5 },
  'service-detail': { changefreq: 'monthly', priority: 0.5 },
  about: { changefreq: 'monthly', priority: 0.5 },
  contact: { changefreq: 'monthly', priority: 0.5 },
  generic: { changefreq: 'monthly', priority: 0.5 },
  // Privileged kinds must never appear in sitemaps; policy is a sentinel.
  admin: { changefreq: 'never', priority: 0 },
  editor: { changefreq: 'never', priority: 0 },
  api: { changefreq: 'never', priority: 0 },
};

/** True when a page kind may appear in a sitemap at all. */
export function isSitemapKind(kind: SeoPageKind): boolean {
  return SITEMAP_POLICY[kind].priority > 0;
}

/**
 * Shard a URL list into sitemap-sized chunks (crawl-budget management for
 * the 400k-site fleet: per-tenant sitemaps first, country/region sharding at
 * the index level when it grows).
 */
export function shardUrls(urls: string[], max = SITEMAP_MAX_URLS): string[][] {
  if (max < 1) throw new Error('Sitemap shard size must be >= 1');
  const shards: string[][] = [];
  for (let i = 0; i < urls.length; i += max) {
    shards.push(urls.slice(i, i + max));
  }
  return shards.length > 0 ? shards : [[]];
}

/** Normalize a lastmod value to an ISO date string (W3C datetime). */
export function lastmodIso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Assemble one sitemap entry (dedup handled by callers via URL keys). */
export function sitemapEntry(
  url: string,
  kind: SeoPageKind,
  lastModified?: Date | string,
  alternates?: Record<string, string>,
): SitemapEntryInput {
  return {
    url,
    policy: SITEMAP_POLICY[kind],
    lastModified: lastmodIso(lastModified),
    alternates,
  };
}
