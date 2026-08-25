/**
 * Canonical URL logic — STEP 11.
 *
 * RULES enforced here:
 *   - canonicals are ABSOLUTE (protocol + domain), never relative;
 *   - query parameters are stripped (UTM tracking etc. must not fork the
 *     index into duplicate content);
 *   - trailing slashes are NORMALIZED to no-trailing-slash (Next's default),
 *     except the bare origin path;
 *   - fragments are stripped.
 */

/** Normalize a tenant-relative route: strip query/fragment, one leading slash, no trailing slash. */
export function normalizeRoute(route: string): string {
  let path = route.split('?')[0]?.split('#')[0] ?? '';
  if (!path.startsWith('/')) path = `/${path}`;
  // Collapse duplicate slashes, drop the trailing slash (keep root as '/').
  path = path.replace(/\/{2,}/g, '/');
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  return path;
}

/** Validate an origin like `https://example.com` (no trailing slash, no path). */
export function sanitizeOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^/]+$/i.test(trimmed)) {
    throw new Error(`Invalid SEO origin: ${origin}`);
  }
  return trimmed.toLowerCase();
}

/** Build an ABSOLUTE canonical URL from an origin + tenant-relative route. */
export function absoluteCanonical(origin: string, route: string): string {
  const base = sanitizeOrigin(origin);
  const path = normalizeRoute(route);
  return path === '/' ? `${base}/` : `${base}${path}`;
}

/**
 * True when two URLs are canonically equivalent (case-insensitive host,
 * ignoring query/fragment and trailing slash). Used by duplicate-content
 * audits and tests.
 */
export function sameCanonical(a: string, b: string): boolean {
  const norm = (value: string): string => {
    try {
      const url = new URL(value);
      let path = url.pathname.replace(/\/{2,}/g, '/');
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      return `${url.protocol}//${url.hostname.toLowerCase()}${path}`;
    } catch {
      return value;
    }
  };
  return norm(a) === norm(b);
}
