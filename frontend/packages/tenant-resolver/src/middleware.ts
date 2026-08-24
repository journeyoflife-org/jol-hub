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

import { resolveTenant } from './index';

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

export function withTenantResolution(options: TenantMiddlewareOptions = {}) {
  const isExcludedPath = options.isExcludedPath ?? ((pathname: string) => DEFAULT_EXCLUDED.test(pathname));

  return function tenantResolutionMiddleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    if (isExcludedPath(pathname)) {
      return NextResponse.next();
    }

    const tenant = resolveTenant(request);
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
      request.headers.set('x-resolved-tenant', tenant.tenantId);
      return NextResponse.next();
    }

    const target = new URL(request.url);
    target.pathname = `${localePrefix}/${tenant.tenantId}${tenantPath === '/' ? '' : tenantPath}`;
    // Request header for downstream server components; response header for
    // observability. Only the tenant serving THIS request is named.
    request.headers.set('x-resolved-tenant', tenant.tenantId);
    const response = NextResponse.rewrite(target);
    response.headers.set('x-resolved-tenant', tenant.tenantId);
    return response;
  };
}
