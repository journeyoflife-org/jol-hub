/**
 * jol-auth client hooks — STEP 10 (CLIENT-ONLY subpath).
 *
 * Server code must import `@jol-hub/auth/oidc` (never this module). Wraps
 * next-auth's `useSession`; requires <SessionProvider> in the tree.
 *
 * RULES honored here:
 *   - No tokens are ever exposed — the session callback strips them; these
 *     hooks only see identity + tenant roles.
 *   - Generic error surface: failures surface as "unauthenticated", never
 *     with IdP error detail (no user-existence leakage).
 */
'use client';

import { useCallback } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  hasPermission as rbacHasPermission,
  hasRole as rbacHasRole,
  tenantRoleFor,
} from './rbac';
import type { AuthSession, Permission, TenantRoleName } from './types';

/** Map the (extended) next-auth session to the renderer's AuthSession. */
function toAuthSession(raw: ReturnType<typeof useSession>['data']): AuthSession | null {
  if (!raw?.user) return null;
  const user = raw.user as {
    id?: string;
    email?: string;
    name?: string | null;
    roles?: AuthSession['user']['roles'];
    platformRole?: AuthSession['user']['platformRole'];
    mfaEnrolled?: boolean;
  };
  return {
    user: {
      sub: user.id ?? '',
      email: user.email ?? '',
      name: user.name ?? undefined,
      roles: user.roles ?? [],
      platformRole: user.platformRole,
      mfaEnrolled: user.mfaEnrolled === true,
    },
    expiresAt: typeof raw.expires === 'string' ? new Date(raw.expires).getTime() : 0,
  };
}

export interface UseAuthResult {
  user: AuthSession['user'] | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (callbackUrl?: string) => Promise<void>;
  logout: (callbackUrl?: string) => Promise<void>;
}

/** Auth state + actions for the current user. */
export function useAuth(): UseAuthResult {
  const { data, status } = useSession();
  const session = toAuthSession(data);

  const login = useCallback(async (callbackUrl?: string) => {
    // Single-provider flow: straight to the jol-auth authorize endpoint.
    await signIn('jol-auth', callbackUrl ? { callbackUrl } : undefined);
  }, []);

  const logout = useCallback(async (callbackUrl = '/') => {
    // Clears the httpOnly session cookie via the same-origin auth API.
    await signOut({ callbackUrl });
  }, []);

  return {
    user: session?.user ?? null,
    session,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated' && session !== null,
    login,
    logout,
  };
}

/** The current user's role for ONE tenant (tenant-scoped RBAC), or null. */
export function useTenantRole(tenantSlug: string): TenantRoleName | null {
  const { data } = useSession();
  const session = toAuthSession(data);
  return tenantRoleFor(session, tenantSlug)?.role ?? null;
}

/** Permission check for the current user in ONE tenant. Deny by default. */
export function usePermission(permission: Permission, tenantSlug: string): boolean {
  const { data } = useSession();
  const session = toAuthSession(data);
  return rbacHasPermission(session, tenantSlug, permission);
}

/** Hierarchical role check (minimum role) for the current user in a tenant. */
export function useHasRole(tenantSlug: string, minimumRole: TenantRoleName): boolean {
  const { data } = useSession();
  const session = toAuthSession(data);
  return rbacHasRole(session, tenantSlug, minimumRole);
}
