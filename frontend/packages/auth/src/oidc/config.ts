/**
 * jol-auth OIDC configuration + discovery — STEP 10 (SERVER-ONLY).
 *
 * Never import from client components. The browser-facing surface is the
 * same-origin NextAuth API; issuer URLs and client secrets stay server-side.
 *
 * PILOT REALITY: jol-auth is a satellite repo. Until it (and the env config)
 * exist, {@link isAuthConfigured} is false and the renderer runs in OPEN
 * MODE — public pages unaffected, protected pages show a quiet
 * "authentication not enabled" notice. This is also the documented emergency
 * rollback (spec: "disable auth requirement in middleware (open mode)").
 *
 * SECURITY: no secrets are ever logged; discovery documents are cached with
 * a TTL (key rotation support — RS256 JWKs refresh via next-auth's JWKS
 * handling on `kid` miss).
 */
import { TENANT_ROLES_CLAIM, MFA_ENROLLED_CLAIM } from './types';

/** OIDC discovery document subset we consume. */
export interface OidcDiscovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
}

/** Discovery cache TTL — balance rotation freshness vs. IdP load. */
const DISCOVERY_TTL_MS = 60 * 60 * 1000; // 1h

interface CachedDiscovery {
  document: OidcDiscovery;
  fetchedAt: number;
}

const discoveryCache = new Map<string, CachedDiscovery>();

/** jol-auth env surface. */
export function jolAuthEnv() {
  return {
    issuer: process.env.JOL_AUTH_ISSUER ?? '',
    clientId: process.env.JOL_AUTH_CLIENT_ID ?? '',
    clientSecret: process.env.JOL_AUTH_CLIENT_SECRET ?? '',
    /** Session JWT signing secret (next-auth). */
    nextauthSecret: process.env.NEXTAUTH_SECRET ?? '',
  };
}

/**
 * True when the OIDC stack is fully configured. Requires issuer, client id
 * and the session secret. The client secret is OPTIONAL at the protocol
 * level (OAuth 2.1 public client + PKCE) but jol-auth issues one for
 * confidential web clients; either mode passes this gate.
 */
export function isAuthConfigured(): boolean {
  const { issuer, clientId, nextauthSecret } = jolAuthEnv();
  return issuer.length > 0 && clientId.length > 0 && nextauthSecret.length > 0;
}

/**
 * Fetch (and TTL-cache) the issuer's discovery document. Throws on network /
 * shape failures — callers must treat discovery failure as "auth unavailable"
 * (never partially initialize).
 */
export async function discoverIssuer(issuer?: string): Promise<OidcDiscovery> {
  const base = (issuer ?? jolAuthEnv().issuer).replace(/\/+$/, '');
  if (!base) throw new Error('JOL_AUTH_ISSUER not configured');

  const cached = discoveryCache.get(base);
  if (cached && Date.now() - cached.fetchedAt < DISCOVERY_TTL_MS) {
    return cached.document;
  }

  const response = await fetch(`${base}/.well-known/openid-configuration`, {
    headers: { Accept: 'application/json' },
    // Never cache at the HTTP layer beyond our own TTL.
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`OIDC discovery failed (HTTP ${response.status})`);
  }

  const document = (await response.json()) as Partial<OidcDiscovery>;
  if (
    typeof document.issuer !== 'string' ||
    typeof document.authorization_endpoint !== 'string' ||
    typeof document.token_endpoint !== 'string' ||
    typeof document.jwks_uri !== 'string'
  ) {
    throw new Error('OIDC discovery document missing required endpoints');
  }

  const full: OidcDiscovery = {
    issuer: document.issuer,
    authorization_endpoint: document.authorization_endpoint,
    token_endpoint: document.token_endpoint,
    jwks_uri: document.jwks_uri,
    end_session_endpoint: document.end_session_endpoint,
  };
  discoveryCache.set(base, { document: full, fetchedAt: Date.now() });
  return full;
}

/** Test/ops hook. */
export function resetDiscoveryCache(): void {
  discoveryCache.clear();
}

/** Claim names (re-exported for the options factory). */
export const CLAIMS = { tenantRoles: TENANT_ROLES_CLAIM, mfaEnrolled: MFA_ENROLLED_CLAIM };
