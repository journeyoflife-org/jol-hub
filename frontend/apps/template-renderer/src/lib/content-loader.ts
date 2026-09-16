/**
 * Tenant content loading.
 *
 * Fixtures live in `@jol-hub/seed-data` and are Zod-validated at module
 * load. Loading here is a closed lookup: an unknown slug returns `null`
 * (route layer renders 404); the fallback variant is used only when a
 * *known* tenant's fixture must be rendered defensively.
 */
import {
  getTenantFixture,
  getTenantFixtureWithFallback,
  DEFAULT_TENANT_SLUG,
  type TenantFixture,
  type TenantPage,
} from '@jol-hub/seed-data';

/** Load a tenant fixture by slug; `null` when the tenant is unknown. */
export function loadTenantFixture(slug: string): TenantFixture | null {
  return getTenantFixture(slug) ?? null;
}

/** Load a tenant fixture, falling back to the default tenant. */
export function loadTenantFixtureWithFallback(slug: string): TenantFixture {
  return getTenantFixtureWithFallback(slug);
}

export { DEFAULT_TENANT_SLUG };

/** Find a page inside a fixture by tenant-relative route (`/`, `/shop`, ...). */
export function findTenantPage(fixture: TenantFixture, route: string): TenantPage | undefined {
  return fixture.pages.find((page) => page.route === route);
}

/**
 * Routes rendered by the shared (non-differentiating) templates instead of
 * tenant fixtures — the tenant-independent compliance UI of the old lt-* apps.
 */
export const SHARED_ROUTES = ['/privacy', '/cookies', '/consent', '/dsr'] as const;
export type SharedRoute = (typeof SHARED_ROUTES)[number];

export function isSharedRoute(route: string): route is SharedRoute {
  return (SHARED_ROUTES as readonly string[]).includes(route);
}
