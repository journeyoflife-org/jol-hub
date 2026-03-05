'use client'

/**
 * useRequireAuth — redirects to /login when the user is not authenticated.
 *
 * Use in client components that must be protected.
 * For page-level protection prefer the Next.js middleware or the
 * <AuthGuard> wrapper component.
 *
 * @example
 * export default function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth()
 *   if (isLoading) return <LoadingSpinner />
 *   return <div>Hello {user.full_name}</div>
 * }
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import type { UserRole } from '@/types/api'

interface UseRequireAuthOptions {
  /**
   * Where to redirect if the user is not authenticated.
   * Defaults to '/login'.
   */
  redirectTo?: string
  /**
   * Optional role restriction. If the authenticated user's role is not in
   * this list they are redirected to `unauthorizedRedirect`.
   */
  allowedRoles?: UserRole[]
  /** Where to redirect if the user is authenticated but lacks the required role. */
  unauthorizedRedirect?: string
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const {
    redirectTo = '/login',
    allowedRoles,
    unauthorizedRedirect = '/dashboard',
  } = options

  const { user, isLoading, isInitialized } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialized) return

    // Not authenticated
    if (!user) {
      router.replace(redirectTo)
      return
    }

    // Authenticated but wrong role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace(unauthorizedRedirect)
    }
  }, [user, isInitialized, router, redirectTo, allowedRoles, unauthorizedRedirect])

  return { user, isLoading: isLoading || !isInitialized }
}
