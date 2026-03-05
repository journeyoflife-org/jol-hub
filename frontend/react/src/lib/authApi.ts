/**
 * Auth API functions — thin wrappers around the Django JWT endpoints.
 *
 * Endpoints (from apps/users/urls.py):
 *   POST /api/v1/auth/login/          → TokenObtainPairSerializer response
 *   POST /api/v1/auth/logout/         → blacklists refresh token
 *   POST /api/v1/auth/refresh/        → returns new access token
 *   POST /api/v1/auth/register/       → creates User, returns User object
 *   GET  /api/v1/users/me/            → current user (UserSerializer)
 *   PATCH /api/v1/users/me/           → update profile
 *   POST /api/v1/users/me/change-password/
 */

import apiClient from '@/lib/apiClient'
import { tokenStore } from '@/lib/tokenStore'
import type {
  LoginCredentials,
  RegisterPayload,
  TokenResponse,
  User,
  ChangePasswordPayload,
} from '@/types/api'

// ---------------------------------------------------------------------------
// Login — stores tokens, returns user
// ---------------------------------------------------------------------------

export async function login(credentials: LoginCredentials): Promise<User> {
  const { data } = await apiClient.post<TokenResponse>(
    '/auth/login/',
    credentials,
  )
  tokenStore.setAccess(data.access)
  tokenStore.setRefresh(data.refresh)
  return data.user
}

// ---------------------------------------------------------------------------
// Logout — blacklists refresh token on server, clears client tokens
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const refresh = tokenStore.getRefresh()
  try {
    if (refresh) {
      await apiClient.post('/auth/logout/', { refresh_token: refresh })
    }
  } finally {
    tokenStore.clearAll()
  }
}

// ---------------------------------------------------------------------------
// Register — creates account; does NOT auto-login
// ---------------------------------------------------------------------------

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register/', payload)
  return data
}

// ---------------------------------------------------------------------------
// Fetch current user — used on app bootstrap to rehydrate context
// ---------------------------------------------------------------------------

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me/')
  return data
}

// ---------------------------------------------------------------------------
// Update current user profile
// ---------------------------------------------------------------------------

export async function updateMe(payload: Partial<User>): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me/', payload)
  return data
}

// ---------------------------------------------------------------------------
// Change password
// ---------------------------------------------------------------------------

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<void> {
  await apiClient.post('/users/me/change-password/', payload)
}
