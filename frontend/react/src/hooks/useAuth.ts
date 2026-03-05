'use client'

/**
 * useAuth — primary auth hook.
 *
 * Re-exports all values from AuthContext with a stable, ergonomic API.
 * Use this hook in any component that needs auth state or actions.
 *
 * @example
 * const { user, login, logout, isLoading } = useAuth()
 */

import { useAuthContext } from '@/context/AuthContext'
export { useAuthContext as useAuth }
