/// <reference types="next" />

/**
 * i18n Middleware for Next.js
 * Edge Runtime compatible
 * 
 * Detection order:
 * 1. URL path prefix (/lt/, /ru/, /en/)
 * 2. Cookie (jol-hub-locale, 1 year)
 * 3. Accept-Language browser header
 * 4. Default: Lithuanian (lt)
 * 
 * Behavior:
 * - / → redirect to /lt/ (default locale)
 * - /ru → redirect to /ru/
 * - /unknown-path → stays, i18n detected from cookie/browser
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// =============================================================================
// CONSTANTS
// =============================================================================

export const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'lt';
export const LOCALE_COOKIE = 'jol-hub-locale';

// Paths that should never be prefixed with locale
const EXCLUDED_PATHS = [
  '/_next/',
  '/api/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images/',
  '/fonts/',
  '/icons/',
  '/manifest.json',
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Extract locale from URL path (/lt/, /ru/, /en/)
 */
function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/(lt|ru|en)(?:\/|$)/);
  if (match && SUPPORTED_LOCALES.includes(match[1] as SupportedLocale)) {
    return match[1] as SupportedLocale;
  }
  return null;
}

/**
 * Extract locale from cookie
 */
function getLocaleFromCookie(request: NextRequest): SupportedLocale | null {
  const cookieValue = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieValue && SUPPORTED_LOCALES.includes(cookieValue as SupportedLocale)) {
    return cookieValue as SupportedLocale;
  }
  return null;
}

/**
 * Detect locale from Accept-Language browser header
 * Supports: lt, lt-LT, ru, ru-RU, en, en-US, en-GB, etc.
 */
function getLocaleFromBrowser(request: NextRequest): SupportedLocale | null {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return null;

  // Parse Accept-Language header and sort by quality (q) values
  const languages = acceptLanguage
    .split(',')
    .map((lang: string) => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: (code || '').trim().toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a: { quality: number }, b: { quality: number }) => b.quality - a.quality);

  for (const { code } of languages) {
    // Exact match (lt, ru, en)
    if (SUPPORTED_LOCALES.includes(code as SupportedLocale)) {
      return code as SupportedLocale;
    }
    // Language prefix match (lt-LT → lt, en-US → en, ru-RU → ru)
    const prefix = code.split('-')[0];
    if (prefix && SUPPORTED_LOCALES.includes(prefix as SupportedLocale)) {
      return prefix as SupportedLocale;
    }
  }

  return null;
}

/**
 * Detect the best locale for a request
 * Priority: URL path → cookie → browser → default
 */
export function detectLocale(request: NextRequest): SupportedLocale {
  const { pathname } = request.nextUrl;

  // 1. URL path prefix
  const pathLocale = getLocaleFromPath(pathname);
  if (pathLocale) return pathLocale;

  // 2. Cookie
  const cookieLocale = getLocaleFromCookie(request);
  if (cookieLocale) return cookieLocale;

  // 3. Accept-Language browser header
  const browserLocale = getLocaleFromBrowser(request);
  if (browserLocale) return browserLocale;

  // 4. Default
  return DEFAULT_LOCALE;
}

/**
 * Check if a path should be excluded from i18n routing
 */
function isExcludedPath(pathname: string): boolean {
  return EXCLUDED_PATHS.some((excluded) => pathname.startsWith(excluded));
}

// =============================================================================
// MIDDLEWARE FUNCTION
// =============================================================================

/**
 * i18n middleware: handles locale detection and routing
 * Call this from your Next.js middleware.ts
 * 
 * Usage:
 * ```ts
 * import { i18nMiddleware } from '@jol-hub/i18n/middleware';
 * export function middleware(request: NextRequest) {
 *   return i18nMiddleware(request);
 * }
 * ```
 */
export function i18nMiddleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // Skip excluded paths (static files, API routes, etc.)
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = getLocaleFromPath(pathname);

  // Path already has a valid locale prefix — pass through
  if (pathLocale) {
    const response = NextResponse.next();
    // Refresh cookie with detected locale if not already set
    const existingCookie = getLocaleFromCookie(request);
    if (!existingCookie || existingCookie !== pathLocale) {
      response.cookies.set(LOCALE_COOKIE, pathLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        ...(process.env.NODE_ENV === 'production' && {
          domain: '.jol-hub.eu',
          secure: true,
        }),
      });
    }
    return response;
  }

  // Path has no locale — detect and redirect
  const detectedLocale =
    getLocaleFromCookie(request) ||
    getLocaleFromBrowser(request) ||
    DEFAULT_LOCALE;

  // Build redirect URL
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
  if (search) redirectUrl.search = search;

  const response = NextResponse.redirect(redirectUrl, {
    // 307 Temporary Redirect — preserves method (GET stays GET)
    status: 307,
  });

  // Set locale cookie
  response.cookies.set(LOCALE_COOKIE, detectedLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
    ...(process.env.NODE_ENV === 'production' && {
      domain: '.jol-hub.eu',
      secure: true,
    }),
  });

  return response;
}

/**
 * Matcher config for Next.js middleware
 * Excludes static assets and API routes
 */
export const i18nMiddlewareMatcher = [
  '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)',
];

/* ========================================================================== */
/* STEP 4 — composable locale resolution                                      */
/*                                                                            */
/* Unlike i18nMiddleware above (which owns the whole response),              */
/* withLocaleResolution composes with tenant resolution:                      */
/*   - canonical locale-prefixed URLs (/{locale}/{tenant}/...)                */
/*   - sets the `x-locale` request header for downstream layouts              */
/*   - negotiates + 307-redirects unprefixed URLs                             */
/*   - Option A support: `{locale}.tenant.domain` subdomain prefix            */
/*   - negotiation fallback ru → en → lt — never a 404                        */
/* ========================================================================== */

/** Request header carrying the resolved locale downstream (canonical
 *  definition lives in ./config; re-exported for middleware consumers). */
import { LOCALE_HEADER } from './config';
export { LOCALE_HEADER };
/** URL param for explicit one-shot locale switching (?locale=ru). */
export const LOCALE_PARAM = 'locale';

export interface LocaleResolutionOptions {
  /** Paths exempt from locale routing entirely (default: static/api/dev). */
  isExcludedPath?: (pathname: string) => boolean;
  /**
   * Registry callback used to tell an unknown 2–3 letter path segment apart
   * from a tenant slug. When provided, such segments that are NOT known
   * tenants are treated as unknown locales and fall back to the default.
   */
  isKnownTenantSegment?: (segment: string) => boolean;
}

const LOCALE_EXCLUDED = /^\/(_next\/|favicon\.ico$|robots\.txt$|sitemap\.xml$|api\/|dev\/|images\/|fonts\/)/;

/** Option A — locale as the left-most subdomain label (en.tenant.domain). */
function getLocaleFromSubdomain(request: NextRequest): SupportedLocale | null {
  const first = request.nextUrl.hostname.split('.')[0]?.toLowerCase();
  return first && SUPPORTED_LOCALES.includes(first as SupportedLocale)
    ? (first as SupportedLocale)
    : null;
}

/**
 * Composable locale middleware. Returns a redirect (unprefixed/unknown
 * locale URLs) or passes through with `x-locale` set on request headers.
 *
 * Detection priority for unprefixed URLs (documented in README):
 *   1. subdomain prefix (explicit URL)  2. cookie (persisted choice)
 *   3. ?locale= param (explicit)        4. Accept-Language (implicit)
 *   5. DEFAULT_LOCALE (lt)
 */
export function withLocaleResolution(options: LocaleResolutionOptions = {}) {
  const isExcludedPath = options.isExcludedPath ?? ((pathname: string) => LOCALE_EXCLUDED.test(pathname));

  return function localeResolutionMiddleware(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    if (isExcludedPath(pathname)) {
      return NextResponse.next();
    }

    // Canonical already: /{locale}/... → pass through + expose downstream.
    // Mutating request.headers directly so this composes with further
    // middleware (e.g. tenant resolution) on the same request object.
    const pathLocale = getLocaleFromPath(pathname);
    if (pathLocale) {
      request.headers.set(LOCALE_HEADER, pathLocale);
      return NextResponse.next();
    }

    // Unknown locale code in path (e.g. /de/...) that is not a tenant →
    // fall back to default locale with a warning (never 404 on language).
    const firstSegment = pathname.split('/')[1] ?? '';
    const looksLikeLocale = /^[a-z]{2,3}$/.test(firstSegment);
    const knownTenant = options.isKnownTenantSegment?.(firstSegment) ?? false;
    if (looksLikeLocale && !SUPPORTED_LOCALES.includes(firstSegment as SupportedLocale) && !knownTenant) {
      console.warn(
        `[i18n] Unknown locale '${firstSegment}' in path — falling back to '${DEFAULT_LOCALE}'.`,
      );
      const fallbackUrl = request.nextUrl.clone();
      fallbackUrl.pathname = `/${DEFAULT_LOCALE}${pathname}`;
      return NextResponse.redirect(fallbackUrl, 307);
    }

    // Unprefixed URL → negotiate and redirect to the canonical locale URL.
    let locale: SupportedLocale | null =
      getLocaleFromSubdomain(request) ?? getLocaleFromCookie(request);
    let explicitParam = false;

    if (!locale) {
      const paramValue = request.nextUrl.searchParams.get(LOCALE_PARAM);
      if (paramValue) {
        explicitParam = true;
        if (SUPPORTED_LOCALES.includes(paramValue as SupportedLocale)) {
          locale = paramValue as SupportedLocale;
        } else {
          console.warn(
            `[i18n] Unknown locale '${paramValue}' via ?${LOCALE_PARAM}= — falling back to '${DEFAULT_LOCALE}'.`,
          );
          locale = DEFAULT_LOCALE;
        }
      }
    }

    if (!locale) {
      locale = getLocaleFromBrowser(request) ?? DEFAULT_LOCALE;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    // Locale lives in the path — keep the canonical URL param-free.
    redirectUrl.searchParams.delete(LOCALE_PARAM);

    const response = NextResponse.redirect(redirectUrl, 307);
    response.headers.set(LOCALE_HEADER, locale);

    // Persist only EXPLICIT choices (param). Accept-Language negotiation
    // must not pin a first-time visitor into a cookie.
    if (explicitParam) {
      response.cookies.set(LOCALE_COOKIE, locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }

    return response;
  };
}
