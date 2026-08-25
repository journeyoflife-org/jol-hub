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
 * - Unknown tenants → direct generic 404 from the gate (identical body to
 *   app/not-found.tsx — no enumeration, no rewrite round-trip).
 * - X-Tenant-* headers are REQUEST headers: server-only, never emitted
 *   to the browser. The schema header is the RLS context for backend calls.
 */
import { withTenantResolution } from '@jol-hub/tenant-resolver/middleware';
import { resolveTenantRequest } from '@jol-hub/tenant-resolver';
import { withLocaleResolution } from '@jol-hub/i18n/middleware';
import { getMessages, translate } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { isKnownTenant } from '@jol-hub/seed-data';
import { getToken } from 'next-auth/jwt';
import { isAuthConfigured } from '@jol-hub/auth/oidc';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { clientIp, isLoginRateLimited, isRateLimited } from '@/lib/rate-limit';
import { createLogger } from '@jol-hub/observability';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * STEP 16 — structured request logging (edge-safe: the observability core
 * has no node:* imports). One JSON-lines record per request with method,
 * path, status, duration and tenant; `requestId` correlates middleware,
 * API-route and client telemetry records (SOC 2 CC7.2 traceability).
 * LB health probes (/api/health) are exempt to avoid log flooding.
 */
const log = createLogger({
  service: 'template-renderer-edge',
  minLevel: 'info', // RULE: never debug in production paths
});

/**
 * Paths exempt from locale/tenant routing (static/dev/internal-404/API).
 * `/api/*` are same-origin internal endpoints (e.g. the STEP-9 CRM proxies):
 * tenant attribution travels in the validated request body/query, and rate
 * limiting (step 1) still applies to them.
 */
const EXCLUDED =
  /^\/(_next\/|api\/|favicon\.ico$|robots\.txt$|sitemap\.xml$|dev\/|404-tenant-not-found(?:\/|$))/;

const localeMiddleware = withLocaleResolution({
  // Registry callback: 2–3 letter path segments that ARE tenants must not
  // be treated as locales (none today; future-proof).
  isKnownTenantSegment: (segment) => isKnownTenant(segment),
});

const tenantMiddleware = withTenantResolution();

/**
 * STEP 10 — protected tenant areas: `/[locale]/[tenant]/(admin|editor|
 * settings|dashboard)…`. Middleware enforces AUTHENTICATION only; the full
 * RBAC role check happens in the route layouts (defense in depth), which
 * redirect insufficient roles to /403-forbidden.
 */
const PROTECTED_PATH = /^\/[a-z]{2,3}\/[a-z0-9-]+\/(admin|editor|settings|dashboard)(?:\/|$)/;

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

export default async function middleware(request: NextRequest): Promise<NextResponse> {
  // STEP 16: request-scoped tracing + structured access log.
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const { pathname } = request.nextUrl;

  const response = await handleRequest(request);
  response.headers.set('x-request-id', requestId);

  // LB probes are exempt from access logging (flooding guard).
  if (pathname !== '/api/health') {
    log.info('request handled', {
      event: 'request.handled',
      requestId,
      method: request.method,
      path: pathname,
      status: response.status,
      durationMs: Date.now() - started,
    });
  }
  return response;
}

/**
 * STEP 1 (hygiene-gate fix) — direct 404 for unknown/unresolvable tenants.
 *
 * The gate used to REWRITE to /404-tenant-not-found, but middleware
 * rewrites under x-forwarded-proto: https make the standalone server
 * re-proxy the request internally against an https:// origin while the
 * listener is plain HTTP (EPROTO → spurious 500 behind nginx). A direct
 * response avoids the rendering pipeline entirely — robust and leak-free:
 * the SAME generic copy as app/not-found.tsx, no echo of the attempted
 * slug, no tenant enumeration (GDPR Art. 9 / SOC 2 CC6.1).
 */
function tenantNotFound(): NextResponse {
  // Catalog strings are static — no user input reaches the markup.
  const messages = getMessages(DEFAULT_LOCALE);
  const title = translate(messages, 'errors.notFoundTitle');
  const body = translate(messages, 'errors.notFoundBody');
  const html = `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>404 — ${title}</title>
</head>
<body style="margin:0;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;color:#111">
<main style="max-width:28rem;text-align:center;padding:1.5rem">
<p style="font-size:3.75rem;font-weight:700;margin:0">404</p>
<h1 style="font-size:1.5rem;font-weight:700">${title}</h1>
<p style="color:#4b5563">${body}</p>
</main>
</body>
</html>`;
  const response = new NextResponse(html, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // 1. Rate limiting — per client IP, per tenant (before any work).
  const rateLimitTenant = resolveTenantRequest(request);
  const rateLimitKey = `${clientIp(request)}|${rateLimitTenant?.tenantId ?? '-'}`;
  if (isRateLimited(rateLimitKey)) {
    // SECURITY EVENT (RULES): rate-limit hits are always logged.
    log.warn('rate limit hit', {
      event: 'security.rate-limit',
      path: pathname,
      tenant: rateLimitTenant?.tenantId ?? '-',
    });
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
    // STEP 10: auth callbacks are exempt from tenant routing but NOT from
    // abuse protection — brute-force limit login attempts (5 per 15 min/IP,
    // OWASP ASVS V2.2). Generic 429 body: never reveal account existence.
    if (
      request.method === 'POST' &&
      pathname.startsWith('/api/auth/callback') &&
      isLoginRateLimited(`login|${clientIp(request)}`)
    ) {
      return applySecurityHeaders(
        new NextResponse('Too Many Requests', { status: 429 }),
      );
    }
    // STEP 11: SEO surfaces are exempt from tenant ROUTING but need tenant
    // identity — resolve and inject `x-resolved-tenant` so sitemap.xml can
    // scope to the requesting tenant. Absent/unresolvable → no header →
    // empty sitemap (no registry enumeration, per the security posture).
    if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
      const seoTenant = resolveTenantRequest(request); // LRU-cached
      if (seoTenant) {
        request.headers.set('x-resolved-tenant', seoTenant.tenantId);
        return applySecurityHeaders(
          NextResponse.next({ request: { headers: request.headers } }),
        );
      }
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Tenant gate — unknown/unresolvable tenants get a DIRECT generic 404
  //    (no rewrite: standalone re-proxies rewrites and breaks under
  //    x-forwarded-proto; see tenantNotFound()). Registry never leaks.
  const tenant = resolveTenantRequest(request); // LRU-cached
  if (!tenant) {
    log.info('unknown tenant request', {
      event: 'tenant.unknown',
      path: pathname,
    });
    return applySecurityHeaders(tenantNotFound());
  }

  log.info('tenant resolved', {
    event: 'tenant.resolved',
    tenant: tenant.tenantId,
    vertical: tenant.vertical,
    method: request.method,
    path: pathname,
  });

  // 4b. STEP 10 — protected-area authentication gate (jol-auth OIDC).
  //     OPEN MODE: when auth is unconfigured the gate is skipped and the
  //     pages themselves render the quiet "authentication not enabled"
  //     state (documented emergency rollback).
  if (isAuthConfigured() && PROTECTED_PATH.test(pathname)) {
    const token = await getToken({ req: request });
    if (!token || token.error) {
      // SECURITY EVENT (RULES): failed access to a protected area.
      log.warn('protected route access without valid session', {
        event: 'security.auth-denied',
        path: pathname,
        reason: token?.error ?? 'no-session',
      });
      const signInUrl = new URL('/api/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return applySecurityHeaders(NextResponse.redirect(signInUrl));
    }
    // Request-only header for downstream server components (never emitted
    // to the browser — same discipline as X-Tenant-*).
    request.headers.set('x-user-sub', String(token.sub ?? ''));
  }

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
