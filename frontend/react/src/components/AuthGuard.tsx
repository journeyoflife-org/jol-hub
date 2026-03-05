'use client'

/**
 * AuthGuard — client-side route guard for protected pages.
 *
 * Renders children only when:
 *   • AuthContext has finished initialization (isInitialized === true)
 *   • A user exists (user !== null)
 *
 * While loading it shows a full-screen spinner.
 * If unauthenticated it redirects to /login (with current path as ?next=).
 *
 * Usage:
 *   <AuthGuard>
 *     <ProtectedContent />
 *   </AuthGuard>
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  /**
   * Where to redirect if unauthenticated.
   * @default '/login'
   */
  redirectTo?: string
}

export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const { user, isInitialized, isLoading } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isInitialized) return
    if (!user) {
      const url = `${redirectTo}?next=${encodeURIComponent(pathname)}`
      router.replace(url)
    }
  }, [user, isInitialized, router, pathname, redirectTo])

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
