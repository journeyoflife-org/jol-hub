import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { JolHubUserRole, AuthAuditLog } from '../types/bitrix';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Parish guard configuration options.
 */
export interface ParishGuardConfig {
  /** Paths that don't require authentication */
  publicPaths: string[];
  /** Paths that require authentication but not parish access */
  authOnlyPaths: string[];
  /** Paths that require admin role */
  adminPaths: string[];
  /** Login page path */
  loginPath: string;
  /** Access denied page path */
  accessDeniedPath: string;
  /** Main site domain (for redirecting non-parish users) */
  mainSiteDomain?: string;
}

/**
 * User session extracted from request.
 */
interface UserSession {
  userId: string;
  email: string;
  role: JolHubUserRole;
  parishIds: string[];
  primaryParishId?: string;
}

/**
 * Parish access check result.
 */
interface ParishAccessResult {
  allowed: boolean;
  reason: 'NO_SUBDOMAIN' | 'NOT_AUTHENTICATED' | 'PARISH_MISMATCH' | 'INSUFFICIENT_ROLE' | 'ALLOWED';
  parishId?: string;
  userId?: string;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG: ParishGuardConfig = {
  publicPaths: [
    '/',
    '/auth/signin',
    '/auth/signout',
    '/auth/error',
    '/api/auth',
    '/api/health',
    '/_next',
    '/favicon.ico',
    '/public',
    '/locales',
  ],
  authOnlyPaths: [
    '/auth/profile',
    '/auth/settings',
  ],
  adminPaths: [
    '/admin',
    '/api/admin',
  ],
  loginPath: '/auth/signin',
  accessDeniedPath: '/auth/access-denied',
};

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Logs authentication/authorization events for audit.
 */
function logAuditEvent(
  event: AuthAuditLog['event'],
  data: Partial<AuthAuditLog>
): void {
  const logEntry: AuthAuditLog = {
    timestamp: new Date(),
    event,
    ...data,
  };
  
  // Log to console for audit (in production, send to logging service)
  if (event === 'parish_access_denied' || event === 'login_failure') {
    console.error('[PARISH GUARD AUDIT]', JSON.stringify(logEntry));
  } else {
    console.log('[PARISH GUARD AUDIT]', JSON.stringify(logEntry));
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Extracts subdomain from hostname.
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];
  
  // Handle localhost development
  if (host === 'localhost' || host.startsWith('127.0.0.1')) {
    // Check for x-subdomain header for local testing
    return null;
  }
  
  // Handle preview deployments
  if (host.includes('--')) {
    const parts = host.split('--');
    if (parts.length > 0 && parts[0]) {
      return parts[0];
    }
  }
  
  // Extract subdomain from standard patterns
  const parts = host.split('.');
  
  // Pattern: parish-name.jol-hub.lt (3+ parts)
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
 * Checks if a path matches any pattern in the list.
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern || pathname.startsWith(`${pattern}/`);
  });
}

/**
 * Extracts user session from request cookies/headers.
 * In production, this would decode the JWT session.
 */
function extractUserSession(request: NextRequest): UserSession | null {
  // Check for session cookie
  const sessionCookie = request.cookies.get('next-auth.session-token')?.value ?? 
                        request.cookies.get('__Secure-next-auth.session-token')?.value;
  
  if (!sessionCookie) {
    return null;
  }
  
  // In production, decode and verify the JWT
  // For now, we'll use a header-based approach for demonstration
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role') as JolHubUserRole;
  const parishIdsHeader = request.headers.get('x-user-parish-ids');
  
  if (!userId || !userEmail) {
    return null;
  }
  
  return {
    userId,
    email: userEmail,
    role: userRole ?? 'user',
    parishIds: parishIdsHeader ? parishIdsHeader.split(',') : [],
    primaryParishId: request.headers.get('x-user-primary-parish') ?? undefined,
  };
}

/**
 * Validates that a subdomain maps to a valid parish ID.
 * In production, this would check against a database or cache.
 */
async function validateParishSubdomain(subdomain: string): Promise<string | null> {
  // In production, fetch from database/cache
  // For now, return subdomain as parish ID
  return subdomain;
}

/**
 * Checks if user has access to the specified parish.
 */
function checkParishAccess(
  session: UserSession | null,
  parishId: string | null,
  config: ParishGuardConfig
): ParishAccessResult {
  // No subdomain - main site access
  if (!parishId) {
    return {
      allowed: true,
      reason: 'NO_SUBDOMAIN',
    };
  }
  
  // Not authenticated
  if (!session) {
    logAuditEvent('login_failure', { parishSubdomain: parishId });
    return {
      allowed: false,
      reason: 'NOT_AUTHENTICATED',
      parishId,
    };
  }
  
  // Admin has access to all parishes
  if (session.role === 'admin') {
    return {
      allowed: true,
      reason: 'ALLOWED',
      parishId,
      userId: session.userId,
    };
  }
  
  // Check if user's parishes include the requested parish
  const hasAccess = session.parishIds.includes(parishId);
  
  if (!hasAccess) {
    logAuditEvent('parish_access_denied', {
      userId: session.userId,
      email: session.email,
      parishSubdomain: parishId,
    });
    
    return {
      allowed: false,
      reason: 'PARISH_MISMATCH',
      parishId,
      userId: session.userId,
    };
  }
  
  return {
    allowed: true,
    reason: 'ALLOWED',
    parishId,
    userId: session.userId,
  };
}

// =============================================================================
// MIDDLEWARE FACTORY
// =============================================================================

/**
 * Creates a parish guard middleware with the specified configuration.
 * 
 * @example
 * ```typescript
 * // In your middleware.ts
 * import { createParishGuardMiddleware } from '@jol-hub/auth/middleware';
 * 
 * const parishGuard = createParishGuardMiddleware({
 *   publicPaths: ['/', '/auth', '/api/auth'],
 *   adminPaths: ['/admin'],
 *   loginPath: '/auth/signin',
 * });
 * 
 * export function middleware(request: NextRequest) {
 *   return parishGuard(request);
 * }
 * ```
 */
export function createParishGuardMiddleware(
  config: Partial<ParishGuardConfig> = {}
): (request: NextRequest) => Promise<NextResponse> {
  const finalConfig: ParishGuardConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return async (request: NextRequest): Promise<NextResponse> => {
    const { pathname } = request.nextUrl;
    const hostname = request.headers.get('host') ?? '';
    
    // Extract subdomain and validate as parish
    const subdomain = extractSubdomain(hostname);
    const parishId = subdomain ? await validateParishSubdomain(subdomain) : null;
    
    // Add parish context to headers for downstream use
    const response = NextResponse.next();
    if (parishId) {
      response.headers.set('x-parish-id', parishId);
      response.headers.set('x-parish-subdomain', subdomain ?? '');
    }
    
    // Check if path is public (no auth required)
    if (matchesPath(pathname, finalConfig.publicPaths)) {
      return response;
    }
    
    // Extract user session
    const session = extractUserSession(request);
    
    // Check if path requires admin role
    if (matchesPath(pathname, finalConfig.adminPaths)) {
      if (!session) {
        logAuditEvent('login_failure', { parishSubdomain: parishId ?? undefined });
        return NextResponse.redirect(new URL(finalConfig.loginPath, request.url));
      }
      
      if (session.role !== 'admin') {
        logAuditEvent('parish_access_denied', {
          userId: session.userId,
          email: session.email,
          parishSubdomain: parishId ?? undefined,
        });
        return NextResponse.redirect(new URL(finalConfig.accessDeniedPath, request.url));
      }
    }
    
    // Check if path requires authentication but not parish access
    if (matchesPath(pathname, finalConfig.authOnlyPaths)) {
      if (!session) {
        logAuditEvent('login_failure', { parishSubdomain: parishId ?? undefined });
        return NextResponse.redirect(new URL(finalConfig.loginPath, request.url));
      }
      return response;
    }
    
    // Check parish access for all other paths
    const accessResult = checkParishAccess(session, parishId, finalConfig);
    
    if (!accessResult.allowed) {
      // Redirect based on reason
      switch (accessResult.reason) {
        case 'NOT_AUTHENTICATED':
          const loginUrl = new URL(finalConfig.loginPath, request.url);
          loginUrl.searchParams.set('callbackUrl', request.url);
          if (parishId) {
            loginUrl.searchParams.set('parish', parishId);
          }
          return NextResponse.redirect(loginUrl);
        
        case 'PARISH_MISMATCH':
          // Redirect to access denied or user's primary parish
          if (session?.primaryParishId && finalConfig.mainSiteDomain) {
            const redirectUrl = new URL(request.url);
            redirectUrl.hostname = `${session.primaryParishId}.${finalConfig.mainSiteDomain}`;
            return NextResponse.redirect(redirectUrl);
          }
          return NextResponse.redirect(new URL(finalConfig.accessDeniedPath, request.url));
        
        default:
          return NextResponse.redirect(new URL(finalConfig.loginPath, request.url));
      }
    }
    
    // Add user context to response headers
    if (session) {
      response.headers.set('x-user-id', session.userId);
      response.headers.set('x-user-email', session.email);
      response.headers.set('x-user-role', session.role);
      response.headers.set('x-user-parish-ids', session.parishIds.join(','));
    }
    
    return response;
  };
}

// =============================================================================
// DEFAULT MIDDLEWARE EXPORT
// =============================================================================

/**
 * Default parish guard middleware instance.
 * Use createParishGuardMiddleware for custom configuration.
 */
export const parishGuardMiddleware = createParishGuardMiddleware();

// =============================================================================
// HELPER EXPORTS
// =============================================================================

export {
  extractSubdomain,
  matchesPath,
  checkParishAccess,
};
