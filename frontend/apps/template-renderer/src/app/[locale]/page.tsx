/**
 * `/{locale}` root — safety net for requests that reach the route layer
 * without the tenant rewrite (middleware normally handles this).
 *
 * With a resolved tenant (X-Tenant header / subdomain) → redirect to the
 * tenant home under this locale. Without one → bare 404 (no enumeration).
 */
import { notFound, redirect } from 'next/navigation';
import { isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n';
import { resolveCurrentTenant } from '@/lib/tenant-resolver';

export const dynamic = 'force-dynamic';

export default function LocaleRootPage({ params }: { params: { locale: string } }) {
  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;

  const tenant = resolveCurrentTenant();
  if (tenant) {
    redirect(`/${locale}/${tenant.tenantId}`);
  }
  notFound();
}
