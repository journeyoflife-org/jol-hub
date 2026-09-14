/**
 * Indexing strategy integration points — STEP 11 (documented contracts).
 *
 * INDEXNOW (instant indexing — Bing/Yandex/Seznam):
 *   The backend publishes changed tenant URLs after content mutations:
 *     POST https://api.indexnow.org/indexnow
 *     body: buildIndexNowPayload(...)
 *   The key is a per-platform secret (backend-owned; NEVER in the frontend
 *   bundle). The frontend's only job is emitting `urlList` candidates —
 *   done here as a pure builder.
 *
 * GOOGLE SEARCH CONSOLE (per-tenant automation — future):
 *   - jol-infrastructure provisions one SC property per tenant domain;
 *   - verification token is injected by the backend into the tenant's
 *     settings; the renderer would emit the meta verification tag;
 *   - NOT implemented in the pilot (no tenant domains yet).
 *
 * CRAWL BUDGET:
 *   - robots.ts crawl-delay (agents that honour it) + middleware rate
 *     limiting (everyone);
 *   - sitemap changefreq/priority freshness signals (see sitemap.ts);
 *   - LOG FILE ANALYSIS hook: middleware already logs
 *     `[tenant] <slug> <vertical> <method> <path>` per request — the
 *     analytics pipeline (jol-analytics-ai) filters crawler UAs there.
 *
 * GOOGLE BUSINESS PROFILE (future — local SEO):
 *   - integration point: backend `apps/gbp` syncs reviews/photos/posts via
 *     the GBP API per tenant location;
 *   - frontend surface: reviews widget + GBP sameAs links in the
 *     Organization JSON-LD `sameAs` array (tenant settings).
 */
import type { IndexNowPayload } from './types';

/** Max URLs per IndexNow submission (protocol limit). */
export const INDEXNOW_MAX_URLS = 10_000;

/** Build a validated IndexNow payload (backend fills the key). */
export function buildIndexNowPayload(options: {
  host: string;
  key: string;
  urls: string[];
}): IndexNowPayload {
  const urlList = options.urls.slice(0, INDEXNOW_MAX_URLS);
  return {
    host: options.host,
    key: options.key,
    keyLocation: `https://${options.host.replace(/^https?:\/\//, '')}/indexnow-key.txt`,
    urlList,
  };
}
