/**
 * Next.js middleware helper for tenant resolution.
 *
 * Usage in `apps/template-renderer/src/middleware.ts`:
 *
 * ```ts
 * import { withTenantResolution } from '@jol-hub/tenant-resolver/middleware';
 * export default withTenantResolution();
 * export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
 * ```
 *
 * Behavior: when a tenant resolves (X-Tenant header or subdomain) and the
 * path is not already prefixed with that tenant, the request is rewritten to
 * `/<tenant>/<path>`. Unresolvable requests pass through untouched; the
 * route layer renders a bare 404 (no tenant enumeration).
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveTenantRequest } from './index';
import type { ResolvedTenant } from './index';

export interface TenantMiddlewareOptions {
  /**
   * Paths that must never be rewritten (Next.js internals, static assets,
   * APIs). Defaults cover `_next/*`, `favicon.ico` and `api/*`.
   */
  isExcludedPath?: (pathname: string) => boolean;
}

const DEFAULT_EXCLUDED = /^\/(_next\/|favicon\.ico$|api\/)/;

/** Locale codes that may prefix the tenant segment (STEP 4 i18n routing). */
const LOCALE_PREFIX = /^\/(lt|ru|en)(?=\/|$)/;

/**
 * Inject the STEP-5 tenant context headers for downstream server code.
 * Request headers NEVER reach the browser — `x-tenant-schema` stays
 * server-only (ADR-001: schema names are secrets).
 */
function injectTenantHeaders(headers: Headers, tenant: ResolvedTenant): void {
  headers.set('x-tenant-id', tenant.tenantId);
  headers.set('x-tenant-schema', tenant.tenant.schema);
  headers.set('x-tenant-vertical', tenant.vertical);
  headers.set('x-tenant-locale', tenant.locale);
  headers.set('x-resolved-tenant', tenant.tenantId);
}

export function withTenantResolution(options: TenantMiddlewareOptions = {}) {
  const isExcludedPath = options.isExcludedPath ?? ((pathname: string) => DEFAULT_EXCLUDED.test(pathname));

  return function tenantResolutionMiddleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    if (isExcludedPath(pathname)) {
      return NextResponse.next();
    }

    const tenant = resolveTenantRequest(request);
    if (!tenant) {
      // No tenant resolved: pass through. The route layer returns a 404.
      return NextResponse.next();
    }

    // Preserve any locale prefix (STEP 4): /lt/... stays /lt/... .
    const localeMatch = pathname.match(LOCALE_PREFIX);
    const localePrefix = localeMatch ? localeMatch[0] : '';
    const tenantPath = localePrefix ? pathname.slice(localePrefix.length) || '/' : pathname;

    // Already addressed by tenant path segment — nothing to rewrite.
    if (tenantPath === `/${tenant.tenantId}` || tenantPath.startsWith(`/${tenant.tenantId}/`)) {
      // Expose downstream (server components, sitemap) via request headers.
      injectTenantHeaders(request.headers, tenant);
      return NextResponse.next();
    }

    const target = new URL(request.url);
    target.pathname = `${localePrefix}/${tenant.tenantId}${tenantPath === '/' ? '' : tenantPath}`;
    // Request headers for downstream server components; response header for
    // observability. Only the tenant serving THIS request is named — never
    // the schema (server-only secret).
    injectTenantHeaders(request.headers, tenant);
    // Pass the MUTATED headers through the rewrite so downstream server
    // components (headers()) observe x-tenant-* — a bare rewrite() would
    // drop them under Next 14 semantics.
    const response = NextResponse.rewrite(target, { request: { headers: request.headers } });
    response.headers.set('x-resolved-tenant', tenant.tenantId);
    return response;
  };
}
