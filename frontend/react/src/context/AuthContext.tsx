'use client'

/**
 * AuthContext — central auth state for the JOL-HUB frontend.
 *
 * Responsibilities:
 *   • Hold the authenticated User object (or null).
 *   • Expose login / logout / register / updateUser actions.
 *   • On mount, attempt silent session rehydration:
 *       1. If an access token is already in memory (SPA tab re-render) → fetch /me.
 *       2. If a refresh cookie exists → call /auth/refresh/, store new access
 *          token in memory, then fetch /me.
 *       3. Otherwise stay unauthenticated.
 *   • Schedule a proactive token refresh at 80 % of the access-token lifetime
 *     so the user never experiences a mid-session 401.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { tokenStore, ACCESS_TOKEN_LIFETIME_MS } from '@/lib/tokenStore'
import { login as apiLogin, logout as apiLogout, register as apiRegister, fetchMe, updateMe } from '@/lib/authApi'
import apiClient from '@/lib/apiClient'
import type { LoginCredentials, RegisterPayload, User } from '@/types/api'
import type { RefreshResponse } from '@/types/api'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface AuthContextValue {
  /** The currently authenticated user, or null when unauthenticated */
  user: User | null
  /** True while the initial session rehydration is in progress */
  isLoading: boolean
  /** True once rehydration has completed (either success or failure) */
  isInitialized: boolean
  /** True when any auth action (login / logout / refresh) is pending */
  isAuthenticating: boolean
  /** The last auth error, if any */
  error: string | null

  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  register: (payload: RegisterPayload) => Promise<User>
  updateUser: (patch: Partial<User>) => Promise<void>
  clearError: () => void
}

// ---------------------------------------------------------------------------
// Context object
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Timer handle for the proactive refresh scheduler
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---------------------------------------------------------------------------
  // Proactive refresh scheduler
  // ---------------------------------------------------------------------------

  const scheduleProactiveRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)

    // Refresh at 80 % of the token lifetime (e.g. 12 min for a 15-min token)
    const delay = ACCESS_TOKEN_LIFETIME_MS * 0.8

    refreshTimerRef.current = setTimeout(async () => {
      const refresh = tokenStore.getRefresh()
      if (!refresh) return

      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
        const { data } = await apiClient.post<RefreshResponse>(
          `${API_BASE}/api/v1/auth/refresh/`,
          { refresh },
        )
        tokenStore.setAccess(data.access)
        scheduleProactiveRefresh()
      } catch {
        // Refresh failed silently — the 401 interceptor will handle it on next request
        tokenStore.clearAll()
        setUser(null)
      }
    }, delay)
  }, [])

  // ---------------------------------------------------------------------------
  // Session rehydration on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false

    async function rehydrate() {
      setIsLoading(true)
      try {
        // Case 1: access token already in memory (e.g. HMR, context remount)
        if (tokenStore.getAccess()) {
          const me = await fetchMe()
          if (!cancelled) {
            setUser(me)
            scheduleProactiveRefresh()
          }
          return
        }

        // Case 2: refresh cookie exists — do a silent refresh
        const refresh = tokenStore.getRefresh()
        if (refresh) {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
          const { data } = await apiClient.post<RefreshResponse>(
            '/auth/refresh/',
            { refresh },
          )
          tokenStore.setAccess(data.access)

          const me = await fetchMe()
          if (!cancelled) {
            setUser(me)
            scheduleProactiveRefresh()
          }
          return
        }

        // Case 3: no tokens — stay unauthenticated
      } catch {
        tokenStore.clearAll()
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }
    }

    rehydrate()

    return () => {
      cancelled = true
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [scheduleProactiveRefresh])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setIsAuthenticating(true)
      setError(null)
      try {
        const me = await apiLogin(credentials)
        setUser(me)
        scheduleProactiveRefresh()
      } catch (err: unknown) {
        const message = extractErrorMessage(err) ?? 'Login failed.'
        setError(message)
        throw err
      } finally {
        setIsAuthenticating(false)
      }
    },
    [scheduleProactiveRefresh],
  )

  const logout = useCallback(async (): Promise<void> => {
    setIsAuthenticating(true)
    try {
      await apiLogout()
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      setUser(null)
      setError(null)
      setIsAuthenticating(false)
    }
  }, [])

  const register = useCallback(
    async (payload: RegisterPayload): Promise<User> => {
      setIsAuthenticating(true)
      setError(null)
      try {
        return await apiRegister(payload)
      } catch (err: unknown) {
        const message = extractErrorMessage(err) ?? 'Registration failed.'
        setError(message)
        throw err
      } finally {
        setIsAuthenticating(false)
      }
    },
    [],
  )

  const updateUser = useCallback(async (patch: Partial<User>): Promise<void> => {
    const updated = await updateMe(patch)
    setUser(updated)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------

  const value: AuthContextValue = {
    user,
    isLoading,
    isInitialized,
    isAuthenticating,
    error,
    login,
    logout,
    register,
    updateUser,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } }
    return axiosErr.response?.data?.message ?? null
  }
  if (err instanceof Error) return err.message
  return null
}
