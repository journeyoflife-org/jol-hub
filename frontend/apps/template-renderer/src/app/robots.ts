/**
 * robots.txt — STEP 11.
 *
 * Emitted per-request from the `@jol-hub/seo` policy (single source of
 * truth). The sitemap URL and Host directive use the PUBLIC origin
 * (proxy-safe) so each tenant domain advertises its own sitemap.
 *
 * RULES:
 *   - public tenant content: ALLOWED (SEO is the mission);
 *   - privileged areas (/admin, /editor, /dashboard, /settings, /profile),
 *     internal routes (/api/, /dev/) and error targets: DISALLOWED;
 *   - query-string variants (`?*`) disallowed — UTMs must not fork the
 *     index (canonicals back this up);
 *   - crawl-delay 1 for agents that honour it (Google ignores it; the
 *     middleware rate limiter is the real protection).
 */
import type { MetadataRoute } from 'next';
import { robotsDirectives, ROBOTS_CRAWL_DELAY } from '@jol-hub/seo';
import { resolveSeoOrigin } from '@/lib/seo';

// Request-bound (public origin) → per-request rendering.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const origin = resolveSeoOrigin();
  const directives = robotsDirectives();

  return {
    rules: [
      {
        userAgent: directives.userAgent,
        allow: directives.allow,
        disallow: directives.disallow,
        crawlDelay: ROBOTS_CRAWL_DELAY,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin.replace(/^https?:\/\//, ''),
  };
}
