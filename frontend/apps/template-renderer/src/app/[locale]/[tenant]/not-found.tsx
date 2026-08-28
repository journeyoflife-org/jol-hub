/**
 * Tenant-scoped 404 — STEP 6.
 *
 * Rendered when a KNOWN tenant's page is not found (a page throws
 * `notFound()`). It sits inside `app/[locale]/[tenant]/layout.tsx`, so the
 * tenant's header/footer chrome (branding) is already present — this supplies
 * the body: a helpful, locale-aware notice plus a link back to the tenant
 * home.
 *
 * SECURITY: unknown tenants never reach this file — the middleware rewrites
 * them to `/404-tenant-not-found`, and an unknown tenant thrown in the layout
 * bubbles to the generic (tenant-free) root 404. So branding here is only ever
 * shown for a resolved tenant (no enumeration). Defensively, if the tenant is
 * somehow unresolved the copy stays generic.
 */
import { headers } from 'next/headers';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE, LOCALE_HEADER } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n';
import { resolveCurrentTenant } from '@/lib/tenant-resolver';
import { pickLocalized } from '@/lib/i18n-helpers';

export default function TenantNotFound() {
  const headerLocale = headers().get(LOCALE_HEADER);
  const locale: SupportedLocale = isSupportedLocale(headerLocale)
    ? headerLocale
    : DEFAULT_LOCALE;
  const messages = getMessages(locale);

  const resolved = resolveCurrentTenant();
  const tenantName = resolved ? pickLocalized(resolved.tenant.name, locale) : undefined;
  const homeHref = resolved ? `/${locale}/${resolved.tenantId}` : '/';

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center space-y-4">
        <p className="text-6xl font-heading font-bold text-primary">404</p>
        {tenantName && <p className="text-sm uppercase tracking-wide text-gray-500">{tenantName}</p>}
        <h1 className="text-2xl font-heading font-bold">
          {translate(messages, 'errors.notFoundTitle')}
        </h1>
        <p className="text-gray-600">{translate(messages, 'errors.notFoundBody')}</p>
        <a href={homeHref} className="inline-block text-primary underline focus-ring rounded">
          {translate(messages, 'navigation.home')}
        </a>
      </div>
    </main>
  );
}
