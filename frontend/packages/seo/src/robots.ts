/**
 * robots.txt policy — STEP 11.
 *
 * Single source of truth for crawler directives. The renderer's
 * `app/robots.ts` emits this via Next's MetadataRoute.
 *
 * RULES:
 *   - public tenant content is ALLOWED (SEO is the mission);
 *   - privileged areas (/admin/, /editor/, /dashboard/, /settings/,
 *     /profile), internal routes (/api/, /dev/, error targets) are
 *     DISALLOWED;
 *   - query-string variants are disallowed (`?*`) so UTM-forked duplicates
 *     stay out of the index (canonicals back this up);
 *   - crawl-delay: 1 — politeness to modest hardware. Note: Google ignores
 *     crawl-delay; the middleware rate limiter is the real protection;
 *     Bing/Yandex honour it.
 */

/** Paths crawlers must never see (absolute-path prefixes). */
export const ROBOTS_DISALLOW: readonly string[] = [
  '/admin',
  '/editor',
  '/dashboard',
  '/settings',
  '/profile',
  '/api/',
  '/dev/',
  '/403-forbidden',
  '/404-tenant-not-found',
  '/*?*',
];

/** Explicit allows (defence against over-broad future disallows). */
export const ROBOTS_ALLOW: readonly string[] = ['/'];

/** Politeness delay for agents that honour it (seconds). */
export const ROBOTS_CRAWL_DELAY = 1;

export interface RobotsDirectives {
  userAgent: string;
  allow: string[];
  disallow: string[];
}

/** Build the robots rule set for all agents. */
export function robotsDirectives(): RobotsDirectives {
  return {
    userAgent: '*',
    allow: [...ROBOTS_ALLOW],
    disallow: [...ROBOTS_DISALLOW],
  };
}
