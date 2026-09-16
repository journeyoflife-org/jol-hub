/**
 * Tenant page SEO — STEP 6; STEP 11 absolute-URL upgrade.
 *
 * Builds Next.js `Metadata` (title, description, ABSOLUTE canonical,
 * reciprocal hreflang alternates, Open Graph) for tenant pages via the
 * `@jol-hub/seo` core. Structured data (JSON-LD) is rendered separately via
 * the `<JsonLd>` component because Next's `Metadata` API does not carry
 * arbitrary ld+json.
 *
 * SECURITY: alternates reference only the SAME tenant across locales — never
 * cross-tenant (no enumeration).
 */
import type { Metadata } from 'next';
import type { Tenant } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import { LOCALE_HREFLANG } from '@jol-hub/i18n';
import type { TenantFixture } from '@jol-hub/seed-data';
import { pickLocalized } from './i18n-helpers';
import { buildSeoAlternates } from './seo';

export interface TenantSeoInput {
  tenant: Tenant;
  fixture: TenantFixture | null;
  locale: SupportedLocale;
  /** Tenant-relative route, e.g. `/` or `/news/foo`. */
  route: string;
  /**
   * SHORT page title — the tenant layout's `%s | {name}` template appends
   * the tenant suffix. Omit on home (the layout default IS the name).
   */
  title?: string;
  description: string;
}

export function buildTenantMetadata(input: TenantSeoInput): Metadata {
  const { tenant, fixture, locale, route, title, description } = input;
  // STEP 11: absolute canonical + reciprocal hreflang (incl. x-default).
  const alternates = buildSeoAlternates(tenant.slug, route, locale);
  const siteName = tenantDisplayName(tenant, fixture, locale);
  // Social titles are always fully composed (templates don't apply to OG).
  const socialTitle = title ? `${title} | ${siteName}` : siteName;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: socialTitle,
      description,
      type: 'website',
      locale: LOCALE_HREFLANG[locale],
      siteName,
      url: alternates.canonical,
    },
    // No raster OG images in the pilot (renderer pending) — summary card.
    twitter: { card: 'summary', title: socialTitle, description },
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
