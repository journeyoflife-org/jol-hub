/**
 * Church-landing structured data — Phase 2.2 packages 03/04/08/09
 * (renderer consumption of the FE-1 shared `churchEntity` builder).
 *
 * DATA LAYER (beside layout-families.ts / template-registry.ts): the
 * vertical→kind map and every emitted value are DATA-driven — denomination /
 * tradition comes from the tenant fixture's `identity.jurisdiction` (entity
 * DATA, controlled vocabulary), never a hardcoded literal (FE-5 / O-022
 * outcome governs). DS-THEME-01 scope note covers this layer.
 */
import type { Vertical as FixtureVertical } from '@jol-hub/seed-data';
import type { Vertical as ResolverVertical } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import { churchEntity } from '@jol-hub/seo';
import type { ChurchKind } from '@jol-hub/seo';
import type { TenantFixture } from '@jol-hub/seed-data';
import { pickLocalized } from './i18n-helpers';

/**
 * churchEntity kind per church-landing vertical (packages 03/04/08/09, and
 * parish per 07). Greek-catholic tenants are eastern-Catholic (not Orthodox)
 * and get the denomination-agnostic 'other' shape until their own package
 * lands. Non-church verticals → undefined (no church entity emitted).
 */
/**
 * Accepts BOTH vocabularies: the resolver-side canonical vertical
 * (tenant.vertical at render time: 'orthodox'/'protestant'/'church') and the
 * seed-data fixture vertical ('orthodox-church'/'protestant-church'/'parish')
 * — the same dual handling template-registry.ts performs.
 */
export function churchKindForVertical(
  vertical: ResolverVertical | FixtureVertical,
): ChurchKind | undefined {
  switch (vertical) {
    case 'basilica':
      return 'basilica';
    case 'cathedral':
      return 'cathedral';
    case 'parish': // fixture vocabulary
    case 'church': // resolver vocabulary (normalized to parish upstream)
      return 'parish';
    case 'protestant': // resolver vocabulary
    case 'protestant-church': // fixture vocabulary
      return 'protestant';
    case 'orthodox': // resolver vocabulary
    case 'orthodox-church': // fixture vocabulary
      return 'orthodox';
    case 'greek-catholic':
      return 'other';
    default:
      return undefined;
  }
}

export interface ChurchLandingInput {
  fixture: TenantFixture;
  vertical: ResolverVertical | FixtureVertical;
  locale: SupportedLocale;
  /** Absolute canonical URL of this landing (SEO hard rule 1). */
  homeUrl: string;
}

/**
 * Build the church-landing JSON-LD entity for a tenant, or `undefined` when
 * the vertical has no church-landing shape. Every field is mapped from the
 * fixture — nothing is fabricated; absent data is simply not emitted.
 */
export function buildChurchLandingEntity(input: ChurchLandingInput): ReturnType<typeof churchEntity> | undefined {
  const kind = churchKindForVertical(input.vertical);
  if (!kind) return undefined;

  const { fixture, locale } = input;
  const identity = fixture.identity;
  const name = pickLocalized(fixture.name, locale);

  // Tradition/denomination is entity DATA: the fixture's jurisdiction field
  // (controlled vocabulary from the entity registry — never a literal here).
  const jurisdiction = identity?.jurisdiction;

  // Protestant/orthodox shapes REQUIRE a denomination/tradition label — and
  // the ONLY legitimate source is the fixture's jurisdiction DATA. Absent it,
  // emit nothing rather than fabricate (builder would throw; honesty wins).
  if ((kind === 'protestant' || kind === 'orthodox') && !jurisdiction) {
    return undefined;
  }

  return churchEntity({
    kind,
    name,
    url: input.homeUrl,
    address: { streetAddress: identity?.address },
    ...(identity?.phone ? { telephone: identity.phone } : {}),
    // Parent org (diocese) for the catholic-profile landings — DATA.
    ...(kind === 'basilica' || kind === 'cathedral'
      ? jurisdiction
        ? { parent: { name: jurisdiction } }
        : {}
      : {}),
    // Denomination property for protestant/orthodox — DATA.
    ...(kind === 'protestant' || kind === 'orthodox' ? { denomination: jurisdiction } : {}),
    // NOTE (package 09, DS-I18N-03): nativeName wiring lands when
    // LocalizedText gains an `ru` field (schema extension + owner data). The
    // builder already preserves Cyrillic UTF-8 untouched (glyph coverage
    // proven in packages/seo tests); today's fixtures carry lt/en only, so
    // there is no Cyrillic display segment to lang-tag (DS-A11Y-11 holds
    // trivially; page-level lang comes from the [locale] layout).
  });
}
