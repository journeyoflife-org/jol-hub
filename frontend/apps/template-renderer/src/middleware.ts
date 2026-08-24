/**
 * Edge middleware — STEP 5 "the spine" pipeline:
 *
 *   rate limit → www normalization → HTTPS enforcement → tenant gate
 *   → locale resolution (STEP 4) → tenant rewrite/header injection
 *   → security headers on EVERY response.
 *
 * Tenant chain: domain/subdomain → tenant → schema → (template/locale/
 * content happen in the route layer).
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1 / CC6.3, ADR-001):
 * - Unknown tenants → rewrite to /404-tenant-not-found (URL preserved,
 *   identical generic body for "no tenant" and "unknown tenant" — no
 *   enumeration).
 * - X-Tenant-* headers are REQUEST headers: server-only, never emitted
 *   to the browser. The schema header is the RLS context for backend calls.
 */
import { withTenantResolution } from '@jol-hub/tenant-resolver/middleware';
import { resolveTenantRequest } from '@jol-hub/tenant-resolver';
import { withLocaleResolution } from '@jol-hub/i18n/middleware';
import { isKnownTenant } from '@jol-hub/seed-data';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { clientIp, isRateLimited } from '@/lib/rate-limit';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/** Paths exempt from locale/tenant routing (static/dev/internal-404). */
const EXCLUDED =
  /^\/(_next\/|favicon\.ico$|robots\.txt$|sitemap\.xml$|dev\/|404-tenant-not-found(?:\/|$))/;

const localeMiddleware = withLocaleResolution({
  // Registry callback: 2–3 letter path segments that ARE tenants must not
  // be treated as locales (none today; future-proof).
  isKnownTenantSegment: (segment) => isKnownTenant(segment),
});

const tenantMiddleware = withTenantResolution();

/** Security headers on ALL responses (redirects and rewrites included). */
function applySecurityHeaders<T extends NextResponse>(response: T): T {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (IS_PRODUCTION) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
  return response;
}

/**
 * Public host as seen by the client: X-Forwarded-Host (first hop of the
 * proxy chain) else the Host header. Behind Proxmox/nginx, `request.nextUrl`
 * reflects the Next.js bind host — it MUST NOT be used to build public
 * redirects (would leak the internal origin / drop the tenant domain).
 */
function publicHost(request: NextRequest): string {
  const raw =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  return raw.split(',')[0]?.split(':')[0]?.trim().toLowerCase() ?? '';
}

/**
 * Redirect URL preserving the public host, path and query. Protocol comes
 * from an explicit override (HTTPS enforcement) or the proxy's
 * x-forwarded-proto; falls back to the connection protocol.
 */
function publicRedirectUrl(
  request: NextRequest,
  host: string,
  protocol?: 'http:' | 'https:',
): URL {
  const url = request.nextUrl.clone();
  if (protocol) {
    url.protocol = protocol;
  } else {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto === 'https' || proto === 'http') {
      url.protocol = `${proto}:`;
    }
  }
  url.hostname = host;
  url.port = ''; // default port for the (public) protocol
  return url;
}

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1. Rate limiting — per client IP, per tenant (before any work).
  const rateLimitTenant = resolveTenantRequest(request);
  const rateLimitKey = `${clientIp(request)}|${rateLimitTenant?.tenantId ?? '-'}`;
  if (isRateLimited(rateLimitKey)) {
    return applySecurityHeaders(
      new NextResponse('Too Many Requests', { status: 429 }),
    );
  }

  // 2. www. prefix normalization (308 — permanent, method-preserving).
  //    Host-header driven (proxy-safe; see publicHost).
  const host = publicHost(request);
  if (host.startsWith('www.')) {
    return applySecurityHeaders(
      NextResponse.redirect(publicRedirectUrl(request, host.slice(4)), 308),
    );
  }

  // 3. HTTPS enforcement (production only; proxies set x-forwarded-proto).
  if (IS_PRODUCTION && request.headers.get('x-forwarded-proto') === 'http') {
    return applySecurityHeaders(
      NextResponse.redirect(publicRedirectUrl(request, host, 'https:'), 308),
    );
  }

  if (EXCLUDED.test(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Tenant gate — unknown/unresolvable tenants get the internal 404
  //    route via REWRITE (URL preserved; no registry leakage).
  const tenant = resolveTenantRequest(request); // LRU-cached
  if (!tenant) {
    const target = new URL('/404-tenant-not-found', request.url);
    return applySecurityHeaders(NextResponse.rewrite(target));
  }

  console.info(`[tenant] ${tenant.tenantId} (${tenant.vertical}) ${request.method} ${pathname}`);

  // 5. Locale negotiation (STEP 4) — may 307-redirect to canonical.
  const localeResponse = localeMiddleware(request);
  if (localeResponse.status >= 300) {
    return applySecurityHeaders(localeResponse);
  }

  // 6. Tenant rewrite + X-Tenant-* request header injection. A rewrite
  //    (status 200 with x-middleware-rewrite) MUST be returned verbatim —
  //    replacing it with next() would serve the pre-rewrite URL and drop
  //    the tenant addressing.
  const tenantResponse = tenantMiddleware(request);
  if (
    tenantResponse.status >= 300 ||
    tenantResponse.headers.has('x-middleware-rewrite')
  ) {
    return applySecurityHeaders(tenantResponse);
  }

  // Explicit next({ request }) guarantees the mutated headers (x-locale,
  // x-tenant-id/schema/vertical/locale) reach downstream headers().
  return applySecurityHeaders(
    NextResponse.next({ request: { headers: request.headers } }),
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
