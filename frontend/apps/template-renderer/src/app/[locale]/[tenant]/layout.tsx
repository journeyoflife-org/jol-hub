/**
 * Tenant chrome + locale context (STEP 4) + tenant context (STEP 5).
 *
 * - Resolves the tenant: seed-data fixture OR the STEP-5 registry
 *   (Wave-1 pilot tenants render through the template registry before
 *   their content ships). Closed lookup → bare 404 on unknown tenant.
 * - Builds the effective message catalog: common(locale) ← vertical ← tenant.
 * - Wraps everything in TranslationProvider so all shared components read
 *   translations from context — no hard-coded UI strings anywhere.
 * - Wraps the tree in TenantProvider (client-safe view — schema stripped).
 * - Locale switcher lives in the header; switching is a client-side
 *   navigation (no full reload).
 *
 * SECURITY: unknown `[tenant]` → notFound(); identical response for
 * "tenant does not exist" and "page does not exist" (no enumeration).
 * `Tenant.schema` never crosses into the client bundle (ADR-001).
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
import { Footer, Header, LocaleSwitcher, CookieConsentBanner } from '@jol-hub/ui';
import type { NavItem } from '@jol-hub/ui';
import { findTenantBySlug, toPublicTenant } from '@jol-hub/tenant-resolver';
import { loadTenantFixture } from '@/lib/content-loader';
import { pickLocalized } from '@/lib/i18n-helpers';
import { TenantProvider } from '@/lib/tenant-context';
import { themeVerticalFor } from '@/lib/template-registry';

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
  // STEP-5 registry covers tenants without fixture content yet (Wave 1).
  const registryTenant = findTenantBySlug(params.tenant);
  if (!fixture && !registryTenant) {
    notFound();
  }

  // Message catalog keys vertical overrides by fixture-era taxonomy; the
  // registry-only tenants map onto it via themeVerticalFor.
  const catalogVertical = fixture?.vertical ?? themeVerticalFor(registryTenant!.vertical);
  const messages = getMessages(locale, catalogVertical ? { vertical: catalogVertical } : undefined);
  const tenantTheme = { vertical: catalogVertical } as const;

  const tenantName = fixture
    ? pickLocalized(fixture.name, locale)
    : pickLocalized(registryTenant!.name, locale);
  const tagline = fixture ? pickLocalized(fixture.tagline, locale) : '';
  const basePath = `/${locale}/${params.tenant}`;

  const navItems: NavItem[] = [
    { label: translate(messages, 'navigation.home'), href: basePath, active: true },
    ...(fixture?.pages ?? [])
      .filter((page) => page.route !== '/')
      .map((page) => ({
        label: pickLocalized(page.title, locale),
        href: `${basePath}${page.route}`,
      })),
  ];

  const contactLines = [
    fixture?.identity?.address,
    fixture?.identity?.phone,
    fixture?.identity?.email,
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
      <TenantProvider tenant={toPublicTenant(registryTenant!)}>
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
              {tagline && <p className="mt-2 text-sm">{tagline}</p>}
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

        {/*
          GDPR/ePrivacy cookie consent — cross-cutting, so it lives in the
          tenant layout (covers every tenant page, fixture or composed). No
          non-essential storage/analytics is touched until consent is given.
        */}
        <CookieConsentBanner
          privacyPolicyUrl={`${basePath}/privacy`}
          cookiePolicyUrl={`${basePath}/cookies`}
          language={locale}
        />
      </TenantProvider>
    </TranslationProvider>
  );
}
