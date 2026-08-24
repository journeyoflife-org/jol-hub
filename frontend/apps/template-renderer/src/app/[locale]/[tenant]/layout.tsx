/**
 * Tenant chrome + locale context (STEP 4).
 *
 * - Resolves the fixture (closed lookup → bare 404 on unknown tenant).
 * - Builds the effective message catalog: common(locale) ← vertical ← tenant.
 * - Wraps everything in TranslationProvider so all shared components read
 *   translations from context — no hard-coded UI strings anywhere.
 * - Locale switcher lives in the header; switching is a client-side
 *   navigation (no full reload).
 *
 * SECURITY: unknown `[tenant]` → notFound(); identical response for
 * "tenant does not exist" and "page does not exist" (no enumeration).
 */
import { notFound } from 'next/navigation';
import {
  TranslationProvider,
  getMessages,
  translate,
  isSupportedLocale,
} from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { Footer, Header, LocaleSwitcher } from '@jol-hub/ui';
import type { NavItem } from '@jol-hub/ui';
import { loadTenantFixture } from '@/lib/content-loader';
import { pickLocalized } from '@/lib/i18n-helpers';

interface TenantLocaleLayoutParams {
  locale: string;
  tenant: string;
}

export default function TenantLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: TenantLocaleLayoutParams;
}) {
  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;

  const fixture = loadTenantFixture(params.tenant);
  if (!fixture) {
    notFound();
  }

  const messages = getMessages(locale, { vertical: fixture.vertical });
  const tenantTheme = { vertical: fixture.vertical } as const;

  const tenantName = pickLocalized(fixture.name, locale);
  const tagline = pickLocalized(fixture.tagline, locale);
  const basePath = `/${locale}/${fixture.slug}`;

  const navItems: NavItem[] = [
    { label: translate(messages, 'navigation.home'), href: basePath, active: true },
    ...fixture.pages
      .filter((page) => page.route !== '/')
      .map((page) => ({
        label: pickLocalized(page.title, locale),
        href: `${basePath}${page.route}`,
      })),
  ];

  const contactLines = [
    fixture.identity?.address,
    fixture.identity?.phone,
    fixture.identity?.email,
  ].filter((line): line is string => Boolean(line));

  const legalLinks = (
    [
      ['privacyConsent.policyTitle', '/privacy'],
      ['privacyConsent.cookiesTitle', '/cookies'],
      ['privacyConsent.consentTitle', '/consent'],
      ['privacyConsent.dsrTitle', '/dsr'],
    ] as const
  ).map(([key, route]) => ({
    label: translate(messages, key),
    href: `${basePath}${route}`,
  }));

  return (
    <TranslationProvider locale={locale} messages={messages}>
      <Header
        logo={
          <a href={basePath} className="font-heading text-lg font-bold focus-ring rounded-md">
            {tenantName}
          </a>
        }
        navItems={navItems}
        tenant={tenantTheme}
        actions={<LocaleSwitcher />}
      />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <Footer
        brand={
          <div>
            <p className="font-heading text-lg font-bold text-neutral-50">{tenantName}</p>
            <p className="mt-2 text-sm">{tagline}</p>
          </div>
        }
        navigation={navItems
          .filter((item) => item.href)
          .map((item) => ({ label: item.label, href: item.href as string }))}
        contact={contactLines}
        legal={legalLinks}
        copyrightHolder={tenantName}
        tenant={tenantTheme}
      />
    </TranslationProvider>
  );
}
