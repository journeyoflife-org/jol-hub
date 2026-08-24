/**
 * App-level tenant resolution for server components.
 *
 * `@jol-hub/tenant-resolver` owns the resolution rules (X-Tenant header,
 * subdomain of the tenant base domain); this module only adapts them to the
 * `next/headers` API available inside React Server Components.
 *
 * SECURITY: resolution is a closed lookup — unknown slugs yield `null` and
 * the route layer renders a bare 404 (no tenant enumeration, GDPR Art. 9).
 * `getTenantContext` returns the FULL record incl. `schema` — server-only;
 * client components must receive `toPublicTenant(...)` instead (ADR-001).
 */
import { headers } from 'next/headers';
import {
  resolveTenantFromHeaders,
  type ResolvedTenant,
  type Tenant,
} from '@jol-hub/tenant-resolver';

/** Resolve the tenant for the current request from request headers. */
export function resolveCurrentTenant(): ResolvedTenant | null {
  const headerStore = headers();
  return resolveTenantFromHeaders((name) => headerStore.get(name));
}

/**
 * Server accessor for the STEP-5 tenant context (middleware-injected
 * X-Tenant-* headers). Returns the full tenant incl. `schema` for RLS
 * propagation to backend calls — NEVER pass the result to client code
 * unstripped.
 */
export function getTenantContext(): Tenant | null {
  return resolveCurrentTenant()?.tenant ?? null;
}
