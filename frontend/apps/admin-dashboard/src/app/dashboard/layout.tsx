// =============================================================================
// Dashboard Layout - Route Group (with sidebar)
// 4-tier hierarchy provider with sidebar and header
// SOC2 CC6.1: Security controls and role-based access
// =============================================================================

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { CountryGuard } from '@/components/layout/CountryGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRoles={['admin', 'super_admin', 'support', 'country_admin', 'diocese_admin', 'parish_admin']}>
      <CountryGuard>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-auto bg-muted/30">
              {children}
            </main>
          </div>
        </div>
      </CountryGuard>
    </AuthGuard>
  );
}
