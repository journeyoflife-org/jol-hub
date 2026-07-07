'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

/**
 * Auth guard component that protects routes.
 * Redirects to login if not authenticated.
 * Shows loading state while checking authentication.
 */
export function AuthGuard({
  children,
  requiredRoles,
  requiredPermissions,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session) {
      // Check role requirements
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = (session.user as any).role;
        if (!requiredRoles.includes(userRole)) {
          router.push('/auth/unauthorized');
          return;
        }
      }

      // Check permission requirements
      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = (session.user as any).permissions || [];
        const hasAllPermissions = requiredPermissions.every((perm) =>
          userPermissions.includes(perm)
        );
        if (!hasAllPermissions) {
          router.push('/auth/unauthorized');
          return;
        }
      }

      setIsAuthorized(true);
    }
  }, [status, session, router, requiredRoles, requiredPermissions]);

  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to check if user has specific permission
 */
export function useHasPermission(permission: string): boolean {
  const { data: session } = useSession();

  if (!session) {
    return false;
  }

  const userPermissions = (session.user as any).permissions || [];
  return userPermissions.includes(permission);
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: string): boolean {
  const { data: session } = useSession();

  if (!session) {
    return false;
  }

  const userRole = (session.user as any).role;
  return userRole === role;
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { data: session } = useSession();

  if (!session) {
    return false;
  }

  const userRole = (session.user as any).role;
  return roles.includes(userRole);
}
