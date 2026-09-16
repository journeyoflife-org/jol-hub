/**
 * jol-auth NextAuth options factory — STEP 10 (SERVER-ONLY).
 *
 * Authorization Code flow with PKCE against jol-auth (OAuth 2.1 / OIDC).
 *
 * SECURITY PROPERTIES (OWASP ASVS L2 / SOC 2 CC6.1 / GDPR Art. 32):
 *   - PKCE + state on every authorization (checks: ['pkce', 'state']).
 *   - Session cookie: httpOnly + SameSite=Strict + Secure (production).
 *     Tokens are therefore NEVER readable by JS (no localStorage — XSS-safe).
 *   - Short access-token lifetime (15 min) with REFRESH-TOKEN ROTATION:
 *     a refreshed token replaces the previous one; reuse would be rejected
 *     by the IdP.
 *   - Idle timeout: session maxAge 30 min, sliding via updateAge.
 *   - The CLIENT session exposes identity + tenant roles ONLY — access and
 *     refresh tokens never leave the server-side JWT.
 *   - RS256: upstream ID-token signatures are validated by next-auth against
 *     the issuer JWKS; on key rotation (`kid` miss) next-auth re-fetches.
 *   - NO token material is ever logged.
 */
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { CLAIMS, jolAuthEnv } from './config';
import { parseTenantRoles } from './rbac';
import type { PlatformRole, TenantRole } from './types';

/** Access-token lifetime target (jol-auth issues 15-min tokens). */
const ACCESS_TOKEN_LIFETIME_MS = 15 * 60 * 1000;
/** Session idle timeout (sliding). */
const SESSION_MAX_AGE_S = 30 * 60;
/** Refresh the sliding session at most every 5 min. */
const SESSION_UPDATE_AGE_S = 5 * 60;

/** Server-side JWT payload shape (never serialized to the client). */
export interface JolAuthJwt {
  sub?: string;
  email?: string;
  name?: string;
  roles?: TenantRole[];
  platformRole?: PlatformRole;
  mfaEnrolled?: boolean;
  accessToken?: string;
  refreshToken?: string;
  /** Epoch ms when the upstream access token expires. */
  accessTokenExpires?: number;
  /** Set when refresh fails — the session must re-authenticate. */
  error?: 'RefreshTokenError';
}

/** Map the OIDC profile + claims into our user shape (claims are untrusted). */
function mapProfile(profile: Record<string, unknown>): {
  id: string;
  email: string;
  name?: string;
  roles: TenantRole[];
  platformRole?: PlatformRole;
  mfaEnrolled: boolean;
} {
  const platform = profile['jol:platform_role'];
  return {
    id: String(profile.sub ?? ''),
    email: typeof profile.email === 'string' ? profile.email : '',
    name: typeof profile.name === 'string' ? profile.name : undefined,
    roles: parseTenantRoles(profile[CLAIMS.tenantRoles]),
    platformRole: platform === 'superadmin' || platform === 'support' ? platform : undefined,
    mfaEnrolled: profile[CLAIMS.mfaEnrolled] === true,
  };
}

/**
 * Build the NextAuth options for jol-auth. Throws when unconfigured — the
 * route handler gates on `isAuthConfigured()` first (open mode otherwise).
 */
export function buildJolAuthOptions(): NextAuthOptions {
  const { issuer, clientId, clientSecret } = jolAuthEnv();
  if (!issuer || !clientId) {
    throw new Error('jol-auth is not configured (JOL_AUTH_ISSUER / JOL_AUTH_CLIENT_ID)');
  }

  return {
    providers: [
      {
        id: 'jol-auth',
        name: 'JOL Auth',
        type: 'oauth',
        wellKnown: `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`,
        authorization: {
          params: {
            // offline_access → refresh token for silent rotation.
            scope: 'openid email profile offline_access',
          },
        },
        // OAuth 2.1: PKCE mandatory; state for CSRF.
        checks: ['pkce', 'state'],
        idToken: true,
        clientId,
        // Confidential client when issued; PKCE-only public client otherwise.
        ...(clientSecret ? { clientSecret } : {}),
        profile: mapProfile,
      },
    ],

    session: {
      strategy: 'jwt',
      maxAge: SESSION_MAX_AGE_S, // 30 min idle timeout
      updateAge: SESSION_UPDATE_AGE_S, // sliding renewal cadence
    },

    // httpOnly + SameSite=Strict + Secure. JS can never read these.
    cookies: {
      sessionToken: {
        name: 'jol.session-token',
        options: {
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        },
      },
    },

    callbacks: {
      async jwt({ token, account, profile }): Promise<JWT> {
        const current = token as JWT & JolAuthJwt;

        // Initial sign-in: capture identity + (server-only) tokens.
        if (account && profile) {
          const mapped = mapProfile(profile as Record<string, unknown>);
          return {
            ...current,
            sub: mapped.id,
            email: mapped.email,
            name: mapped.name,
            roles: mapped.roles,
            platformRole: mapped.platformRole,
            mfaEnrolled: mapped.mfaEnrolled,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            accessTokenExpires: account.expires_at
              ? account.expires_at * 1000
              : Date.now() + ACCESS_TOKEN_LIFETIME_MS,
            error: undefined,
          } as JWT;
        }

        // Still valid → pass through.
        if (current.accessTokenExpires && Date.now() < current.accessTokenExpires) {
          return token;
        }

        // Expired → rotate the refresh token (server-only call).
        return rotateRefreshToken(current);
      },

      // CLIENT SURFACE: identity + roles ONLY. Tokens never cross this line.
      async session({ session, token }) {
        const jwt = token as JWT & JolAuthJwt;
        return {
          ...session,
          expiresAt: jwt.accessTokenExpires ?? 0,
          error: jwt.error,
          user: {
            ...session.user,
            id: jwt.sub ?? '',
            email: jwt.email ?? '',
            name: jwt.name,
            roles: jwt.roles ?? [],
            platformRole: jwt.platformRole,
            mfaEnrolled: jwt.mfaEnrolled === true,
          },
        } as typeof session;
      },
    },

    // NOTE (brute force): login-attempt rate limiting (5/15min/IP) is
    // enforced at the middleware edge layer, which sees every callback POST.
    debug: false, // never enable in production; debug output can leak flows
  };
}

/**
 * Refresh-token rotation against the IdP token endpoint. On failure the
 * session is flagged so the next guard forces re-authentication. Tokens are
 * never logged — failures are counted, not described.
 */
async function rotateRefreshToken(token: JWT & JolAuthJwt): Promise<JWT> {
  const { issuer, clientId, clientSecret } = jolAuthEnv();
  try {
    if (!token.refreshToken) throw new Error('missing refresh token');

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
      client_id: clientId,
    });
    if (clientSecret) body.set('client_secret', clientSecret);

    const response = await fetch(`${issuer.replace(/\/+$/, '')}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`refresh failed (${response.status})`);

    const refreshed = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!refreshed.access_token) throw new Error('refresh response missing access_token');

    return {
      ...token,
      accessToken: refreshed.access_token,
      // ROTATION: prefer the newly issued refresh token; the old one is void.
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 900) * 1000,
      error: undefined,
    } as JWT;
  } catch {
    // Generic failure — no token detail escapes. Force re-authentication.
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      accessTokenExpires: 0,
      error: 'RefreshTokenError',
    } as JWT;
  }
}
