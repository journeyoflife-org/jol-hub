'use client'

/**
 * useUser — returns the current user (throws if used outside AuthProvider).
 *
 * Prefer this over useAuth when you only need the user object and you are
 * certain the component is rendered inside a protected route.
 */

import { useAuthContext } from '@/context/AuthContext'
import type { User } from '@/types/api'

export function useUser(): User | null {
  return useAuthContext().user
}

/**
 * useRequiredUser — like useUser but asserts the user is non-null.
 * Use only inside components rendered exclusively for authenticated users.
 */
export function useRequiredUser(): User {
  const user = useAuthContext().user
  if (!user) throw new Error('useRequiredUser called without an authenticated user.')
  return user
}
