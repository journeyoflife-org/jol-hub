/**
 * Tenant-route dispatch — STEP 6.
 *
 * Shared entry point for the specific page routes (home, about, contact,
 * news, events, services). Centralizes the two invariants every tenant route
 * must honor so the individual route files stay thin and consistent:
 *
 *  1. Closed tenant lookup — an unknown `[tenant]` segment calls `notFound()`
 *     (bare 404; no enumeration, GDPR Art. 9 / SOC 2 CC6.1).
 *  2. Fixture-first fidelity — if the seed fixture carries content for the
 *     requested route, it wins (the 12 pilot tenants keep their exact output).
 *     Only when there is no fixture page do routes fall through to the STEP 6
 *     composition / collection system.
 *
 * NOTE: this runs in SERVER components only. `tenant` carries `schema` and
 * must never be forwarded to client components (see modules/types.ts
 * `tenantThemeFor` / `toPublicTenant`).
 */
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { SupportedLocale } from '@jol-hub/i18n';
import { findTenantBySlug } from '@jol-hub/tenant-resolver';
import type { Tenant } from '@jol-hub/tenant-resolver';
import type { TenantFixture } from '@jol-hub/seed-data';
import { findTenantPage, loadTenantFixture } from './content-loader';
import { TemplateRenderer } from '@/components/TemplateRenderer';

export interface TenantRouteParams {
  locale: string;
  tenant: string;
}

export interface TenantRouteContext {
  /** Full server-side tenant record (schema present — never sent to clients). */
  tenant: Tenant;
  /** Seed fixture content when this is one of the 12 pilot tenants. */
  fixture: TenantFixture | null;
  locale: SupportedLocale;
  /** Tenant URL prefix, e.g. `/lt/siauliai-church`. */
  basePath: string;
}

/**
 * Resolve the tenant for a specific route. Unknown tenant → bare 404.
 * Returns the resolved context for downstream composition/collection logic.
 */
export function resolveTenantRoute(params: TenantRouteParams): TenantRouteContext {
  const tenant = findTenantBySlug(params.tenant);
  if (!tenant) {
    // Identical response to "page not found" — no tenant enumeration.
    notFound();
  }
  const fixture = loadTenantFixture(params.tenant);
  const locale: SupportedLocale = isSupportedLocale(params.locale)
    ? params.locale
    : DEFAULT_LOCALE;
  const basePath = `/${locale}/${params.tenant}`;
  return { tenant, fixture, locale, basePath };
}

/**
 * Fixture-first delegation: render the seed fixture's page for `route` if it
 * exists (pilot fidelity). Returns `null` when the tenant has no fixture or
 * the fixture defines no page at `route` — the caller then renders the STEP 6
 * system.
 */
export function renderFixtureRoute(
  fixture: TenantFixture | null,
  route: string,
  basePath: string,
): ReactElement | null {
  if (!fixture) return null;
  const page = findTenantPage(fixture, route);
  if (!page) return null;
  return <TemplateRenderer fixture={fixture} page={page} basePath={basePath} />;
}
