/**
 * Tenant resolution for the JOL template renderer.
 *
 * A tenant is resolved in priority order:
 *   1. `X-Tenant` request header (local dev / preview / platform routing).
 *   2. Subdomain of the tenant base domain (`*.gyvenimo-kelias.lt`).
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): resolution is a closed lookup.
 * Unknown slugs return `null` — callers render a bare 404 and MUST NOT
 * echo the attempted slug or enumerate valid tenants.
 */
import { isKnownTenant, getTenantFixture, TENANT_FIXTURE_SCHEMA } from '@jol-hub/seed-data';
import type { NextRequest } from 'next/server';

export interface ResolvedTenant {
  /** Tenant slug, e.g. `parish-st-john-vilnius`. */
  tenantId: string;
  /** Fixture payload schema version. */
  schema: typeof TENANT_FIXTURE_SCHEMA;
  /** Tenant vertical (drives layout selection). */
  vertical: string;
  /** Default locale for the tenant. */
  locale: string;
}

/** Header used for explicit tenant selection (dev / preview / routing). */
export const TENANT_HEADER = 'x-tenant';

/** Base domain whose subdomains map to tenant slugs. */
export const TENANT_BASE_DOMAIN = process.env.TENANT_BASE_DOMAIN ?? 'gyvenimo-kelias.lt';

/** Normalize a candidate slug: lowercase, trim, reject anything not URL-safe. */
function normalizeSlug(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const slug = candidate.trim().toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

/** Extract a tenant slug from a Host header value via subdomain parsing. */
export function slugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  // Drop any port.
  const hostname = host.split(':')[0]?.toLowerCase();
  if (!hostname) return null;

  const base = TENANT_BASE_DOMAIN.toLowerCase();
  if (hostname === base) return null; // apex domain, no tenant subdomain

  const suffix = `.${base}`;
  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, -suffix.length);
  // Take the left-most label; ignore `www`.
  const label = subdomain.split('.')[0];
  if (!label || label === 'www') return null;
  return normalizeSlug(label);
}

/** Read the tenant slug from the explicit X-Tenant header. */
export function slugFromHeader(request: NextRequest): string | null {
  return normalizeSlug(request.headers.get(TENANT_HEADER));
}


/**
 * Core resolution logic over a plain header getter, so it can be reused
 * from Next.js server components (`next/headers`) where no `NextRequest`
 * instance exists.
 */
export function resolveTenantFromHeaders(
  getHeader: (name: string) => string | null,
): ResolvedTenant | null {
  const slug = normalizeSlug(getHeader(TENANT_HEADER)) ?? slugFromHost(getHeader('host'));
  if (!slug) return null;

  // Closed lookup: never leak whether a slug *almost* matched.
  if (!isKnownTenant(slug)) return null;

  const fixture = getTenantFixture(slug);
  if (!fixture) return null;

  return {
    tenantId: fixture.slug,
    schema: TENANT_FIXTURE_SCHEMA,
    vertical: fixture.vertical,
    locale: fixture.locale,
  };
}

/**
 * Resolve the tenant for an incoming request.
 *
 * Returns `null` when no tenant can be resolved or when the resolved slug is
 * not present in the tenant registry. Callers must treat `null` as "not found".
 */
export function resolveTenant(request: NextRequest): ResolvedTenant | null {
  return resolveTenantFromHeaders((name) => request.headers.get(name));
}
