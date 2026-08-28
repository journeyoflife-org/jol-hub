/**
 * SEO composition layer — STEP 11.
 *
 * Bridges the pure `@jol-hub/seo` core to the request context: resolves the
 * PUBLIC origin (proxy-safe, same discipline as the middleware's
 * `publicHost`) and builds ABSOLUTE canonical/hreflang/OG URLs for tenant
 * pages.
 *
 * SERVER-ONLY — uses `next/headers`; never import from client components.
 *
 * RULES (STEP 11):
 *   - every SEO URL is absolute (protocol + domain);
 *   - canonicals carry no query parameters;
 *   - hreflang sets are reciprocal by construction and include x-default.
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import type { SupportedLocale } from '@jol-hub/i18n';
import { LOCALE_HREFLANG } from '@jol-hub/i18n';
import {
  buildHreflangSet,
  clampDescription,
  PILOT_HREFLANG,
  robotsPolicyFor,
  tenantTitleTemplate,
  type HreflangSet,
} from '@jol-hub/seo';

/**
 * The public origin as seen by the client: X-Forwarded-Host (first hop of
 * the proxy chain) else Host. `request.nextUrl`/headers().host behind
 * Proxmox/nginx reflects the Next bind host — it must not be used for
 * public-facing SEO URLs (would leak the internal origin).
 */
export function resolveSeoOrigin(): string {
  const requestHeaders = headers();
  const rawHost =
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host') ?? 'localhost:3000';
  const host = rawHost.split(',')[0]?.trim().toLowerCase() ?? 'localhost:3000';

  const proto = requestHeaders.get('x-forwarded-proto');
  const protocol = proto === 'https' || proto === 'http' ? proto : 'http';

  return `${protocol}://${host}`;
}

/**
 * Absolute canonical + reciprocal hreflang alternates for one tenant page.
 * Drop-in replacement for the STEP-6 relative `buildAlternates`.
 */
export function buildSeoAlternates(tenantSlug: string, route: string, currentLocale: string): HreflangSet {
  return buildHreflangSet(resolveSeoOrigin(), tenantSlug, route, currentLocale, PILOT_HREFLANG);
}

/** True when the resolved origin is a local development host. */
export function isLocalOrigin(origin: string): boolean {
  return /localhost|127\.0\.0\.1/.test(origin);
}

/**
 * ABSOLUTE public URL for a tenant path (spec: every SEO URL — JSON-LD
 * included — carries protocol + domain). Use for JSON-LD entity URLs,
 * breadcrumb items and og:url; `path` is a full request path such as
 * `/{locale}/{tenant}/news/{slug}`.
 */
export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${resolveSeoOrigin()}${normalized}`;
}

/**
 * Default tenant-level metadata (spec: title template "%s | {tenant.name}",
 * description from tenant settings). Emitted by the `[locale]/[tenant]`
 * layout so every page inherits the template, the absolute home canonical
 * and reciprocal hreflang — page-level `generateMetadata` only overrides
 * title/description/route specifics.
 */
export function buildTenantBaseMetadata(options: {
  tenantSlug: string;
  locale: SupportedLocale;
  /** Localized tenant display name. */
  name: string;
  /** Localized tagline (registry-only tenants have none → omitted). */
  tagline?: string;
}): Metadata {
  const { tenantSlug, locale, name, tagline } = options;
  const alternates = buildSeoAlternates(tenantSlug, '/', locale);
  const description = tagline ? clampDescription(tagline) : undefined;
  const robots = robotsPolicyFor('home');

  return {
    title: tenantTitleTemplate(name),
    ...(description ? { description } : {}),
    alternates: { canonical: alternates.canonical, languages: alternates.languages },
    openGraph: {
      title: name,
      ...(description ? { description } : {}),
      type: 'website',
      locale: LOCALE_HREFLANG[locale],
      siteName: name,
      url: alternates.canonical,
    },
    twitter: { card: 'summary', title: name, ...(description ? { description } : {}) },
    robots: { index: robots.index, follow: robots.follow },
  };
}
