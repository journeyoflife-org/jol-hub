/// <reference types="next" />

/**
 * Language Middleware for Next.js
 * Edge Runtime compatible
 * 
 * Detection Priority:
 * 1. URL path (/lt/, /ru/, /en/)
 * 2. Cookie (i18next-language)
 * 3. Browser Accept-Language header
 * 4. Default: Lithuanian (lt)
 * 
 * Behavior:
 * - / → 301 redirect to /lt/ (default locale)
 * - /ru → 301 redirect to /ru/
 * - /unknown → stays, i18n detected from cookie/browser
 * 
 * RTL Support: Ready for future Arabic expansion
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// =============================================================================
// CONSTANTS
// =============================================================================

export const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'lt';
export const LOCALE_COOKIE = 'i18next-language';

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
  '/sw.js',
  '/workbox-',
];

// RTL locales (future expansion: Arabic, Hebrew)
const RTL_LOCALES: string[] = [];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract locale from URL path (/lt/, /ru/, /en/)
 */
export function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/(lt|ru|en)(?:\/|$)/);
  if (match && SUPPORTED_LOCALES.includes(match[1] as SupportedLocale)) {
    return match[1] as SupportedLocale;
  }
  return null;
}

/**
 * Extract locale from cookie
 */
export function getLocaleFromCookie(request: NextRequest): SupportedLocale | null {
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
export function getLocaleFromBrowser(request: NextRequest): SupportedLocale | null {
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
  return EXCLUDED_PATHS.some((excluded) => 
    pathname.startsWith(excluded) || pathname === excluded.replace(/\/$/, '')
  );
}

/**
 * Check if a locale is RTL (Right-to-Left)
 * Currently returns false for all supported locales (future: Arabic, Hebrew)
 */
export function isRTLLocale(locale: SupportedLocale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Get HTML lang attribute value for a locale
 */
export function getHTMLLang(locale: SupportedLocale): string {
  const langMap: Record<SupportedLocale, string> = {
    lt: 'lt-LT',
    ru: 'ru-RU',
    en: 'en-US',
  };
  return langMap[locale];
}

/**
 * Get text direction for a locale
 */
export function getLocaleDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

// =============================================================================
// MIDDLEWARE FUNCTION
// =============================================================================

/**
 * Language middleware: handles locale detection and routing
 * 
 * Usage in your Next.js middleware.ts:
 * ```ts
 * import { languageMiddleware } from '@jol-hub/i18n/middleware/language';
 * 
 * export function middleware(request: NextRequest) {
 *   return languageMiddleware(request);
 * }
 * 
 * export const config = {
 *   matcher: languageMiddlewareMatcher,
 * };
 * ```
 */
export function languageMiddleware(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  // Skip excluded paths (static files, API routes, etc.)
  if (isExcludedPath(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = getLocaleFromPath(pathname);

  // Path already has a valid locale prefix — pass through with cookie sync
  if (pathLocale) {
    const response = NextResponse.next();
    
    // Set locale headers for downstream use
    response.headers.set('x-locale', pathLocale);
    response.headers.set('x-locale-direction', getLocaleDirection(pathLocale));
    
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

  // 301 Permanent Redirect — good for SEO
  const response = NextResponse.redirect(redirectUrl, { status: 301 });

  // Set locale cookie on redirect
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
export const languageMiddlewareMatcher = [
  '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)',
];

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Create a localized path
 * Example: localizePath('/about', 'ru') → '/ru/about'
 */
export function localizePath(path: string, locale: SupportedLocale): string {
  // Remove existing locale prefix if present
  const cleanPath = path.replace(/^\/(lt|ru|en)\//, '/');
  
  // Don't add locale for default if it's the root
  if (locale === DEFAULT_LOCALE && cleanPath === '/') {
    return cleanPath;
  }
  
  return `/${locale}${cleanPath}`;
}

/**
 * Get all supported locales except the current one
 */
export function getAlternativeLocales(currentLocale: SupportedLocale): SupportedLocale[] {
  return SUPPORTED_LOCALES.filter((locale) => locale !== currentLocale);
}
