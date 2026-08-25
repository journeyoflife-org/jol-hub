/**
 * AuthSlot — STEP 10 (server gate for the header auth surface).
 *
 * Renders LoginButton/UserMenu ONLY when jol-auth is configured, wrapped in
 * a SessionProvider. In open mode (pilot) it renders nothing — public pages
 * keep their exact STEP-5/6/7 appearance.
 */
import { SessionProvider } from 'next-auth/react';
import { isAuthConfigured } from '@/lib/auth';
import { LoginButton } from './LoginButton';
import { UserMenu } from './UserMenu';

export interface AuthSlotProps {
  basePath: string;
  tenantSlug: string;
}

export function AuthSlot({ basePath, tenantSlug }: AuthSlotProps) {
  if (!isAuthConfigured()) return null;

  return (
    <SessionProvider>
      <div className="flex items-center gap-2">
        <LoginButton />
        <UserMenu basePath={basePath} tenantSlug={tenantSlug} />
      </div>
    </SessionProvider>
  );
}
