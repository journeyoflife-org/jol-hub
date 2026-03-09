'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession as useNextAuthSession } from 'next-auth/react';
import type { Session } from './types';

/**
 * Session context for providing session data throughout the app.
 */
const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionContextValue {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (data?: unknown) => Promise<Session | null>;
}

/**
 * Session provider component.
 */
export function SessionProvider({
  children,
  session: initialSession,
}: {
  children: ReactNode;
  session?: Session | null;
}) {
  const { data, status, update } = useNextAuthSession();

  const value: SessionContextValue = {
    session: (data as Session) ?? initialSession ?? null,
    status,
    update: async () => {
      const result = await update();
      return result as Session | null;
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/**
 * Hook to access the current session.
 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

/**
 * Server-side function to get the current session.
 * Use this in getServerSideProps or API routes.
 */
export async function getSession(): Promise<Session | null> {
  // This is a placeholder - the actual implementation
  // should use getServerSession from next-auth
  return null;
}

/**
 * Get the CSRF token for form submissions.
 */
export async function getCsrfToken(): Promise<string | null> {
  // This is a placeholder - the actual implementation
  // should use getCsrfToken from next-auth
  return null;
}

/**
 * Sign in the user.
 */
export async function signIn(
  provider?: string,
  options?: { callbackUrl?: string; redirect?: boolean }
): Promise<void> {
  // This is a placeholder - the actual implementation
  // should use signIn from next-auth
}

/**
 * Sign out the user.
 */
export async function signOut(options?: { callbackUrl?: string; redirect?: boolean }): Promise<void> {
  // This is a placeholder - the actual implementation
  // should use signOut from next-auth
}
