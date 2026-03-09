import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface ParishConfig {
  subdomain: string;
  parishId: string;
  name: string;
}

/**
 * Middleware for multi-tenant parish subdomain handling.
 * Extracts subdomain and fetches parish configuration.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const hostname = request.headers.get('host') ?? '';
  const subdomain = extractSubdomain(hostname);

  // Create response
  const response = NextResponse.next();

  // Add subdomain to headers for downstream use
  if (subdomain) {
    response.headers.set('x-subdomain', subdomain);

    // In production, fetch parish config from cache/database
    // const parishConfig = await getParishConfig(subdomain);
    // response.headers.set('x-parish-id', parishConfig.parishId);
    // response.headers.set('x-parish-name', encodeURIComponent(parishConfig.name));
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  return response;
}

/**
 * Extracts the subdomain from a hostname.
 * Handles various formats:
 * - parish-name.jol-hub.lt
 * - parish-name.jolhub.lt
 * - localhost (development)
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Handle localhost development
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    // Check for x-subdomain header for local testing
    return null;
  }

  // Handle preview deployments (e.g., parish-name--preview.vercel.app)
  if (host.includes('--')) {
    const parts = host.split('--');
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
  }

  // Extract subdomain from standard patterns
  const parts = host.split('.');

  // Pattern: parish-name.jol-hub.lt (3+ parts)
  // Pattern: parish-name.jolhub.lt (3+ parts)
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Validate subdomain format (alphanumeric and hyphens)
    if (subdomain && /^[a-z0-9-]+$/.test(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Validates that a subdomain is allowed.
 * Used to prevent access to reserved subdomains.
 */
function isValidParishSubdomain(subdomain: string): boolean {
  const reservedSubdomains = [
    'www',
    'api',
    'admin',
    'app',
    'mail',
    'smtp',
    'ftp',
    'blog',
    'shop',
    'store',
    'dev',
    'staging',
    'test',
  ];

  return !reservedSubdomains.includes(subdomain.toLowerCase());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};
