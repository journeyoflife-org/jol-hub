/**
 * Admin area layout — STEP 10 route guard (RBAC, defense in depth).
 *
 * Middleware enforces AUTHENTICATION for /[locale]/[tenant]/admin/*; this
 * layout enforces the ROLE requirement: any tenant grant (viewer or higher)
 * or a platform superadmin enters; everyone else lands on the generic 403.
 * In open mode (pilot) it passes through — the page renders the quiet
 * "authentication not enabled" notice.
 */
import { redirect } from 'next/navigation';
import { hasRole } from '@jol-hub/auth/oidc';
import { getAuthSession, isAuthConfigured } from '@/lib/auth';
import { resolveTenantRoute } from '@/lib/route-dispatch';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string; tenant: string };
}) {
  const { tenant } = resolveTenantRoute(params);

  if (isAuthConfigured()) {
    const session = await getAuthSession();
    if (!session) {
      // Double-check (middleware normally catches this) — never render the
      // admin surface without a verified session.
      redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`/${params.locale}/${params.tenant}/admin`)}`);
    }
    if (!hasRole(session, tenant.slug, 'viewer')) {
      // Authenticated but no grant for THIS tenant — tenant-scoped RBAC.
      redirect('/403-forbidden');
    }
  }

  return <>{children}</>;
}
