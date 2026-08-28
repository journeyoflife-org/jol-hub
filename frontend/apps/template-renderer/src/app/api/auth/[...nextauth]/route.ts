/**
 * NextAuth route handler — STEP 10 (jol-auth OIDC).
 *
 * Same-origin auth API (`/api/auth/*`): signin/callback/session/signout.
 * The browser never talks to jol-auth directly for session cookies — this
 * handler owns the confidential-client surface (client secret stays
 * server-side) and the PKCE code exchange.
 *
 * OPEN MODE: when jol-auth is unconfigured the handler answers 503 instead
 * of initializing NextAuth without a secret (which would throw). Public
 * pages are unaffected. Options are built LAZILY for the same reason.
 *
 * Brute-force protection for the callback POST lives in the middleware edge
 * layer (isLoginRateLimited: 5 attempts / 15 min / IP).
 */
import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { buildJolAuthOptions, isAuthConfigured } from '@jol-hub/auth/oidc';

type AuthContext = { params: { nextauth: string[] } };

async function handler(req: NextRequest, ctx: AuthContext) {
  if (!isAuthConfigured()) {
    return NextResponse.json({ error: 'auth-not-configured' }, { status: 503 });
  }
  // Built lazily — buildJolAuthOptions() throws when unconfigured.
  return NextAuth(buildJolAuthOptions())(req as never, ctx as never);
}

export { handler as GET, handler as POST };
