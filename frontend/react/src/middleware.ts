/**
 * Next.js Edge middleware — enforces authentication at the routing layer
 * before any React renders occur.
 *
 * Strategy:
 *   • Public routes (/login, /register, /public/**) pass through freely.
 *   • All other routes require the presence of the refresh cookie.
 *     If the cookie is absent the user is redirected to /login.
 *   • The actual token verification happens inside the AuthContext on the
 *     client (full JWT decode would need the secret, which stays server-side).
 *
 * Note: Access tokens are intentionally NOT stored in cookies (XSS risk).
 *       The middleware only checks for the refresh cookie as a "session exists"
 *       signal; AuthContext performs the real refresh + /me call.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { REFRESH_TOKEN_COOKIE } from '@/lib/tokenStore'

// Routes that do not require authentication
const PUBLIC_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
])

const PUBLIC_PREFIX = ['/api/', '/_next/', '/favicon', '/public/']

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIX.some((prefix) => pathname.startsWith(prefix))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  const hasSession = Boolean(request.cookies.get(REFRESH_TOKEN_COOKIE)?.value)

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
