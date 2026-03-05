/**
 * TypeScript types mirroring the Django backend API contracts.
 *
 * Matches:
 *   apps/users/serializers.py  — UserSerializer, RegisterSerializer, TokenObtainPairSerializer
 *   apps/users/models.py       — User.ROLE_CHOICES
 *   apps/organizations/models.py — Organization
 */

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'editor' | 'viewer' | 'member'

export interface UserProfile {
  bio: string
  website: string
  date_of_birth: string | null
  notification_preferences: Record<string, unknown>
}

/** Mirrors UserSerializer fields exactly */
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  mfa_enabled: boolean
  avatar: string | null
  phone: string
  preferred_language: string
  timezone: string
  country: string
  gdpr_consent: boolean
  gdpr_consent_at: string | null
  marketing_consent: boolean
  marketing_consent_at: string | null
  last_login: string | null
  login_count: number
  profile: UserProfile | null
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Auth — JWT
// ---------------------------------------------------------------------------

/**
 * Response shape from POST /api/v1/auth/login/
 * Mirrors TokenObtainPairSerializer + embedded UserSerializer
 */
export interface TokenResponse {
  access: string
  refresh: string
  user: User
}

/** Response shape from POST /api/v1/auth/refresh/ */
export interface RefreshResponse {
  access: string
}

export interface LoginCredentials {
  email: string
  password: string
  mfa_code?: string
}

export interface RegisterPayload {
  email: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
  gdpr_consent: boolean
  marketing_consent: boolean
}

export interface ChangePasswordPayload {
  old_password: string
  new_password: string
}

// ---------------------------------------------------------------------------
// API — generic response shapes
// ---------------------------------------------------------------------------

/** Uniform error envelope from apps/core/exceptions.py */
export interface ApiError {
  error: string
  message: string
  details?: Record<string, string[]> | string[]
}

/** Paginated list from DRF PageNumberPagination */
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

export type OrgType = 'church' | 'monastery' | 'chapel' | 'shrine' | 'cathedral' | 'parish'
export type OrgStatus = 'active' | 'inactive' | 'pending'

export interface Organization {
  id: string
  name: string
  slug: string
  org_type: OrgType
  status: OrgStatus
  country: string
  description: string
  logo: string | null
  address_street: string
  address_city: string
  address_postal_code: string
  email: string
  phone: string
  website: string
  latitude: string | null
  longitude: string | null
  member_count: number
  created_at: string
  updated_at: string
}
