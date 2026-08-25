/**
 * LoginButton — STEP 10.
 *
 * Shows "Sign in" for unauthenticated visitors and starts the jol-auth OIDC
 * authorization-code + PKCE flow via the SAME-ORIGIN NextAuth API (the
 * browser never holds tokens). Renders nothing when authenticated
 * ({@link UserMenu} takes over) or while the session is resolving.
 */
'use client';

import { useAuth } from '@jol-hub/auth/oidc/hooks';
import { useTranslations } from '@jol-hub/i18n/use-translations';

export function LoginButton() {
  const t = useTranslations('auth');
  const { isAuthenticated, isLoading, login } = useAuth();

  // While resolving, render nothing (avoids a sign-in flash for logged-in
  // users). Generic surface — no session detail leaks.
  if (isLoading || isAuthenticated) return null;

  return (
    <button
      type="button"
      onClick={() => void login(typeof window !== 'undefined' ? window.location.pathname : undefined)}
      className="focus-ring inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
    >
      {t('signIn')}
    </button>
  );
}
