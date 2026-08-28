/**
 * UserMenu — STEP 10.
 *
 * Authenticated dropdown: identity, the user's role badge for the CURRENT
 * tenant (tenant-scoped RBAC — roles differ per tenant), profile link,
 * admin area (any tenant grant), settings (admins only) and logout.
 *
 * RBAC surface follows the permission matrix: links are role-gated, and the
 * server re-checks every guard (defense in depth — hiding a link is UX, not
 * security).
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth, useHasRole, useTenantRole } from '@jol-hub/auth/oidc/hooks';
import { useTranslations } from '@jol-hub/i18n/use-translations';

export interface UserMenuProps {
  /** Tenant URL prefix, e.g. `/lt/siauliai-church`. */
  basePath: string;
  /** Current tenant slug — roles are tenant-scoped. */
  tenantSlug: string;
}

export function UserMenu({ basePath, tenantSlug }: UserMenuProps) {
  const t = useTranslations('auth');
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const role = useTenantRole(tenantSlug);
  const isAdmin = useHasRole(tenantSlug, 'admin');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape (accessible dropdown discipline).
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isLoading || !isAuthenticated || !user) return null;

  const itemClass =
    'block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="focus-ring inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
      >
        <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-neutral-50">
          {(user.name ?? user.email).charAt(0).toUpperCase()}
        </span>
        <span className="max-w-28 truncate">{user.name ?? user.email}</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-56 rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="border-b border-neutral-200 px-3 py-2 dark:border-neutral-700">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {user.name ?? user.email}
            </p>
            <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
            {role ? (
              <span className="mt-1 inline-block rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {t(`role_${role}`)}
              </span>
            ) : (
              <span className="mt-1 inline-block text-xs text-neutral-400 dark:text-neutral-500">
                {t('noTenantRole')}
              </span>
            )}
          </div>

          <a role="menuitem" href={`${basePath}/profile`} className={itemClass}>
            {t('profile')}
          </a>
          {role ? (
            <a role="menuitem" href={`${basePath}/admin`} className={itemClass}>
              {t('adminDashboard')}
            </a>
          ) : null}
          {isAdmin ? (
            <a role="menuitem" href={`${basePath}/admin#settings`} className={itemClass}>
              {t('settings')}
            </a>
          ) : null}

          <div className="border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => void logout(basePath)}
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
