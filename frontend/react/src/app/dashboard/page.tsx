'use client';

/**
 * /dashboard — protected landing page after login.
 *
 * Demonstrates:
 *   • AuthGuard wrapper for route-level protection
 *   • useRequiredUser for guaranteed non-null user
 *   • UserMenu component for logout
 */

import { AuthGuard } from '@/components/AuthGuard';
import { UserMenu } from '@/components/UserMenu';
import { useRequiredUser } from '@/hooks/useUser';

function DashboardContent() {
  const user = useRequiredUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold text-gray-900">JOL-HUB Dashboard</h1>
          <UserMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Welcome, {user.full_name}</h2>
          <p className="mt-2 text-sm text-gray-600">
            This is your personal dashboard. From here you can manage your organizations, content,
            donations, and account settings.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Organizations" value="0" />
            <Card title="Websites" value="0" />
            <Card title="Pages" value="0" />
            <Card title="Donations" value="€0.00" />
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">
            Quick actions
          </h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton>Create organization</ActionButton>
            <ActionButton>Manage content</ActionButton>
            <ActionButton>View analytics</ActionButton>
            <ActionButton variant="secondary">Account settings</ActionButton>
          </div>
        </div>
      </main>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ActionButton({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  const base =
    'inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors';
  const styles =
    variant === 'primary'
      ? 'bg-blue-700 text-white hover:bg-blue-800'
      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
  return <button className={`${base} ${styles}`}>{children}</button>;
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
