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
import { headers } from 'next/headers';
import { isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE, LOCALE_HEADER } from '@jol-hub/i18n/config';
import { resolveCurrentTenant } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

export default function RootPage() {
  const headerLocale = headers().get(LOCALE_HEADER);
  const locale = isSupportedLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const tenant = resolveCurrentTenant();
  if (tenant) {
    redirect(`/${locale}/${tenant.tenantId}`);
  }
  notFound();
}
