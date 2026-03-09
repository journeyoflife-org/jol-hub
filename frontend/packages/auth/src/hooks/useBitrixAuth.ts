'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { Bitrix24Session, JolHubUserRole, ParishInfo } from '../types/bitrix';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Authentication state returned by useBitrixAuth hook.
 */
export interface BitrixAuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is being loaded */
  isLoading: boolean;
  /** Current user session data */
  user: Bitrix24UserSession | null;
  /** Error message if authentication failed */
  error: string | null;
  /** Function to initiate login */
  login: (options?: LoginOptions) => Promise<void>;
  /** Function to logout */
  logout: (options?: LogoutOptions) => Promise<void>;
  /** Function to refresh the session */
  refreshSession: () => Promise<void>;
  /** Check if user has access to a specific parish */
  hasParishAccess: (parishId: string) => boolean;
  /** Check if user has a specific role */
  hasRole: (role: JolHubUserRole) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: JolHubUserRole[]) => boolean;
}

/**
 * User session data extracted from NextAuth session.
 */
export interface Bitrix24UserSession {
  /** User ID */
  id: string;
  /** Bitrix24 user ID */
  bitrixId: string;
  /** User email */
  email: string;
  /** User display name */
  name: string;
  /** User profile image URL */
  image?: string;
  /** User role in JOL-HUB */
  role: JolHubUserRole;
  /** Work position from Bitrix24 */
  workPosition?: string;
  /** Bitrix24 portal domain */
  bitrixDomain: string;
  /** Parish IDs user has access to */
  parishIds: string[];
  /** Primary parish ID */
  primaryParishId?: string;
  /** OAuth access token */
  accessToken?: string;
  /** Token expiration timestamp */
  expiresAt?: number;
}

/**
 * Login options.
 */
export interface LoginOptions {
  /** Redirect URL after login */
  callbackUrl?: string;
  /** Parish subdomain context */
  parishSubdomain?: string;
}

/**
 * Logout options.
 */
export interface LogoutOptions {
  /** Redirect URL after logout */
  callbackUrl?: string;
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * React hook for managing Bitrix24 authentication state.
 * 
 * This hook provides a clean interface for:
 * - Checking authentication status
 * - Initiating login/logout flows
 * - Checking user permissions and parish access
 * - Refreshing session data
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, login, logout, hasParishAccess } = useBitrixAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login()}>Login with Bitrix24</button>;
 *   }
 *   
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name} ({user?.role})</p>
 *       {hasParishAccess('parish-123') && <ParishDashboard parishId="parish-123" />}
 *       <button onClick={() => logout()}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBitrixAuth(): BitrixAuthState {
  const { data: session, status, update } = useSession();
  const [error, setError] = useState<string | null>(null);

  // Extract user data from session
  const user = useMemo<Bitrix24UserSession | null>(() => {
    if (!session?.user) {
      return null;
    }

    return {
      id: session.user.id ?? '',
      bitrixId: (session.user as unknown as Record<string, unknown>).bitrixId as string ?? '',
      email: session.user.email ?? '',
      name: session.user.name ?? '',
      image: session.user.image ?? undefined,
      role: ((session.user as unknown as Record<string, unknown>).role as JolHubUserRole) ?? 'user',
      workPosition: (session.user as unknown as Record<string, unknown>).workPosition as string,
      bitrixDomain: (session.user as unknown as Record<string, unknown>).bitrixDomain as string ?? '',
      parishIds: ((session.user as unknown as Record<string, unknown>).parishIds as string[]) ?? [],
      primaryParishId: (session.user as unknown as Record<string, unknown>).primaryParishId as string,
      accessToken: (session as unknown as Record<string, unknown>).accessToken as string,
      expiresAt: (session as unknown as Record<string, unknown>).expiresAt as number,
    };
  }, [session]);

  // Clear error when session changes
  useEffect(() => {
    if (session) {
      setError(null);
    }
  }, [session]);

  // Login function
  const login = useCallback(async (options?: LoginOptions) => {
    setError(null);
    
    try {
      // Store PKCE verifier if needed
      const verifier = sessionStorage.getItem('pkce_verifier');
      
      await signIn('bitrix24', {
        callbackUrl: options?.callbackUrl ?? '/',
        redirect: true,
      });
      
      // Clear PKCE verifier after use
      if (verifier) {
        sessionStorage.removeItem('pkce_verifier');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('[AUTH] Login error:', err);
    }
  }, []);

  // Logout function
  const logout = useCallback(async (options?: LogoutOptions) => {
    setError(null);
    
    try {
      await signOut({
        callbackUrl: options?.callbackUrl ?? '/',
        redirect: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      console.error('[AUTH] Logout error:', err);
    }
  }, []);

  // Refresh session function
  const refreshSession = useCallback(async () => {
    setError(null);
    
    try {
      await update();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session refresh failed';
      setError(errorMessage);
      console.error('[AUTH] Session refresh error:', err);
    }
  }, [update]);

  // Check parish access
  const hasParishAccess = useCallback(
    (parishId: string): boolean => {
      if (!user) {
        return false;
      }
      
      // Admin has access to all parishes
      if (user.role === 'admin') {
        return true;
      }
      
      // Check if user's parish IDs include the requested parish
      return user.parishIds.includes(parishId);
    },
    [user]
  );

  // Check specific role
  const hasRole = useCallback(
    (role: JolHubUserRole): boolean => {
      if (!user) {
        return false;
      }
      
      return user.role === role;
    },
    [user]
  );

  // Check any of the roles
  const hasAnyRole = useCallback(
    (roles: JolHubUserRole[]): boolean => {
      if (!user) {
        return false;
      }
      
      return roles.includes(user.role);
    },
    [user]
  );

  return {
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    user,
    error,
    login,
    logout,
    refreshSession,
    hasParishAccess,
    hasRole,
    hasAnyRole,
  };
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get the current parish context from subdomain.
 * Returns the parish ID based on the current subdomain.
 */
export function useParishContext(): {
  parishId: string | null;
  subdomain: string | null;
  isLoading: boolean;
} {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [parishId, setParishId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const hostname = window.location.hostname;
    
    // Extract subdomain
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const extracted = parts[0];
      if (extracted && extracted !== 'www') {
        setSubdomain(extracted);
        // In production, fetch parish ID from subdomain mapping
        // For now, use subdomain as parish ID
        setParishId(extracted);
      }
    }
    
    setIsLoading(false);
  }, []);

  return { parishId, subdomain, isLoading };
}

/**
 * Hook to check if current user can access the current parish.
 * Combines parish context with user permissions.
 */
export function useParishAccess(): {
  canAccess: boolean;
  reason: string | null;
  parishId: string | null;
  userRole: JolHubUserRole | null;
} {
  const { isAuthenticated, user, hasParishAccess } = useBitrixAuth();
  const { parishId, subdomain } = useParishContext();

  const result = useMemo(() => {
    // No parish context (main site)
    if (!parishId) {
      return {
        canAccess: true,
        reason: null,
        parishId: null,
        userRole: user?.role ?? null,
      };
    }

    // Not authenticated
    if (!isAuthenticated) {
      return {
        canAccess: false,
        reason: 'NOT_AUTHENTICATED',
        parishId,
        userRole: null,
      };
    }

    // Check access
    if (!hasParishAccess(parishId)) {
      return {
        canAccess: false,
        reason: 'PARISH_ACCESS_DENIED',
        parishId,
        userRole: user?.role ?? null,
      };
    }

    return {
      canAccess: true,
      reason: null,
      parishId,
      userRole: user?.role ?? null,
    };
  }, [parishId, isAuthenticated, user, hasParishAccess]);

  return result;
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { BitrixAuthState, Bitrix24UserSession, LoginOptions, LogoutOptions };
