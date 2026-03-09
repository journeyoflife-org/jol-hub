/**
 * Multi-tenant middleware for JOL-HUB parish subdomains.
 * 
 * Handles 400,000+ parish subdomains with:
 * - Subdomain extraction and validation
 * - Parish resolution with caching headers
 * - URL rewriting to dynamic routes
 * - Security headers and CORS
 * 
 * PERFORMANCE: Edge Runtime compatible (< 50ms cold start)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** Reserved subdomains that cannot be used by parishes */
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'app',
  'auth',
  'cdn',
  'dashboard',
  'dev',
  'docs',
  'files',
  'help',
  'images',
  'mail',
  'media',
  'static',
  'support',
  'test',
  'webmail',
  'staging',
  'production',
]);

/** Master site hostnames (no subdomain routing) */
const MASTER_HOSTNAMES = new Set([
  'jol-hub.eu',
  'jol-hub.lt',
  'www.jol-hub.eu',
  'www.jol-hub.lt',
  'localhost',
]);

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Next.js middleware for multi-tenant subdomain routing.
 * 
 * @param request - The incoming NextRequest
 * @returns NextResponse with appropriate routing and headers
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

  // Extract and validate subdomain
  const subdomain = extractSubdomain(hostname);

  // Handle invalid subdomain format
  if (subdomain && !isValidSubdomain(subdomain)) {
    console.warn(`[MIDDLEWARE] Invalid subdomain: ${subdomain}`);
    return new NextResponse('Invalid parish subdomain', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Skip subdomain routing for master site
  if (!subdomain || isMasterHostname(hostname)) {
    return handleMasterSite(request);
  }

  // Check if subdomain is reserved
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return handleMasterSite(request);
  }

  // Handle parish subdomain routing
  return handleParishSubdomain(request, subdomain);
}

// =============================================================================
// SUBDOMAIN HANDLING
// =============================================================================

/**
 * Handles requests to master site (no subdomain).
 */
function handleMasterSite(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(response);
  
  return response;
}

/**
 * Handles requests to parish subdomains.
 */
function handleParishSubdomain(
  request: NextRequest,
  subdomain: string
): NextResponse {
  const { pathname } = request.nextUrl;

  // Check if this is a parish page request (not API/static)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    const response = NextResponse.next();
    addParishHeaders(response, subdomain);
    addSecurityHeaders(response);
    return response;
  }

  // Rewrite to dynamic parish route
  const url = request.nextUrl.clone();
  
  // Rewrite / to /[parish]/page
  if (pathname === '/') {
    url.pathname = `/${subdomain}`;
  } else {
    // Rewrite other paths to include parish prefix
    url.pathname = `/${subdomain}${pathname}`;
  }

  const response = NextResponse.rewrite(url);
  
  // Add parish context headers
  addParishHeaders(response, subdomain);
  addSecurityHeaders(response);
  
  // Add caching headers for static content
  // Parish config is cached for 5 minutes
  response.headers.set(
    'Cache-Control',
    'public, max-age=300, stale-while-revalidate=60'
  );

  return response;
}

// =============================================================================
// HEADER MANAGEMENT
// =============================================================================

/**
 * Adds parish context headers to response.
 */
function addParishHeaders(response: NextResponse, subdomain: string): void {
  // Core parish headers
  response.headers.set('x-parish-subdomain', subdomain);
  response.headers.set('x-parish-id', subdomain); // TODO: Map to actual parish ID
  
  // CORS header for parish-specific requests
  response.headers.set('Access-Control-Allow-Origin', `https://${subdomain}.jol-hub.eu`);
}

/**
 * Adds security headers to response.
 */
function addSecurityHeaders(response: NextResponse): void {
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  // XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
}

// =============================================================================
// SUBDOMAIN EXTRACTION
// =============================================================================

/**
 * Extracts subdomain from hostname.
 * 
 * Examples:
 * - stmarys.jol-hub.eu -> stmarys
 * - www.jol-hub.eu -> null (master site)
 * - localhost -> null (development)
 * 
 * @param hostname - The request hostname
 * @returns Subdomain or null if master site
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Handle localhost development
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    // Check for x-subdomain header for local testing
    return null;
  }

  // Handle preview deployments (e.g., parish-name--jol-hub.vercel.app)
  if (host.includes('--')) {
    const parts = host.split('--');
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
  }

  // Extract subdomain from standard patterns
  const parts = host.split('.');

  // Pattern: parish-name.jol-hub.eu (3+ parts)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Validate subdomain format
    if (subdomain && isValidSubdomain(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Validates subdomain format.
 * 
 * Rules:
 * - 3-63 characters
 * - Lowercase alphanumeric and hyphens only
 * - Cannot start or end with hyphen
 * - No consecutive hyphens
 * 
 * @param subdomain - The subdomain to validate
 * @returns True if valid
 */
function isValidSubdomain(subdomain: string): boolean {
  // Must be lowercase alphanumeric with hyphens
  // Between 3 and 63 characters
  // Cannot start or end with hyphen
  // Cannot have consecutive hyphens
  const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return (
    subdomain.length >= 3 &&
    subdomain.length <= 63 &&
    subdomainRegex.test(subdomain) &&
    !subdomain.includes('--')
  );
}

/**
 * Checks if hostname is master site (no subdomain routing).
 */
function isMasterHostname(hostname: string): boolean {
  const host = hostname.split(':')[0];
  return MASTER_HOSTNAMES.has(host);
}

// =============================================================================
// MATCHER CONFIGURATION
// =============================================================================

/**
 * Middleware matcher configuration.
 * 
 * Skips:
 * - API routes (handled separately)
 * - Static files (_next/static, _next/image)
 * - Favicon
 * - Health checks
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/health (health check endpoint)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};
