/**
 * Tenant page SEO — STEP 6.
 *
 * Builds Next.js `Metadata` (title, description, canonical, hreflang
 * alternates, Open Graph) for tenant pages. Structured data (JSON-LD) is
 * rendered separately via the `<JsonLd>` component because Next's `Metadata`
 * API does not carry arbitrary ld+json.
 *
 * SECURITY: alternates reference only the SAME tenant across locales — never
 * cross-tenant (no enumeration).
 */
import type { Metadata } from 'next';
import type { Tenant } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import { LOCALE_HREFLANG } from '@jol-hub/i18n';
import type { TenantFixture } from '@jol-hub/seed-data';
import { buildAlternates, pickLocalized } from './i18n-helpers';

export interface TenantSeoInput {
  tenant: Tenant;
  fixture: TenantFixture | null;
  locale: SupportedLocale;
  /** Tenant-relative route, e.g. `/` or `/news/foo`. */
  route: string;
  title: string;
  description: string;
}

export function buildTenantMetadata(input: TenantSeoInput): Metadata {
  const { tenant, locale, route, title, description } = input;
  const alternates = buildAlternates(tenant.slug, route);

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: LOCALE_HREFLANG[locale],
    },
    robots: { index: true, follow: true },
  };
}

/** Resolve the display name for a tenant (fixture preferred, else registry). */
export function tenantDisplayName(
  tenant: Tenant,
  fixture: TenantFixture | null,
  locale: SupportedLocale,
): string {
  return fixture ? pickLocalized(fixture.name, locale) : pickLocalized(tenant.name, locale);
}

/** Resolve the tagline/description source (fixture only; registry has none). */
export function tenantTagline(
  fixture: TenantFixture | null,
  locale: SupportedLocale,
): string | undefined {
  return fixture ? pickLocalized(fixture.tagline, locale) : undefined;
}
