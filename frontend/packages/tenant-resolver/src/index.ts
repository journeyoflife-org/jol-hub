/**
 * Tenant resolution for the JOL template renderer — STEP 5 "the spine".
 *
 * Chain: domain/subdomain → tenant → schema → template variant → locale
 * → content. This module owns the first two links.
 *
 * Resolution order (STEP 5 contract):
 *   a. Exact hostname match (custom domains, VIP)
 *   b. Subdomain extraction: *.gyvenimo-kelias.lt → slug lookup
 *   c. X-Tenant header (API/admin/dev override)
 *   d. X-Forwarded-Host honored as the effective host (Proxmox/nginx chains)
 *
 * Performance: in-memory LRU cache (5 min TTL, key = host|x-tenant);
 * resolution is a closed lookup over static maps — well under the 5ms
 * budget, no DB connections.
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): closed lookups only. Unknown
 * slugs/domains return `null`; callers render a bare 404 and MUST NOT
 * echo the attempted value or enumerate valid tenants. `Tenant.schema`
 * is server-only and must never reach client payloads (ADR-001).
 */
import type { NextRequest } from 'next/server';

import { LruCache } from './lru';
import { findTenantByDomain, findTenantBySlug } from './registry';
import type { Tenant } from './types';
import { SLUG_PATTERN } from './types';

export type { Tenant, TenantSettings, Vertical, PackageTier } from './types';
export { SLUG_PATTERN, schemaForTenant, normalizeVertical, FEATURES_BY_TIER } from './types';
export { findTenantBySlug, findTenantByDomain } from './registry';

/**
 * Client-safe tenant view: `schema` stripped (ADR-001 — schema names are
 * server-only secrets and must never be serialized into client payloads).
 */
export type PublicTenant = Omit<Tenant, 'schema'>;

/** Strip server-only fields before a tenant crosses into client code. */
export function toPublicTenant(tenant: Tenant): PublicTenant {
  const { schema: _schema, ...publicTenant } = tenant;
  return publicTenant;
}

/** Header used for explicit tenant selection (dev / preview / routing). */
export const TENANT_HEADER = 'x-tenant';

/** Base domain whose subdomains map to tenant slugs. */
export const TENANT_BASE_DOMAIN = process.env.TENANT_BASE_DOMAIN ?? 'gyvenimo-kelias.lt';

/** Resolution cache — 5 min TTL per STEP 5. */
const resolutionCache = new LruCache<Tenant | null>(512, 5 * 60 * 1000);

/** Test/ops hook. */
export function clearTenantCache(): void {
  resolutionCache.clear();
}

/** Test/ops hook: number of cached resolutions (incl. negative entries). */
export function tenantResolutionCacheSize(): number {
  return resolutionCache.size;
}

/** Normalize a candidate slug: lowercase, trim, reject anything not URL-safe. */
function normalizeSlug(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const slug = candidate.trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug)) return null;
  return slug;
}

/** Strip port + lowercase; drop a leading `www.` label. */
function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(',')[0]?.split(':')[0]?.trim().toLowerCase();
  if (!hostname) return null;
  return hostname.replace(/^www\./, '');
}

/** Extract a tenant slug from a host value via subdomain parsing. */
export function slugFromHost(host: string | null | undefined): string | null {
  const hostname = normalizeHost(host);
  if (!hostname) return null;

  const base = TENANT_BASE_DOMAIN.toLowerCase();
  if (hostname === base) return null; // apex domain, no tenant subdomain

  const suffix = `.${base}`;
  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, -suffix.length);
  // Left-most non-www label (www.tenant.domain resolves as tenant).
  const label = subdomain.split('.').find((part) => part && part !== 'www');
  return normalizeSlug(label ?? null);
}

/** Read the tenant slug from the explicit X-Tenant header. */
export function slugFromHeader(getHeader: (name: string) => string | null): string | null {
  return normalizeSlug(getHeader(TENANT_HEADER));
}

export interface ResolveInput {
  host?: string | null;
  forwardedHost?: string | null;
  xTenant?: string | null;
}

/**
 * Core resolution logic (sync, pure, cacheable) over plain inputs so it is
 * reusable from middleware, server components and tests.
 */
export function resolveTenantCore(input: ResolveInput): Tenant | null {
  // X-Forwarded-Host wins: proxies (Proxmox/nginx) set it to the original.
  const effectiveHost = normalizeHost(input.forwardedHost) ?? normalizeHost(input.host);
  const xTenant = normalizeSlug(input.xTenant);
  const cacheKey = `${effectiveHost ?? '-'}|${xTenant ?? '-'}`;

  const cached = resolutionCache.get(cacheKey);
  if (cached !== undefined) return cached;

  let tenant: Tenant | null = null;

  // (a) Exact hostname match (custom domains).
  if (effectiveHost) {
    tenant = findTenantByDomain(effectiveHost);
  }

  // (b) Subdomain of the tenant base domain → slug lookup.
  if (!tenant && effectiveHost) {
    const slug = slugFromHost(effectiveHost);
    if (slug) tenant = findTenantBySlug(slug);
  }

  // (c) Explicit X-Tenant header (API/admin/dev override).
  if (!tenant && xTenant) {
    tenant = findTenantBySlug(xTenant);
  }

  resolutionCache.set(cacheKey, tenant);
  return tenant;
}

/**
 * STEP 5 public API: resolve a tenant from hostname + request headers.
 * Async signature anticipates the registry API fallback (backend lookup);
 * the static pilot registry resolves synchronously.
 */
export async function resolveTenant(hostname: string, headers: Headers): Promise<Tenant | null> {
  return resolveTenantCore({
    host: hostname,
    forwardedHost: headers.get('x-forwarded-host'),
    xTenant: headers.get(TENANT_HEADER),
  });
}

/* ------------------------------------------------------------------------ */
/* Backwards-compatible surfaces (STEP 1 consumers)                         */
/* ------------------------------------------------------------------------ */

/** Lightweight view kept for STEP-1 consumers; `tenantId` = slug. */
export interface ResolvedTenant {
  /** Tenant slug, e.g. `parish-st-john-vilnius`. */
  tenantId: string;
  /** Full STEP-5 tenant record (schema is server-only). */
  tenant: Tenant;
  /** Tenant vertical — canonical STEP-5 taxonomy. */
  vertical: Tenant['vertical'];
  /** Default locale for the tenant. */
  locale: string;
}

function toResolved(tenant: Tenant): ResolvedTenant {
  return { tenantId: tenant.slug, tenant, vertical: tenant.vertical, locale: tenant.locale };
}

/**
 * Resolution over a plain header getter — reusable from Next.js server
 * components (`next/headers`) where no `NextRequest` instance exists.
 */
export function resolveTenantFromHeaders(
  getHeader: (name: string) => string | null,
): ResolvedTenant | null {
  const tenant = resolveTenantCore({
    host: getHeader('host'),
    forwardedHost: getHeader('x-forwarded-host'),
    xTenant: getHeader(TENANT_HEADER),
  });
  return tenant ? toResolved(tenant) : null;
}

/** Resolve the tenant for an incoming Next.js request. */
export function resolveTenantRequest(request: NextRequest): ResolvedTenant | null {
  return resolveTenantFromHeaders((name) => request.headers.get(name));
}
