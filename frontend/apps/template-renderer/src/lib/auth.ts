/**
 * Server-side auth helpers — STEP 10.
 *
 * SERVER-ONLY (never import from client components — use
 * `@jol-hub/auth/oidc/hooks` there). Reads the jol-auth session via
 * next-auth's `getServerSession` and maps it to the renderer's
 * {@link AuthSession} (identity + tenant roles; tokens never appear).
 *
 * OPEN MODE: when jol-auth is not configured (pilot) every helper returns
 * null/false and pages render the quiet "authentication not enabled" state —
 * public pages stay fully functional.
 */
import { getServerSession } from 'next-auth';
import {
  buildJolAuthOptions,
  isAuthConfigured as oidcConfigured,
  type AuthSession,
} from '@jol-hub/auth/oidc';

/** True when the OIDC stack (jol-auth) is configured. */
export function isAuthConfigured(): boolean {
  return oidcConfigured();
}

/**
 * The current jol-auth session, or null (unauthenticated / open mode).
 * Safe to call from any server component or route handler.
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  if (!isAuthConfigured()) return null;

  const raw = await getServerSession(buildJolAuthOptions());
  if (!raw?.user) return null;

  const user = raw.user as {
    id?: string;
    email?: string;
    name?: string | null;
    roles?: AuthSession['user']['roles'];
    platformRole?: AuthSession['user']['platformRole'];
    mfaEnrolled?: boolean;
  };
  const session: AuthSession = {
    user: {
      sub: user.id ?? '',
      email: user.email ?? '',
      name: user.name ?? undefined,
      roles: user.roles ?? [],
      platformRole: user.platformRole,
      mfaEnrolled: user.mfaEnrolled === true,
    },
    expiresAt: typeof raw.expires === 'string' ? new Date(raw.expires).getTime() : 0,
  };

  // Expired session → treat as unauthenticated (defence in depth; next-auth
  // normally handles this, but guards must not trust a single layer).
  if (session.expiresAt > 0 && session.expiresAt < Date.now()) return null;

  return session;
}
