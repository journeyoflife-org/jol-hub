/**
 * Bitrix24 TypeScript Interfaces for Self-Hosted Integration
 * 
 * These types cover the core Bitrix24 REST API entities used in JOL-HUB
 * for ecclesiastical platform authentication and parish management.
 */

// =============================================================================
// USER TYPES
// =============================================================================

/**
 * Bitrix24 User entity from REST API.
 * @see https://dev.1c-bitrix.ru/rest_help/users/user_fields.php
 */
export interface Bitrix24User {
  /** Unique user identifier */
  ID: string;
  /** Active status - only active users can authenticate */
  ACTIVE: boolean;
  /** First name */
  NAME: string;
  /** Last name */
  LAST_NAME: string;
  /** Middle name (patronymic in Russian context) */
  SECOND_NAME?: string;
  /** Email address - used as primary identifier */
  EMAIL: string;
  /** Login username */
  LOGIN: string;
  /** User role/position title - mapped to JOL-HUB roles */
  WORK_POSITION?: string;
  /** Profile photo URL */
  PERSONAL_PHOTO?: string;
  /** Gender: 'M' or 'F' */
  PERSONAL_GENDER?: 'M' | 'F';
  /** Birthday in site format */
  PERSONAL_BIRTHDAY?: string;
  /** Mobile phone */
  PERSONAL_MOBILE?: string;
  /** Work phone */
  WORK_PHONE?: string;
  /** Internal phone extension */
  UF_PHONE_INNER?: string;
  /** Array of department IDs user belongs to */
  UF_DEPARTMENT?: number[];
  /** User's city */
  PERSONAL_CITY?: string;
  /** User's street address */
  PERSONAL_STREET?: string;
  /** User's country */
  PERSONAL_COUNTRY?: string;
  /** Time zone name */
  TIME_ZONE?: string;
  /** Time zone offset in seconds */
  TIME_ZONE_OFFSET?: number;
  /** Registration date */
  DATE_REGISTER?: string;
  /** Last login timestamp */
  LAST_LOGIN?: string;
  /** Is user online */
  IS_ONLINE?: boolean;
  /** Admin status */
  ADMIN?: boolean;
  /** Externally authenticated */
  XML_ID?: string;
}

/**
 * JOL-HUB user role derived from Bitrix24 WORK_POSITION.
 */
export type JolHubUserRole = 'admin' | 'parish_admin' | 'priest' | 'sexton' | 'user';

/**
 * Role mapping configuration from Bitrix24 positions to JOL-HUB roles.
 */
export const BITRIX_ROLE_MAPPING: Record<string, JolHubUserRole> = {
  // Lithuanian positions
  'Kunigas': 'priest',
  'Vikaras': 'priest',
  'Klebonas': 'parish_admin',
  'Parapijos administratorius': 'parish_admin',
  'Sakristijonas': 'sexton',
  'Vargonininkas': 'user',
  
  // English positions
  'Priest': 'priest',
  'Vicar': 'priest',
  'Parish Administrator': 'parish_admin',
  'Parish Admin': 'parish_admin',
  'Pastor': 'priest',
  'Sexton': 'sexton',
  'Organist': 'user',
  
  // Russian positions
  'Священник': 'priest',
  'Настоятель': 'parish_admin',
  'Викарий': 'priest',
  'Администратор прихода': 'parish_admin',
  'Пономарь': 'sexton',
};

/**
 * Maps Bitrix24 WORK_POSITION to JOL-HUB role.
 */
export function mapBitrixRole(workPosition: string | undefined): JolHubUserRole {
  if (!workPosition) {
    return 'user';
  }
  
  // Check exact match first
  if (BITRIX_ROLE_MAPPING[workPosition]) {
    return BITRIX_ROLE_MAPPING[workPosition];
  }
  
  // Check case-insensitive partial match
  const normalizedPosition = workPosition.toLowerCase();
  for (const [position, role] of Object.entries(BITRIX_ROLE_MAPPING)) {
    if (normalizedPosition.includes(position.toLowerCase())) {
      return role;
    }
  }
  
  return 'user';
}

// =============================================================================
// OAUTH TYPES
// =============================================================================

/**
 * Bitrix24 OAuth2 token response.
 * @see https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=43&LESSON_ID=2385
 */
export interface Bitrix24TokenResponse {
  /** Access token for API calls */
  access_token: string;
  /** Refresh token for obtaining new access tokens */
  refresh_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** Token type - always "Bearer" */
  token_type: string;
  /** Granted scopes */
  scope?: string;
  /** Member ID for Bitrix24 portal */
  member_id?: string;
  /** Domain of the Bitrix24 portal */
  domain?: string;
  /** Server endpoint URL */
  server_endpoint?: string;
  /** Client endpoint URL */
  client_endpoint?: string;
}

/**
 * Bitrix24 OAuth2 error response.
 */
export interface Bitrix24OAuthError {
  /** Error code */
  error: 'invalid_request' | 'unauthorized_client' | 'access_denied' | 
         'unsupported_response_type' | 'invalid_scope' | 'server_error' | 
         'temporarily_unavailable' | 'invalid_grant' | 'expired_token';
  /** Human-readable error description */
  error_description: string;
}

/**
 * PKCE code verifier and challenge pair.
 */
export interface PKCEPair {
  /** Random cryptographic string (43-128 characters) */
  codeVerifier: string;
  /** SHA256 hash of verifier, base64url encoded */
  codeChallenge: string;
  /** Method used for challenge - always S256 for security */
  codeChallengeMethod: 'S256';
}

/**
 * OAuth state parameter with CSRF protection.
 */
export interface OAuthState {
  /** Random nonce for CSRF protection */
  nonce: string;
  /** Timestamp when state was created */
  timestamp: number;
  /** Redirect URL after successful auth */
  redirectUri?: string;
  /** Parish subdomain context */
  parishSubdomain?: string;
}

// =============================================================================
// DEPARTMENT TYPES
// =============================================================================

/**
 * Bitrix24 Department entity.
 * Used for parish/diocese hierarchy mapping.
 */
export interface Bitrix24Department {
  /** Unique department identifier */
  ID: string;
  /** Department name */
  NAME: string;
  /** Sort order */
  SORT?: number;
  /** Parent department ID (for hierarchy) */
  PARENT?: string;
  /** Department head user ID */
  UF_HEAD?: string;
  /** Department head user details */
  HEAD?: Bitrix24User;
}

/**
 * Parish information derived from Bitrix24 department.
 */
export interface ParishInfo {
  /** Parish ID (Bitrix24 department ID) */
  id: string;
  /** Parish name */
  name: string;
  /** Subdomain for this parish */
  subdomain: string;
  /** Parent diocese ID */
  dioceseId?: string;
  /** Parish priest user ID */
  priestId?: string;
}

// =============================================================================
// SESSION TYPES
// =============================================================================

/**
 * Extended session with Bitrix24 context.
 */
export interface Bitrix24Session {
  /** User ID */
  userId: string;
  /** Bitrix24 user ID */
  bitrixId: string;
  /** Bitrix24 portal domain */
  bitrixDomain: string;
  /** User email */
  email: string;
  /** User display name */
  name: string;
  /** User role in JOL-HUB */
  role: JolHubUserRole;
  /** Parish IDs user has access to */
  parishIds: string[];
  /** Primary parish ID */
  primaryParishId?: string;
  /** OAuth access token */
  accessToken: string;
  /** OAuth refresh token */
  refreshToken: string;
  /** Token expiration timestamp */
  expiresAt: number;
}

/**
 * Authentication audit log entry.
 */
export interface AuthAuditLog {
  /** Timestamp of the event */
  timestamp: Date;
  /** Event type */
  event: 'login_start' | 'login_success' | 'login_failure' | 
         'logout' | 'token_refresh' | 'token_expired' | 
         'parish_access_denied';
  /** User ID if authenticated */
  userId?: string;
  /** User email */
  email?: string;
  /** Parish subdomain context */
  parishSubdomain?: string;
  /** Error message if failure */
  error?: string;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
}

// =============================================================================
// SCOPE TYPES
// =============================================================================

/**
 * Bitrix24 OAuth scopes for JOL-HUB.
 */
export type Bitrix24Scope = 'user' | 'crm' | 'tasks' | 'calendar';

/**
 * Default scopes requested during OAuth.
 */
export const DEFAULT_BITRIX_SCOPES: Bitrix24Scope[] = ['user', 'crm', 'tasks', 'calendar'];

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard Bitrix24 API response wrapper.
 */
export interface Bitrix24ApiResponse<T> {
  /** Response data */
  result: T;
  /** Timing information */
  time?: {
    start: number;
    finish: number;
    duration: number;
    processing: number;
  };
  /** Next page cursor for pagination */
  next?: number;
  /** Total count */
  total?: number;
}

/**
 * Bitrix24 API error response.
 */
export interface Bitrix24ApiError {
  /** Error code */
  error: string;
  /** Error description */
  error_description: string;
}
