import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/index';
import type { Profile } from 'next-auth';
import type {
  Bitrix24User,
  Bitrix24TokenResponse,
  Bitrix24ApiResponse,
  Bitrix24Scope,
  PKCEPair,
  OAuthState,
  JolHubUserRole,
} from '../types/bitrix';
import { mapBitrixRole, DEFAULT_BITRIX_SCOPES } from '../types/bitrix';

// =============================================================================
// PKCE UTILITIES
// =============================================================================

/**
 * Generates a cryptographically random string for PKCE code verifier.
 * @param length - Length of the verifier (43-128 characters)
 * @returns Random string using unreserved characters per RFC 7636
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = new Uint8Array(length);
  
  // Use crypto.getRandomValues for secure randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(values);
  } else {
    // Fallback for non-browser environments (Node.js)
    const nodeCrypto = require('crypto');
    const randomBytes = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      values[i] = randomBytes[i];
    }
  }
  
  return Array.from(values)
    .map((v) => charset[v % charset.length])
    .join('');
}

/**
 * Generates SHA256 hash and encodes as base64url.
 * Uses Web Crypto API in browser, Node.js crypto in server.
 */
async function sha256Base64Url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  
  let hashBuffer: ArrayBuffer;
  
  // Use Web Crypto API if available (browser)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    hashBuffer = await crypto.subtle.digest('SHA-256', data);
  } else {
    // Fallback for Node.js environment
    const nodeCrypto = require('crypto');
    hashBuffer = nodeCrypto.createHash('sha256').update(plain).digest();
  }
  
  // Convert to base64url (RFC 7636 Appendix A)
  const hashArray = new Uint8Array(hashBuffer);
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates PKCE code verifier and challenge pair.
 * Uses 128-character verifier for maximum security per RFC 7636.
 * 
 * @returns PKCE pair with verifier, challenge, and method
 */
export async function generatePKCEPair(): Promise<PKCEPair> {
  // Generate random code verifier (128 characters for maximum security)
  // RFC 7636 allows 43-128 characters, we use 128 for paranoid compliance
  const codeVerifier = generateRandomString(128);
  
  // Generate code challenge using S256 method (mandatory for Bitrix24)
  const codeChallenge = await sha256Base64Url(codeVerifier);
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Generates OAuth state parameter with CSRF protection.
 */
export function generateOAuthState(redirectUri?: string, parishSubdomain?: string): string {
  const state: OAuthState = {
    nonce: generateRandomString(32),
    timestamp: Date.now(),
    redirectUri,
    parishSubdomain,
  };
  
  return Buffer.from(JSON.stringify(state)).toString('base64url');
}

/**
 * Parses and validates OAuth state parameter.
 */
export function parseOAuthState(stateString: string): OAuthState | null {
  try {
    const state = JSON.parse(
      Buffer.from(stateString, 'base64url').toString('utf-8')
    ) as OAuthState;
    
    // Validate state is not too old (5 minutes max)
    const maxAge = 5 * 60 * 1000;
    if (Date.now() - state.timestamp > maxAge) {
      console.error('[AUTH] OAuth state expired');
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('[AUTH] Failed to parse OAuth state:', error);
    return null;
  }
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

/**
 * Logs authentication events for audit purposes.
 */
function logAuthEvent(
  event: 'login_start' | 'login_success' | 'login_failure' | 'logout' | 'token_refresh',
  data: {
    userId?: string;
    email?: string;
    parishSubdomain?: string;
    error?: string;
  } = {}
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...data,
  };
  
  // Log to console for audit (in production, send to logging service)
  if (event === 'login_failure') {
    console.error('[AUTH AUDIT]', JSON.stringify(logEntry));
  } else {
    console.log('[AUTH AUDIT]', JSON.stringify(logEntry));
  }
}

// =============================================================================
// BITRIX24 PROVIDER
// =============================================================================

/**
 * Bitrix24 OAuth2 provider configuration options.
 */
export interface Bitrix24ProviderOptions extends OAuthUserConfig<Bitrix24User> {
  /**
   * The Bitrix24 domain for authentication.
   * Example: https://your-company.bitrix24.com
   */
  authDomain?: string;
  
  /**
   * OAuth scopes to request.
   * Default: ['user', 'crm', 'tasks', 'calendar']
   */
  scopes?: Bitrix24Scope[];
  
  /**
   * Enable PKCE for enhanced security.
   * Default: true (recommended)
   */
  enablePKCE?: boolean;
  
  /**
   * Custom role mapping function.
   */
  roleMapper?: (workPosition: string | undefined) => JolHubUserRole;
}

/**
 * Creates a Bitrix24 OAuth2 provider with PKCE support for NextAuth.js.
 * 
 * This provider implements the full OAuth2 Authorization Code flow with
 * PKCE (Proof Key for Code Exchange) for self-hosted Bitrix24 installations.
 * 
 * @example
 * ```typescript
 * // In your NextAuth configuration
 * import { Bitrix24Provider } from '@jol-hub/auth';
 * 
 * export const authOptions = {
 *   providers: [
 *     Bitrix24Provider({
 *       clientId: process.env.BITRIX_CLIENT_ID,
 *       clientSecret: process.env.BITRIX_CLIENT_SECRET, // Only for server-side
 *       authDomain: process.env.BITRIX_AUTH_URL,
 *     }),
 *   ],
 * };
 * ```
 * 
 * @see https://dev.1c-bitrix.ru/learning/course/index.php?COURSE_ID=43&LESSON_ID=2385
 */
export function Bitrix24Provider(
  options: Partial<Bitrix24ProviderOptions> = {}
): OAuthConfig<Bitrix24User> {
  const {
    authDomain = process.env.BITRIX_AUTH_URL ?? '',
    scopes = DEFAULT_BITRIX_SCOPES,
    enablePKCE = true,
    roleMapper = mapBitrixRole,
    ...restOptions
  } = options;

  // Validate required configuration
  if (!authDomain) {
    console.error('[AUTH] BITRIX_AUTH_URL is not configured');
  }

  const normalizedDomain = authDomain.replace(/\/$/, '');

  return {
    id: 'bitrix24',
    name: 'Bitrix24',
    type: 'oauth',
    
    // Authorization endpoint configuration
    authorization: {
      url: `${normalizedDomain}/oauth/authorize/`,
      params: {
        response_type: 'code',
        scope: scopes.join(','),
      },
    },
    
    // Token endpoint configuration
    token: {
      url: `${normalizedDomain}/oauth/token/`,
    },
    
    // User info endpoint configuration
    userinfo: {
      url: `${normalizedDomain}/rest/user.current`,
      async request({ tokens }: { tokens: { access_token?: string } }): Promise<Profile> {
        if (!tokens.access_token) {
          throw new Error('No access token available');
        }
        const url = `${normalizedDomain}/rest/user.current?auth=${tokens.access_token}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          logAuthEvent('login_failure', { error: `Failed to fetch user: ${errorText}` });
          throw new Error('Failed to fetch user info from Bitrix24');
        }

        const data: Bitrix24ApiResponse<Bitrix24User> = await response.json();
        return data.result as unknown as Profile;
      },
    },
    
    // Profile transformation
    profile(profile: Bitrix24User) {
      const role = roleMapper(profile.WORK_POSITION);
      const parishIds = profile.UF_DEPARTMENT?.map(String) ?? [];
      
      return {
        id: profile.ID,
        name: `${profile.NAME} ${profile.LAST_NAME}`.trim(),
        email: profile.EMAIL,
        image: profile.PERSONAL_PHOTO,
        // Custom JOL-HUB fields
        bitrixId: profile.ID,
        bitrixDomain: normalizedDomain,
        role,
        parishIds,
        primaryParishId: parishIds[0],
        workPosition: profile.WORK_POSITION,
      };
    },
    
    // Styling for UI
    style: {
      text: '#fff',
      bg: '#2FC6F6',
      logo: 'https://www.bitrix24.com/favicon.ico',
    },
    
    // Merge additional options
    ...restOptions,
  };
}

// =============================================================================
// TOKEN REFRESH
// =============================================================================

/**
 * Refreshes an expired Bitrix24 access token.
 * 
 * @param refreshToken - The refresh token from the original OAuth flow
 * @param authDomain - The Bitrix24 portal domain
 * @param clientId - OAuth client ID
 * @param clientSecret - OAuth client secret (required for refresh)
 */
export async function refreshBitrixToken(
  refreshToken: string,
  authDomain: string,
  clientId: string,
  clientSecret: string
): Promise<Bitrix24TokenResponse> {
  const url = `${authDomain}/oauth/token/`;
  
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  
  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    logAuthEvent('login_failure', { error: 'Token refresh failed' });
    throw new Error(data.error_description ?? 'Token refresh failed');
  }
  
  logAuthEvent('token_refresh');
  return data as Bitrix24TokenResponse;
}

// =============================================================================
// EXPORTS
// =============================================================================

// Bitrix24User and Bitrix24ProviderOptions are already exported via 'export interface' above
