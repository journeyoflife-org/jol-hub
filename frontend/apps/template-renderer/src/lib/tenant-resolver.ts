/**
 * App-level tenant resolution for server components.
 *
 * `@jol-hub/tenant-resolver` owns the resolution rules (X-Tenant header,
 * subdomain of the tenant base domain); this module only adapts them to the
 * `next/headers` API available inside React Server Components.
 *
 * SECURITY: resolution is a closed lookup — unknown slugs yield `null` and
 * the route layer renders a bare 404 (no tenant enumeration, GDPR Art. 9).
 */
import { headers } from 'next/headers';
import {
  resolveTenantFromHeaders,
  type ResolvedTenant,
} from '@jol-hub/tenant-resolver';

/** Resolve the tenant for the current request from request headers. */
export function resolveCurrentTenant(): ResolvedTenant | null {
  const headerStore = headers();
  return resolveTenantFromHeaders((name) => headerStore.get(name));
}
