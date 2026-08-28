/**
 * Services-family structured data — Phase 2.2 packages 06/10/11/12
 * (deaneries · other churches · funeral · cemetery).
 *
 * DATA LAYER (beside church-landing.ts / layout-families.ts): every emitted
 * value comes from the tenant fixture — nothing fabricated. Pastoral-first
 * posture (packages 11/12 §2): schema completeness is NOT commercial UX —
 * builders enrich only with identity data that exists; offers/Service lists
 * emit ONLY when source data lands (none in the pilot).
 *
 * SAFETY (DS-UX-11): crisis-adjacent content is safety.yml-fed and hidden
 * while the config is absent (O-010 OPEN) — this layer never carries crisis
 * data at all; structured data carries no phone numbers beyond the tenant's
 * own published contact.
 */
import type { Vertical } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { TenantFixture } from '@jol-hub/seed-data';
import { churchEntity } from '@jol-hub/seo';
import { pickLocalized } from './i18n-helpers';
import type { JsonValue } from './json-ld';

export interface ServicesLandingInput {
  fixture: TenantFixture;
  vertical: Vertical;
  locale: SupportedLocale;
  /** Absolute canonical URL of this landing (SEO hard rule 1). */
  homeUrl: string;
}

/**
 * Build the services-family landing entity, or `undefined` when the vertical
 * has no family-specific shape (the generic Organization entity from the page
 * layer stands). Deaneries: the org entity already covers the landing; the
 * member `ItemList` (package 06) is emitted by the caller when member data
 * exists in the entity graph — absent in the pilot, so never fabricated.
 */
export function buildServicesLandingEntity(input: ServicesLandingInput): JsonValue | undefined {
  const { fixture, vertical, locale, homeUrl } = input;
  const identity = fixture.identity;
  const name = pickLocalized(fixture.name, locale);

  switch (vertical) {
    // Package 10 — denomination-agnostic PlaceOfWorship via the shared
    // churchEntity builder ('other' kind emits NO denomination property).
    // Tradition labels are entity-graph DATA, never per-page literals.
    case 'other-church':
      return churchEntity({
        kind: 'other',
        name,
        url: homeUrl,
        address: { streetAddress: identity?.address },
      }) as JsonValue;

    // Package 11 — FuneralHome (strategy row 11 Implemented path), enriched
    // only with identity data that exists: name, address, telephone.
    case 'funeral':
      return {
        '@type': 'FuneralHome',
        name,
        url: homeUrl,
        ...(identity?.address ? { address: { '@type': 'PostalAddress', streetAddress: identity.address } } : {}),
        ...(identity?.phone ? { telephone: identity.phone } : {}),
      };

    // Package 12 — LocalBusiness (row 12 gap closed with localBusinessEntity
    // semantics); geo/openingHours/offers emit only with source data.
    case 'cemetery-cleaning':
      return {
        '@type': 'LocalBusiness',
        name,
        url: homeUrl,
        ...(identity?.address ? { address: { '@type': 'PostalAddress', streetAddress: identity.address } } : {}),
        ...(identity?.phone ? { telephone: identity.phone } : {}),
      };

    default:
      return undefined;
  }
}
