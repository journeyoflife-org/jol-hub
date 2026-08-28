/**
 * Slug utilities — STEP 6.
 *
 * Slugs are the public URL identifiers for collection items (news/events/
 * services). Contract: kebab-case, URL-safe, Lithuanian diacritics
 * transliterated (ą→a, č→c, ę→e, ė→e, į→i, š→s, ų→u, ū→u, ž→z) so URLs are
 * ASCII-stable and never leak raw special-category characters into logs.
 *
 * SECURITY: slugs are validated against SLUG_PATTERN before any lookup —
 * malformed input is rejected pre-resolution (no injection surface).
 */

/** Allowlist for slugs — lowercase alphanumerics separated by single dashes. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lithuanian diacritic → ASCII transliteration table. */
const LT_TRANSLITERATION: Record<string, string> = {
  ą: 'a',
  č: 'c',
  ę: 'e',
  ė: 'e',
  į: 'i',
  š: 's',
  ų: 'u',
  ū: 'u',
  ž: 'z',
  // Uppercase variants (folded to lowercase afterward regardless).
  Ą: 'a',
  Č: 'c',
  Ę: 'e',
  Ė: 'e',
  Į: 'i',
  Š: 's',
  Ų: 'u',
  Ū: 'u',
  Ž: 'z',
};

/**
 * Convert arbitrary text into a URL-safe kebab-case slug.
 * Deterministic and idempotent for already-slugged input.
 */
export function slugify(input: string): string {
  const transliterated = Array.from(input)
    .map((ch) => LT_TRANSLITERATION[ch] ?? ch)
    .join('');

  return transliterated
    .toLowerCase()
    // Any remaining non-ASCII letters fold to nothing (keep [a-z0-9] only).
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** True when a candidate slug matches the public allowlist. */
export function isValidSlug(candidate: string): boolean {
  return SLUG_PATTERN.test(candidate);
}

/**
 * Normalize a route param slug: reject anything outside the allowlist.
 * Returns `null` for invalid input so callers `notFound()` uniformly —
 * never echoing the attempted value (GDPR Art. 9 / SOC 2 CC6.1).
 */
export function normalizeSlugParam(candidate: string | undefined): string | null {
  if (!candidate) return null;
  const slug = candidate.trim().toLowerCase();
  return isValidSlug(slug) ? slug : null;
}
