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
import { getMessages, translate, isSupportedLocale } from '@journeyoflife-org/i18n';
import { DEFAULT_LOCALE, LOCALE_HEADER } from '@journeyoflife-org/i18n/config';
import type { SupportedLocale } from '@journeyoflife-org/i18n';
import { resolveCurrentTenant } from '@/lib/tenant-resolver';
import { pickLocalized } from '@/lib/i18n-helpers';

export default function TenantNotFound() {
  const headerLocale = headers().get(LOCALE_HEADER);
  const locale: SupportedLocale = isSupportedLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const messages = getMessages(locale);

  const resolved = resolveCurrentTenant();
  const tenantName = resolved ? pickLocalized(resolved.tenant.name, locale) : undefined;
  const homeHref = resolved ? `/${locale}/${resolved.tenantId}` : '/';

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="max-w-md space-y-4 text-center">
        <p className="font-heading text-primary text-6xl font-bold">404</p>
        {tenantName && (
          <p className="text-sm uppercase tracking-wide text-gray-500">{tenantName}</p>
        )}
        <h1 className="font-heading text-2xl font-bold">
          {translate(messages, 'errors.notFoundTitle')}
        </h1>
        <p className="text-gray-600">{translate(messages, 'errors.notFoundBody')}</p>
        <a href={homeHref} className="text-primary focus-ring inline-block rounded underline">
          {translate(messages, 'navigation.home')}
        </a>
      </div>
    </main>
  );
}
