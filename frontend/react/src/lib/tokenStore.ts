/**
 * Token storage keys and helpers.
 *
 * Access token  — stored in memory (module-level variable) so it never
 *                 touches localStorage / sessionStorage and cannot be
 *                 read by third-party scripts.
 *
 * Refresh token — stored in an HttpOnly-like cookie via js-cookie with
 *                 the Secure + SameSite=Strict flags in production.
 *                 (A real HttpOnly cookie requires a server-set header;
 *                  this is the closest client-achievable equivalent.)
 */

import Cookies from 'js-cookie'

export const REFRESH_TOKEN_COOKIE = 'jol_refresh'
export const ACCESS_TOKEN_LIFETIME_MS =
  Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_LIFETIME_S ?? 900) * 1_000
export const REFRESH_TOKEN_LIFETIME_DAYS =
  Number(process.env.NEXT_PUBLIC_REFRESH_TOKEN_LIFETIME_S ?? 604_800) / 86_400

// ---------------------------------------------------------------------------
// In-memory access token (never written to storage)
// ---------------------------------------------------------------------------

let _accessToken: string | null = null

export const tokenStore = {
  getAccess: (): string | null => _accessToken,

  setAccess: (token: string): void => {
    _accessToken = token
  },

  clearAccess: (): void => {
    _accessToken = null
  },

  getRefresh: (): string | undefined =>
    Cookies.get(REFRESH_TOKEN_COOKIE),

  setRefresh: (token: string): void => {
    Cookies.set(REFRESH_TOKEN_COOKIE, token, {
      expires: REFRESH_TOKEN_LIFETIME_DAYS,
      sameSite: 'strict',
      secure: process.env.NEXT_PUBLIC_ENV !== 'development',
    })
  },

  clearRefresh: (): void => {
    Cookies.remove(REFRESH_TOKEN_COOKIE)
  },

  clearAll: (): void => {
    _accessToken = null
    Cookies.remove(REFRESH_TOKEN_COOKIE)
  },
}
