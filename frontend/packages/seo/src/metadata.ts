/**
 * Metadata policy — STEP 11.
 *
 * Framework-agnostic builders for titles, descriptions and robots policy.
 * The renderer composes these into Next.js `Metadata` (see `lib/seo.tsx`).
 *
 * RULES:
 *   - meta descriptions target 150–160 chars (soft-clamped, word-boundary);
 *   - public content is ALWAYS index,follow — noindex is reserved for
 *     privileged areas (admin/editor/api) and must never be applied to
 *     public pages by accident (policy is keyed by page KIND);
 *   - keywords are intentionally NOT emitted (deprecated signal; Google
 *     ignores them, competitors harvest them).
 */
import type { SeoPageKind } from './types';

/** Description length window (Google truncates around ~160 chars). */
export const DESCRIPTION_MIN = 150;
export const DESCRIPTION_MAX = 160;

/** Title template: "%s | {tenant name}". */
export function tenantTitleTemplate(tenantName: string): { default: string; template: string } {
  return { default: tenantName, template: `%s | ${tenantName}` };
}

/**
 * Clamp a description into the 150–160 char window on a word boundary.
 * Short inputs pass through untouched (uniqueness beats padding); long inputs
 * are cut at the last word boundary <= 160 and ellipsized.
 */
export function clampDescription(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= DESCRIPTION_MAX) return cleaned;

  const cut = cleaned.slice(0, DESCRIPTION_MAX);
  const boundary = cut.lastIndexOf(' ');
  const trimmed = boundary > DESCRIPTION_MIN ? cut.slice(0, boundary) : cut;
  return `${trimmed.replace(/[,;:]$/, '')}…`;
}

/**
 * Auto-generate a meta description from content when none is provided
 * (programmatic SEO). Returns undefined for empty content — callers must
 * then fall back to the tenant tagline rather than emit empty descriptions.
 */
export function autoDescription(content: string | undefined): string | undefined {
  if (!content) return undefined;
  const clamped = clampDescription(content);
  return clamped.length > 0 ? clamped : undefined;
}

export interface RobotsPolicy {
  index: boolean;
  follow: boolean;
}

/**
 * Robots policy by page kind. PUBLIC kinds are index,follow; privileged
 * kinds are noindex,nofollow. This single table is the source of truth so a
 * public page can never be accidentally noindexed.
 */
export function robotsPolicyFor(kind: SeoPageKind): RobotsPolicy {
  switch (kind) {
    case 'admin':
    case 'editor':
    case 'api':
      return { index: false, follow: false };
    default:
      return { index: true, follow: true };
  }
}

/** Open Graph defaults for tenant pages (renderer adds image/url). */
export interface OpenGraphInput {
  title: string;
  description: string;
  /** hreflang locale code, e.g. lt-LT. */
  locale: string;
  siteName: string;
  type?: 'website' | 'article' | 'profile';
}

export function openGraphFor(input: OpenGraphInput): {
  title: string;
  description: string;
  locale: string;
  siteName: string;
  type: 'website' | 'article' | 'profile';
} {
  return {
    title: input.title,
    description: input.description,
    locale: input.locale,
    siteName: input.siteName,
    type: input.type ?? 'website',
  };
}
