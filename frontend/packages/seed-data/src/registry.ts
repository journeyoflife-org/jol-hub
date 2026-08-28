/**
 * Tenant fixture registry.
 *
 * Every fixture is validated against `TenantFixtureSchema` at module load;
 * an invalid fixture fails the build/deploy rather than rendering garbage.
 *
 * SECURITY NOTE (GDPR Art. 9 / SOC 2 CC6.1): the registry is an internal
 * lookup table. HTTP layers MUST NOT expose an endpoint that enumerates
 * `tenantRegistry` — unknown tenants resolve to a bare 404.
 *
 * ROLLBACK NOTE (STEP 1): these fixtures were extracted from the deleted
 * `frontend/apps/lt-*` demo apps. To restore a legacy app, check it out
 * from git history (branch `feat/template-renderer-step1`); fixtures here
 * remain the canonical seed data either way.
 */
import { TenantFixtureSchema } from './schema';
import type { TenantFixture } from './schema';

import basilicaVilniusCathedral from './fixtures/tenants/basilica-vilnius-cathedral.json';
import cathedralKaunas from './fixtures/tenants/cathedral-kaunas.json';
import cemeteryVilnius from './fixtures/tenants/cemetery-vilnius.json';
import chapelVilnius from './fixtures/tenants/chapel-vilnius.json';
import deaneryVilniusCity from './fixtures/tenants/deanery-vilnius-city.json';
import dioceseVilnius from './fixtures/tenants/diocese-vilnius.json';
import funeralVilnius from './fixtures/tenants/funeral-vilnius.json';
import greekCatholicVilnius from './fixtures/tenants/greek-catholic-vilnius.json';
import lutheranKaunas from './fixtures/tenants/lutheran-kaunas.json';
import monasteryVilnius from './fixtures/tenants/monastery-vilnius.json';
import orthodoxVilniusCathedral from './fixtures/tenants/orthodox-vilnius-cathedral.json';
import parishStJohnVilnius from './fixtures/tenants/parish-st-john-vilnius.json';
// STEP 17 — Wave 0 reference sites (Šiauliai stakeholder cluster). One
// file, five fixtures; expanded into the same validated stream below.
import referenceSites from './fixtures/tenants/reference-sites.json';
// STEP 18 — Wave 1 pilot cluster (30 sites): deaneries, parish churches,
// funeral homes and cemetery-care services across the five deaneries.
import wave1Siauliai from './fixtures/tenants/wave1-siauliai.json';
import wave1Joniskis from './fixtures/tenants/wave1-joniskis.json';
import wave1KelmePakruojisRadviliskis from './fixtures/tenants/wave1-kelme-pakruojis-radviliskis.json';
// STEP 18b — Wave 1 reconciliation (DECISION-LOG O-002): church-level
// funeral homes and cemetery-care services for the four parish churches.
import wave1ChurchServices from './fixtures/tenants/wave1-church-services.json';

const rawFixtures: unknown[] = [
  basilicaVilniusCathedral,
  cathedralKaunas,
  cemeteryVilnius,
  chapelVilnius,
  deaneryVilniusCity,
  dioceseVilnius,
  funeralVilnius,
  greekCatholicVilnius,
  lutheranKaunas,
  monasteryVilnius,
  orthodoxVilniusCathedral,
  parishStJohnVilnius,
  ...(referenceSites as unknown[]),
  ...(wave1Siauliai as unknown[]),
  ...(wave1Joniskis as unknown[]),
  ...(wave1KelmePakruojisRadviliskis as unknown[]),
  ...(wave1ChurchServices as unknown[]),
];

/** All tenant fixtures, parsed (throws at load time if any is invalid). */
export const tenantFixtures: readonly TenantFixture[] = rawFixtures.map(
  (raw) => TenantFixtureSchema.parse(raw),
);

/** Internal slug → fixture map. Never serialize its keys to HTTP responses. */
export const tenantRegistry: ReadonlyMap<string, TenantFixture> = new Map(
  tenantFixtures.map((fixture) => [fixture.slug, fixture]),
);

/** Default tenant used as fallback when a resolved slug has no fixture. */
export const DEFAULT_TENANT_SLUG = 'parish-st-john-vilnius';

export function isKnownTenant(slug: string): boolean {
  return tenantRegistry.has(slug);
}

/** Returns the fixture for a slug, or undefined — never throws. */
export function getTenantFixture(slug: string): TenantFixture | undefined {
  return tenantRegistry.get(slug);
}

/** Fixture by slug with fallback to the default tenant. */
export function getTenantFixtureWithFallback(slug: string): TenantFixture {
  return tenantRegistry.get(slug) ?? (tenantRegistry.get(DEFAULT_TENANT_SLUG) as TenantFixture);
}
