/**
 * Edge middleware: locale resolution (STEP 4) composed with tenant
 * resolution (STEP 1).
 *
 * Pipeline per request:
 *   1. Locale: canonical /{locale}/... URLs pass through with `x-locale`
 *      set on the request; unprefixed URLs negotiate (subdomain → cookie
 *      → ?locale= → Accept-Language → lt) and 307-redirect to canonical.
 *      Unknown locale codes fall back to `lt` with a warning (never 404).
 *   2. Tenant: resolves from X-Tenant header or subdomain and rewrites to
 *      /{locale}/{tenant}/{path}, preserving the locale prefix.
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): unknown tenants are never named;
 * unresolved requests fall through to the route layer which returns a bare
 * 404 with no tenant enumeration.
 */
import { withTenantResolution } from '@jol-hub/tenant-resolver/middleware';
import { withLocaleResolution } from '@jol-hub/i18n/middleware';
import { isKnownTenant } from '@jol-hub/seed-data';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const localeMiddleware = withLocaleResolution({
  // Registry callback: 2–3 letter path segments that ARE tenants (none in
  // the current registry, but future-proof) must not be treated as locales.
  isKnownTenantSegment: (segment) => isKnownTenant(segment),
});

const tenantMiddleware = withTenantResolution();

export default function middleware(request: NextRequest): NextResponse {
  const localeResponse = localeMiddleware(request);
  // Redirects/negotiation results short-circuit the pipeline.
  if (localeResponse.status >= 300) {
    return localeResponse;
  }

  // Canonical path: both middlewares mutate request.headers (x-locale,
  // x-resolved-tenant) and return bare next()/redirect decisions. The
  // explicit next({ request }) form below is what guarantees the mutated
  // headers reach downstream headers() under Next 14 semantics.
  const tenantResponse = tenantMiddleware(request);
  if (tenantResponse.status >= 300) {
    // Rewrite (subdomain/header tenant addressing) — headers preserved.
    return tenantResponse;
  }
  return NextResponse.next({ request: { headers: request.headers } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
