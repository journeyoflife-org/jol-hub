import type { DefaultSession } from 'next-auth';

/**
 * Extended user type with Bitrix24-specific fields.
 */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  bitrixId?: string;
  bitrixDomain?: string;
  role?: UserRole;
}

/**
 * User roles for the JOL-HUB platform.
 */
export type UserRole = 'admin' | 'parish_admin' | 'priest' | 'user';

/**
 * Extended session type with additional user data.
 */
export interface Session extends DefaultSession {
  user: User & DefaultSession['user'];
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Bitrix24 token response.
 */
export interface Bitrix24TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  member_id?: string;
}

/**
 * Bitrix24 user profile from API.
 */
export interface Bitrix24UserProfile {
  ID: string;
  ACTIVE: boolean;
  NAME: string;
  LAST_NAME: string;
  EMAIL: string;
  PERSONAL_PHOTO?: string;
  UF_DEPARTMENT?: number[];
  WORK_POSITION?: string;
}

/**
 * JWT token payload.
 */
export interface JWTTokenPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpires: number;
  user: User;
}
