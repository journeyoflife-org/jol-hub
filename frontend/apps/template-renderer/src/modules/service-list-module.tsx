/**
 * ServiceListModule — services overview (STEP 6 module).
 *
 * Async server module: fetches services (RLS-scoped) and renders cards.
 * Booking CTAs are a NORMAL/VIP entitlement — hidden for CHEAP tenants
 * (commercial gating, per the package model).
 */
import { ServiceCard, SectionHeader } from '@jol-hub/ui/components/composite';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { getServices } from '@/lib/collections';
import { themeVerticalFor } from '@/lib/template-registry';
import { tenantThemeFor, type ModuleProps } from './types';

export default async function ServiceListModule({ tenant, locale, content, basePath }: ModuleProps) {
  const items = await getServices(tenant);
  if (items.length === 0) return null;

  const limit = typeof content.limit === 'number' && content.limit > 0 ? content.limit : 6;
  const shown = items.slice(0, limit);

  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale, { vertical: themeVerticalFor(tenant.vertical) });

  // Commercial entitlement: booking is NORMAL/VIP only.
  const bookingAllowed = tenant.packageTier !== 'cheap';

  return (
    <div className="space-y-6">
      <SectionHeader
        title={translate(messages, 'collections.servicesTitle')}
        headingLevel={2}
        action={{ label: translate(messages, 'common.viewAll'), href: `${basePath}/services` }}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((item) => (
          <ServiceCard
            key={item.slug}
            title={item.title}
            description={item.description}
            price={item.price}
            duration={item.duration}
            bookingCta={
              bookingAllowed && item.bookable !== false
                ? {
                    label: translate(messages, 'commerce.bookingCta'),
                    href: `${basePath}/services/${item.slug}`,
                  }
                : undefined
            }
            tenant={tenantThemeFor(tenant)}
          />
        ))}
      </div>
    </div>
  );
}
