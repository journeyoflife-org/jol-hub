// =============================================================================
// Auth Configuration
// =============================================================================

export { authOptions, type Bitrix24Profile } from './auth-options';

// =============================================================================
// Bitrix24 OAuth Provider
// =============================================================================

export {
  Bitrix24Provider,
  generatePKCEPair,
  generateOAuthState,
  parseOAuthState,
  refreshBitrixToken,
  type Bitrix24ProviderOptions,
} from './providers/bitrix24';

// =============================================================================
// Session Management
// =============================================================================

export {
  getSession,
  getCsrfToken,
  signIn,
  signOut,
  useSession,
} from './session';

// =============================================================================
// React Hooks
// =============================================================================

export {
  useBitrixAuth,
  useParishContext,
  useParishAccess,
  type BitrixAuthState,
  type Bitrix24UserSession,
  type LoginOptions,
  type LogoutOptions,
} from './hooks/useBitrixAuth';

// =============================================================================
// Middleware
// =============================================================================

export {
  createParishGuardMiddleware,
  parishGuardMiddleware,
  extractSubdomain,
  matchesPath,
  checkParishAccess,
  type ParishGuardConfig,
} from './middleware/parish-guard';

// =============================================================================
// Types
// =============================================================================

export { type Session, type User, type UserRole } from './types';

export {
  // User types
  type Bitrix24User,
  type JolHubUserRole,
  type ParishInfo,
  type Bitrix24Session,
  type AuthAuditLog,
  
  // OAuth types
  type Bitrix24TokenResponse,
  type Bitrix24OAuthError,
  type PKCEPair,
  type OAuthState,
  
  // Scope types
  type Bitrix24Scope,
  DEFAULT_BITRIX_SCOPES,
  
  // Role mapping
  BITRIX_ROLE_MAPPING,
  mapBitrixRole,
  
  // API types
  type Bitrix24ApiResponse,
  type Bitrix24ApiError,
} from './types/bitrix';
