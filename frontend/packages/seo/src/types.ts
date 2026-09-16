/**
 * SEO domain types — STEP 11.
 *
 * JOL is an SEO platform (~400k tenant sites, 27 EU countries). These types
 * are the shared vocabulary for canonicals, hreflang, metadata policy,
 * sitemaps and indexing signals. Pure and framework-agnostic.
 *
 * SECURITY: nothing here may leak tenant registries. Sitemaps/hreflang are
 * always scoped to ONE resolved tenant (see renderer `app/sitemap.ts`).
 */

/** Page kinds drive metadata/robots/sitemap policy. */
export type SeoPageKind =
  | 'home'
  | 'about'
  | 'contact'
  | 'news-list'
  | 'news-article'
  | 'events-list'
  | 'event-detail'
  | 'services-list'
  | 'service-detail'
  | 'generic'
  /** Privileged areas — NEVER indexed. */
  | 'admin'
  | 'editor'
  | 'api';

/** A locale with its hreflang code (pilot: lt-LT, en-LT, ru-LT). */
export interface HreflangLocale {
  locale: string;
  hreflang: string;
}

/** Sitemap entry policy (per URL). */
export interface SitemapPolicy {
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/** Absolute-URL sitemap entry (renderer maps to MetadataRoute.Sitemap). */
export interface SitemapEntryInput {
  url: string;
  lastModified?: Date | string;
  policy?: SitemapPolicy;
  /** hreflang alternates (absolute URLs). */
  alternates?: Record<string, string>;
}

/** IndexNow submission payload (instant indexing, Bing/Yandex/Seznam). */
export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

/** Generic JSON-LD value surface. */
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
