/**
 * Tenant registry — STEP 5.
 *
 * Pilot source: static entries below (Wave 1, Šiauliai region) PLUS the
 * seed-data fixture tenants derived at module load (single source of truth
 * for those 12 — no drift between fixtures and the registry).
 *
 * API fallback: when BACKEND_API_URL is configured the platform will swap
 * the static source for GET /api/v1/tenants (server-to-server only). The
 * registry is NEVER exposed to clients — no enumeration endpoint exists
 * (GDPR Art. 9 / SOC 2 CC6.1).
 *
 * Schema naming follows ADR-001: `t_<slug with _ separators>`.
 */
import { tenantFixtures } from '@jol-hub/seed-data';

import type { PackageTier, Tenant, Vertical } from './types';
import { FEATURES_BY_TIER, normalizeVertical, schemaForTenant } from './types';

/** Wave-1 rollout timestamp (registry genesis). */
const WAVE1_CREATED = '2026-08-25T00:00:00.000Z';

interface PilotSpec {
  slug: string;
  /** Lithuanian display name. */
  lt: string;
  /** English display name. */
  en: string;
  vertical: Vertical;
  packageTier: PackageTier;
  /** Extra features beyond the tier baseline. */
  extraFeatures?: string[];
}

function makeTenant(spec: PilotSpec): Tenant {
  return {
    id: spec.slug,
    slug: spec.slug,
    name: { lt: spec.lt, en: spec.en },
    vertical: spec.vertical,
    schema: schemaForTenant(spec.slug),
    locale: 'lt',
    packageTier: spec.packageTier,
    domain: null,
    features: [
      ...FEATURES_BY_TIER[spec.packageTier],
      ...(spec.extraFeatures ?? []),
    ],
    settings: {},
    createdAt: WAVE1_CREATED,
    updatedAt: WAVE1_CREATED,
  };
}

/* ------------------------------------------------------------------------ */
/* Wave 1 — Šiauliai region pilot (21 tenants)                              */
/* ------------------------------------------------------------------------ */

const WAVE1_PILOTS: PilotSpec[] = [
  // Šiauliai (5 — includes the diocese, the regional VIP anchor tenant).
  // STEP 17: Wave-0 reference cluster — the cathedral is VIP (stakeholder
  // showcase) and Kražiai demos the CHEAP tier (simplicity + affordability).
  { slug: 'siauliai-diocese', lt: 'Šiaulių vyskupija', en: 'Diocese of Šiauliai', vertical: 'diocese', packageTier: 'vip' },
  { slug: 'siauliai-deanery', lt: 'Šiaulių dekanatas', en: 'Šiauliai Deanery', vertical: 'deanery', packageTier: 'normal' },
  { slug: 'siauliai-church', lt: 'Šiaulių Šv. apaštalų Petro ir Pauliaus katedra', en: 'Šiauliai Cathedral', vertical: 'cathedral', packageTier: 'vip' },
  { slug: 'siauliai-funeral', lt: 'Šiaulių laidojimo namai', en: 'Šiauliai Funeral Home', vertical: 'funeral', packageTier: 'normal' },
  { slug: 'siauliai-cleaning', lt: 'Šiaulių kapinių priežiūra', en: 'Šiauliai Cemetery Care', vertical: 'cemetery-cleaning', packageTier: 'normal' },
  { slug: 'kraziai-church', lt: 'Kražių Švč. Mergelės Marijos Nekaltojo Prasidėjimo bažnyčia', en: 'Kražiai Church', vertical: 'church', packageTier: 'cheap' },

  // Joniškis (4 — church is Žagarė)
  { slug: 'joniskis-deanery', lt: 'Joniškio dekanatas', en: 'Joniškis Deanery', vertical: 'deanery', packageTier: 'normal' },
  { slug: 'joniskis-church', lt: 'Žagarės Šv. apaštalų Petro ir Pauliaus bažnyčia', en: 'Žagarė Church', vertical: 'church', packageTier: 'normal' },
  { slug: 'joniskis-funeral', lt: 'Joniškio laidojimo namai', en: 'Joniškis Funeral Home', vertical: 'funeral', packageTier: 'normal' },
  { slug: 'joniskis-cleaning', lt: 'Joniškio kapinių priežiūra', en: 'Joniškis Cemetery Care', vertical: 'cemetery-cleaning', packageTier: 'normal' },

  // Kelmė (4 — church is Kražiai)
  { slug: 'kelme-deanery', lt: 'Kelmės dekanatas', en: 'Kelmė Deanery', vertical: 'deanery', packageTier: 'normal' },
  { slug: 'kelme-church', lt: 'Kražių Šv. apaštalų Petro ir Pauliaus bažnyčia', en: 'Kražiai Church', vertical: 'church', packageTier: 'normal' },
  { slug: 'kelme-funeral', lt: 'Kelmės laidojimo namai', en: 'Kelmė Funeral Home', vertical: 'funeral', packageTier: 'normal' },
  { slug: 'kelme-cleaning', lt: 'Kelmės kapinių priežiūra', en: 'Kelmė Cemetery Care', vertical: 'cemetery-cleaning', packageTier: 'normal' },

  // Pakruojis (4 — church is Lygumai)
  { slug: 'pakruojis-deanery', lt: 'Pakruojo dekanatas', en: 'Pakruojis Deanery', vertical: 'deanery', packageTier: 'normal' },
  { slug: 'pakruojis-church', lt: 'Lygumų Šv. apaštalų Petro ir Pauliaus bažnyčia', en: 'Lygumai Church', vertical: 'church', packageTier: 'normal' },
  { slug: 'pakruojis-funeral', lt: 'Pakruojo laidojimo namai', en: 'Pakruojis Funeral Home', vertical: 'funeral', packageTier: 'normal' },
  { slug: 'pakruojis-cleaning', lt: 'Pakruojo kapinių priežiūra', en: 'Pakruojis Cemetery Care', vertical: 'cemetery-cleaning', packageTier: 'normal' },

  // Radviliškis (4 — church is Baisogala)
  { slug: 'radviliskis-deanery', lt: 'Radviliškio dekanatas', en: 'Radviliškis Deanery', vertical: 'deanery', packageTier: 'normal' },
  { slug: 'radviliskis-church', lt: 'Baisogalos Šv. apaštalų Petro ir Pauliaus bažnyčia', en: 'Baisogala Church', vertical: 'church', packageTier: 'normal' },
  { slug: 'radviliskis-funeral', lt: 'Radviliškio laidojimo namai', en: 'Radviliškis Funeral Home', vertical: 'funeral', packageTier: 'normal' },
  { slug: 'radviliskis-cleaning', lt: 'Radviliškio kapinių priežiūra', en: 'Radviliškis Cemetery Care', vertical: 'cemetery-cleaning', packageTier: 'normal' },
];

/* ------------------------------------------------------------------------ */
/* Derived entries — the 12 seed-data fixture tenants                       */
/* ------------------------------------------------------------------------ */

/** Tier heuristic for fixture-era tenants (documented, admin-correctable). */
function fixtureTier(vertical: string): PackageTier {
  return vertical === 'diocese' || vertical === 'basilica' || vertical === 'cathedral'
    ? 'vip'
    : 'normal';
}

const FIXTURE_DERIVED: Tenant[] = tenantFixtures
  // STEP 17 pilot precedence: Wave-0 reference sites exist BOTH as
  // explicit pilot entries (authoritative tier/name) and as seed fixtures
  // (content). The explicit entry wins; the fixture supplies pages only.
  .filter((fixture) => !WAVE1_PILOTS.some((pilot) => pilot.slug === fixture.slug))
  .map((fixture) => {
    const tier = fixtureTier(fixture.vertical);
    return {
      id: fixture.slug,
      slug: fixture.slug,
      name: fixture.name,
      vertical: normalizeVertical(fixture.vertical),
      schema: schemaForTenant(fixture.slug),
      locale: fixture.locale,
      packageTier: tier,
      domain: null,
      features: FEATURES_BY_TIER[tier],
      settings: {},
      createdAt: WAVE1_CREATED,
      updatedAt: WAVE1_CREATED,
    };
  });

/* ------------------------------------------------------------------------ */
/* Lookup structures (module-load time — resolution stays allocation-free)  */
/* ------------------------------------------------------------------------ */

export const TENANTS: readonly Tenant[] = [...WAVE1_PILOTS.map(makeTenant), ...FIXTURE_DERIVED];

/** Slug → tenant. NEVER serialize keys/values to HTTP responses. */
export const TENANT_BY_SLUG: ReadonlyMap<string, Tenant> = new Map(
  TENANTS.map((tenant) => [tenant.slug, tenant]),
);

/** Custom domain → tenant (exact hostname match; empty in the pilot). */
export const TENANT_BY_DOMAIN: ReadonlyMap<string, Tenant> = new Map(
  TENANTS.filter((tenant) => tenant.domain !== null).map((tenant) => [
    tenant.domain as string,
    tenant,
  ]),
);

/** Closed lookup — null for unknown slugs (no enumeration). */
export function findTenantBySlug(slug: string): Tenant | null {
  return TENANT_BY_SLUG.get(slug) ?? null;
}

/** Closed lookup — null for unknown domains. */
export function findTenantByDomain(domain: string): Tenant | null {
  return TENANT_BY_DOMAIN.get(domain.toLowerCase()) ?? null;
}
