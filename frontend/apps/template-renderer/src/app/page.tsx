/**
 * Root route: resolves the tenant from the request (X-Tenant header or
 * subdomain, via `next/headers`) and dispatches to `/<tenant>`.
 *
 * The middleware normally performs this rewrite already; this component is
 * the safety net for requests that reach the route layer unwritten.
 *
 * SECURITY: when no tenant resolves we render a bare 404 — no tenant list,
 * no hints about valid slugs (GDPR Art. 9 / SOC 2 CC6.1).
 */
import { notFound, redirect } from 'next/navigation';
import { resolveCurrentTenant } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  const tenant = resolveCurrentTenant();
  if (tenant) {
    redirect(`/${tenant.tenantId}`);
  }
  notFound();
}
