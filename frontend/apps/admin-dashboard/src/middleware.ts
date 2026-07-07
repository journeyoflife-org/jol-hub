import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// =============================================================================
// Admin Dashboard Middleware
// =============================================================================

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Allow public routes
    const publicPaths = ['/auth/login', '/auth/error', '/auth/unauthorized'];
    if (publicPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Check if user is authenticated
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based access control
    const userRole = token.role as string;
    const requiredRoles: Record<string, string[]> = {
      '/dashboard/analytics': ['admin', 'super_admin'],
      '/dashboard/users': ['admin', 'super_admin', 'support'],
      '/dashboard/settings': ['super_admin'],
    };

    // Check role requirements for specific paths
    for (const [path, roles] of Object.entries(requiredRoles)) {
      if (pathname.startsWith(path)) {
        if (!roles.includes(userRole)) {
          return NextResponse.redirect(new URL('/auth/unauthorized', req.url));
        }
      }
    }

    // Add user info to headers for API calls
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.userId as string);
    response.headers.set('x-user-role', userRole);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow public routes without authentication
        const publicPaths = ['/auth/login', '/auth/error', '/auth/unauthorized', '/auth/logout'];
        if (publicPaths.some((path) => pathname.startsWith(path))) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (NextAuth API routes)
     * - auth pages (login, error, unauthorized)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api|auth/login|auth/error|auth/unauthorized|auth/logout).*)',
  ],
};
