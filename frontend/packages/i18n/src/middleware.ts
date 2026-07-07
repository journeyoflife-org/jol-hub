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
