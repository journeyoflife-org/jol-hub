import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Extract subdomain from hostname
  const hostname = request.headers.get('host') ?? '';
  const subdomain = extractSubdomain(hostname);

  // Add subdomain to headers for downstream use
  const response = NextResponse.next();
  if (subdomain) {
    response.headers.set('x-subdomain', subdomain);
  }

  // Security: Add additional headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  return response;
}

function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Handle localhost development
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    return null;
  }

  // Extract subdomain from patterns like:
  // parish-name.jol-hub.lt
  // parish-name.jolhub.lt
  const parts = host.split('.');

  // If we have more than 2 parts, the first is the subdomain
  if (parts.length > 2) {
    return parts[0] ?? null;
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
