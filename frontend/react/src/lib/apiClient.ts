/**
 * Axios-based API client with automatic JWT token attachment
 * and a single-flight token-refresh interceptor.
 *
 * Token lifecycle matches Django SIMPLE_JWT settings:
 *   - Access token:  15 min (stored in memory)
 *   - Refresh token: 7 days (stored in cookie)
 *
 * On any 401 the client:
 *   1. Pauses the failed request.
 *   2. Calls POST /api/v1/auth/refresh/ once (single-flight lock).
 *   3. Updates the in-memory access token.
 *   4. Retries the original request with the new token.
 *   5. On refresh failure clears all tokens and redirects to /login.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios'
import { tokenStore } from './tokenStore'
import type { RefreshResponse } from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15_000,
})

// ---------------------------------------------------------------------------
// Request interceptor — attach access token
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — silent token refresh on 401
// ---------------------------------------------------------------------------

let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  refreshQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Only intercept 401s that haven't been retried yet
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    const refreshToken = tokenStore.getRefresh()
    if (!refreshToken) {
      // No refresh token — force logout
      tokenStore.clearAll()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(error)
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((newAccessToken) => {
        originalRequest._retry = true
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        }
        return apiClient(originalRequest)
      })
    }

    // Start a new refresh flow
    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<RefreshResponse>(
        `${API_BASE}/api/v1/auth/refresh/`,
        { refresh: refreshToken },
        { headers: { 'Content-Type': 'application/json' } },
      )

      tokenStore.setAccess(data.access)
      processQueue(null, data.access)

      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${data.access}`
      }
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      tokenStore.clearAll()
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default apiClient
