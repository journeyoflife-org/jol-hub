/**
 * Parish Template Middleware
 * Edge Runtime compatible
 * 
 * Handles:
 * 1. i18n language detection and routing (URL → cookie → browser → default lt)
 * 2. Multi-tenant subdomain extraction for parish isolation
 * 3. Security headers
 * 
 * Detection order for language:
 *   URL path (/lt/, /ru/, /en/) → cookie → Accept-Language → default (lt)
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// i18n CONSTANTS (inlined for Edge Runtime — no external imports)
// =============================================================================

const SUPPORTED_LOCALES = ['lt', 'ru', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = 'lt';
const LOCALE_COOKIE = 'jol-hub-locale';

const EXCLUDED_PATHS = [
  '/_next/',
  '/api/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images/',
  '/fonts/',
  '/icons/',
];

function getLocaleFromPath(pathname: string): SupportedLocale | null {
  const match = pathname.match(/^\/(lt|ru|en)(?:\/|$)/);
  if (match && SUPPORTED_LOCALES.includes(match[1] as SupportedLocale)) {
    return match[1] as SupportedLocale;
  }
  return null;
}

function getLocaleFromCookie(request: NextRequest): SupportedLocale | null {
  const val = request.cookies.get(LOCALE_COOKIE)?.value;
  if (val && SUPPORTED_LOCALES.includes(val as SupportedLocale)) {
    return val as SupportedLocale;
  }
  return null;
}

function getLocaleFromBrowser(request: NextRequest): SupportedLocale | null {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return null;

  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = '1'] = lang.trim().split(';q=');
      return { code: (code || '').trim().toLowerCase(), quality: parseFloat(q) };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    if (SUPPORTED_LOCALES.includes(code as SupportedLocale)) return code as SupportedLocale;
    const prefix = code.split('-')[0];
    if (prefix && SUPPORTED_LOCALES.includes(prefix as SupportedLocale)) return prefix as SupportedLocale;
  }
  return null;
}

// =============================================================================
// SUBDOMAIN EXTRACTION
// =============================================================================

function extractSubdomain(hostname: string): string | null {
  const host = hostname.split(':')[0];

  if (!host || host === 'localhost' || host.startsWith('127.0.0.1')) {
    return null;
  }

  if (host.includes('--')) {
    const parts = host.split('--');
    if (parts.length > 0 && parts[0]) return parts[0];
  }

  const parts = host.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain && /^[a-z0-9-]+$/.test(subdomain)) return subdomain;
  }

  return null;
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

  // Skip static assets and API routes
  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const subdomain = extractSubdomain(hostname);
  const pathLocale = getLocaleFromPath(pathname);

  // --- Path already has a locale prefix → pass through with cookie sync ---
  if (pathLocale) {
    const response = NextResponse.next();

    // Set/refresh locale cookie
    const existingCookie = getLocaleFromCookie(request);
    if (!existingCookie || existingCookie !== pathLocale) {
      response.cookies.set(LOCALE_COOKIE, pathLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
        ...(process.env.NODE_ENV === 'production' && {
          domain: '.jol-hub.eu',
          secure: true,
        }),
      });
    }

    // Multi-tenant headers
    if (subdomain) {
      response.headers.set('x-subdomain', subdomain);
      response.headers.set('x-parish-locale', pathLocale);
    }
    response.headers.set('x-locale', pathLocale);

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
  }

  // --- No locale in path → detect and redirect ---
  const detectedLocale =
    getLocaleFromCookie(request) ||
    getLocaleFromBrowser(request) ||
    DEFAULT_LOCALE;

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`;
  if (search) redirectUrl.search = search;

  const response = NextResponse.redirect(redirectUrl, { status: 307 });

  // Set locale cookie on redirect
  response.cookies.set(LOCALE_COOKIE, detectedLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    ...(process.env.NODE_ENV === 'production' && {
      domain: '.jol-hub.eu',
      secure: true,
    }),
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)',
  ],
};
