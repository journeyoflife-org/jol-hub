'use client';

/**
 * UserMenu — dropdown menu showing the current user's avatar and name
 * with logout action.
 *
 * Mirrors the Django User model fields:
 *   • full_name
 *   • avatar (URL or null)
 *   • email
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRequiredUser } from '@/hooks/useUser';

export function UserMenu() {
  const user = useRequiredUser();
  const { logout, isAuthenticating } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
            {initials}
          </div>
        )}
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isAuthenticating}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 first:rounded-t-xl last:rounded-b-xl hover:bg-gray-50 disabled:opacity-50"
            >
              {isAuthenticating ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
