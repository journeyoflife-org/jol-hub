/**
 * Services family (packages 06 Deaneries / 10 Other churches / 11 Funeral /
 * 12 Cemetery) — renderer coverage.
 *
 * Package 11/12 pastoral-first rules are TESTABLE ASSERTIONS here:
 *   - DS-UX-11 hidden state: safety.yml absent (O-010 OPEN) ⇒ zero crisis
 *     entries, zero hardcoded hotline numbers, no degraded partial blocks.
 *   - No retargeting hooks EVER (no tracking markup anywhere).
 *   - Crisis keywords served pastorally, never commercially (no upsell /
 *     urgency vocabulary in funeral/cemetery content surfaces).
 *   - Tradition for package 10 comes from controlled vocabulary: the
 *     denomination-agnostic shape carries NO denomination property.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { TenantFixtureSchema } from '@journeyoflife-org/seed-data';
import type { TenantFixture } from '@journeyoflife-org/seed-data';
import { buildHreflangSet, verifyHreflangReciprocity } from '@journeyoflife-org/seo';

import { buildServicesLandingEntity } from '../../lib/services-landing';
import { buildChurchLandingEntity } from '../../lib/church-landing';

const ORIGIN = 'https://gyvenimo-kelias.lt';
const RENDERER_SRC = join(__dirname, '../..');
const HUB_ROOT = join(__dirname, '../../../../../../');

function loadFixture(slug: string): TenantFixture {
  const raw = readFileSync(
    join(__dirname, '../../../../../packages/seed-data/src/fixtures/tenants', `${slug}.json`),
    'utf-8'
  );
  return TenantFixtureSchema.parse(JSON.parse(raw));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/* ------------------------------------------------------------------ */
/* Package 11 — FuneralHome from fixture DATA                          */
/* ------------------------------------------------------------------ */

describe('package 11: funeral landing', () => {
  it('emits FuneralHome enriched ONLY with identity data (no fabricated offers)', () => {
    const fixture = loadFixture('funeral-vilnius');
    const entity = asRecord(
      buildServicesLandingEntity({
        fixture,
        vertical: 'funeral',
        locale: 'lt',
        homeUrl: `${ORIGIN}/lt/funeral-vilnius`,
      })
    );
    expect(entity['@type']).toBe('FuneralHome');
    expect(entity.telephone).toBe(fixture.identity?.phone); // DATA, not literal
    expect(asRecord(entity.address).streetAddress).toBe(fixture.identity?.address);
    // Pastoral posture: no offers/price schema fabricated in the pilot.
    expect(entity.offers).toBeUndefined();
    expect(JSON.stringify(entity)).not.toMatch(/price/i);
  });
});

/* ------------------------------------------------------------------ */
/* Package 12 — LocalBusiness cemetery shape                           */
/* ------------------------------------------------------------------ */

describe('package 12: cemetery landing', () => {
  it('emits LocalBusiness with identity data only', () => {
    const fixture = loadFixture('cemetery-vilnius');
    const entity = asRecord(
      buildServicesLandingEntity({
        fixture,
        vertical: 'cemetery-cleaning',
        locale: 'lt',
        homeUrl: `${ORIGIN}/lt/cemetery-vilnius`,
      })
    );
    expect(entity['@type']).toBe('LocalBusiness');
    expect(entity.telephone).toBe(fixture.identity?.phone);
    expect(entity.offers).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Package 10 — denomination-agnostic shape, vocabulary from DATA      */
/* ------------------------------------------------------------------ */

describe('package 10: other churches landing', () => {
  it('emits PlaceOfWorship with NO denomination property (controlled vocabulary only)', () => {
    const fixture = loadFixture('greek-catholic-vilnius');
    const entity = asRecord(
      buildChurchLandingEntity({
        fixture,
        vertical: 'greek-catholic',
        locale: 'lt',
        homeUrl: `${ORIGIN}/lt/greek-catholic-vilnius`,
      })
    );
    expect(entity['@type']).toBe('PlaceOfWorship');
    expect(entity.additionalProperty).toBeUndefined();
    expect(JSON.stringify(entity)).not.toContain('denomination');
  });
});

/* ------------------------------------------------------------------ */
/* Package 06 — deaneries: ItemList is DATA-driven, never fabricated   */
/* ------------------------------------------------------------------ */

describe('package 06: deaneries landing', () => {
  it('emits no family-specific entity without member data (org shape stands)', () => {
    const fixture = loadFixture('deanery-vilnius-city');
    const entity = buildServicesLandingEntity({
      fixture,
      vertical: 'deanery',
      locale: 'lt',
      homeUrl: `${ORIGIN}/lt/siauliai-deanery`,
    });
    expect(entity).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* DS-UX-11 — safety.yml HIDDEN state (O-010 OPEN)                     */
/* ------------------------------------------------------------------ */

describe('DS-UX-11: crisis entries hidden while safety.yml is absent', () => {
  it('safety.yml does not exist anywhere in countries/ (hidden precondition)', () => {
    const countriesDir = join(HUB_ROOT, 'countries');
    for (const cc of readdirSync(countriesDir)) {
      const configDir = join(countriesDir, cc, 'config');
      if (!existsSync(configDir)) continue;
      for (const file of readdirSync(configDir)) {
        expect(file, `unexpected safety config: countries/${cc}/config/${file}`).not.toBe(
          'safety.yml'
        );
      }
    }
  });

  it('renderer source carries zero hardcoded hotline/crisis numbers', () => {
    // No component/module may carry a crisis number — the ONLY legitimate
    // source is owner-curated safety.yml (absent ⇒ hidden, never degraded).
    const scan = collectSources(RENDERER_SRC);
    const offenders = scan.filter((file) => {
      const content = readFileSync(file, 'utf-8');
      return /(hotline|krizi|krizė|krizės|bereavement.*(phone|number)|savižudyb)/i.test(content);
    });
    expect(offenders).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* No retargeting hooks EVER (package 11 §2, 12 §7)                    */
/* ------------------------------------------------------------------ */

describe('no retargeting hooks', () => {
  it('renderer source contains zero tracking/retargeting surfaces', () => {
    const scan = collectSources(RENDERER_SRC);
    const offenders = scan.filter((file) => {
      const content = readFileSync(file, 'utf-8');
      return /(gtag\(|googletagmanager|fbq\(|facebook.*pixel|dataLayer\s*=|hotjar|criteo|adroll)/i.test(
        content
      );
    });
    expect(offenders).toEqual([]);
  });
});

/* ------------------------------------------------------------------ */
/* Pastoral keyword posture — never commercial                         */
/* ------------------------------------------------------------------ */

describe('crisis keywords served pastorally, never commercially', () => {
  it('funeral/cemetery content surfaces carry no upsell/urgency vocabulary', () => {
    const modulesDir = join(RENDERER_SRC, 'modules');
    const scan = collectSources(modulesDir).concat(collectSources(join(RENDERER_SRC, 'lib')));
    const offenders = scan.filter((file) => {
      const content = readFileSync(file, 'utf-8');
      return /(limited\s+time|act\s+now|don'?t\s+miss|discount|upsell|special\s+offer)/i.test(
        content
      );
    });
    expect(offenders).toEqual([]);
  });

  it('funeral/cemetery home compositions exclude donation-cta (no commercial pressure)', () => {
    // Imported dynamically to avoid app-router side effects in vitest.
    return import('../../lib/vertical-defaults').then(({ buildVerticalHomeConfig }) => {
      for (const vertical of ['funeral', 'cemetery-cleaning'] as const) {
        const config = buildVerticalHomeConfig(vertical);
        const types = config.modules.map((module) => module.type);
        expect(types).not.toContain('donation-cta');
        expect(types).toContain('contact-form'); // reachable contact path
      }
    });
  });
});

/* ------------------------------------------------------------------ */
/* SEO — hreflang reciprocity around services-family routes            */
/* ------------------------------------------------------------------ */

describe('hreflang reciprocity (services family)', () => {
  it('services-family landings are reciprocal across pilot locales', () => {
    const slugs = [
      'deanery-vilnius-city',
      'greek-catholic-vilnius',
      'funeral-vilnius',
      'cemetery-vilnius',
    ];
    for (const slug of slugs) {
      const pages = ['lt', 'en', 'ru'].map((locale) => buildHreflangSet(ORIGIN, slug, '/', locale));
      expect(verifyHreflangReciprocity(pages)).toEqual([]);
    }
  });
});

/* ------------------------------------------------------------------ */
/* helper — recursive .ts/.tsx source collector                        */
/* ------------------------------------------------------------------ */

function collectSources(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '__tests__')
      continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectSources(full));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}
