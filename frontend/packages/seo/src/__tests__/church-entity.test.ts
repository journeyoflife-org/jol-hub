/**
 * churchEntity tests — Phase 2.2 batch 1 (pages 3/4/7/8/9/10 reduce to one
 * parameterized builder).
 *
 * Covers: valid JSON-LD per kind; required-property enforcement; locale
 * string handling (Cyrillic segments + LT diacritics pass through untouched;
 * slugs ASCII-fold both ways); hreflang reciprocity around church-landing
 * URLs (cites the existing reciprocity pattern in seo.test.ts).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { churchEntity, churchSlug } from '../structured-data';
import { buildHreflangSet, verifyHreflangReciprocity } from '../hreflang';
import type { ChurchEntityInput } from '../structured-data';
import type { Json } from '../types';

const ORIGIN = 'https://gyvenimo-kelias.lt';

const VILNIUS_ADDRESS = {
  streetAddress: 'Šv. Stepono g. 15',
  addressLocality: 'Vilnius',
  postalCode: '01315',
  addressCountry: 'LT',
};

const GEO = { latitude: 54.6772, longitude: 25.2869 };
const DIOCESE = { name: 'Vilniaus arkivyskupija', url: `${ORIGIN}/lt/vilniaus-arkivyskupija` };

function asRecord(value: Json | undefined): Record<string, Json> {
  return value as Record<string, Json>;
}

function base(kind: ChurchEntityInput['kind']): ChurchEntityInput {
  return {
    kind,
    name: 'Šv. apaštalų Petro ir Povilo bažnyčia',
    url: `${ORIGIN}/lt/t/sv-apastalu-petro-ir-povilo-baznycia`,
    address: VILNIUS_ADDRESS,
    geo: GEO,
    parent: DIOCESE,
  };
}

// =============================================================================
// VALID JSON-LD PER KIND
// =============================================================================

test('basilica: Church-led type array + geo + parentOrganization (row 3)', () => {
  const entity = asRecord(churchEntity(base('basilica')));
  assert.deepEqual(entity['@type'], ['Church', 'PlaceOfWorship']);
  assert.equal(entity.name, 'Šv. apaštalų Petro ir Povilo bažnyčia');
  assert.ok(entity.address);
  assert.deepEqual(entity.geo, { '@type': 'GeoCoordinates', ...GEO });
  const parent = asRecord(entity.parentOrganization);
  assert.equal(parent['@type'], 'ReligiousOrganization');
  assert.equal(parent.name, 'Vilniaus arkivyskupija');
});

test('basilica preciseCatholic adds CatholicChurch to the type array (row 3)', () => {
  const entity = asRecord(churchEntity({ ...base('basilica'), preciseCatholic: true }));
  assert.deepEqual(entity['@type'], ['Church', 'CatholicChurch', 'PlaceOfWorship']);
});

test('cathedral: role via additionalProperty, seatOf surfaced (row 4)', () => {
  const entity = asRecord(churchEntity({ ...base('cathedral'), seatOf: 'Vilniaus arkivyskupija' }));
  assert.deepEqual(entity['@type'], ['Church', 'PlaceOfWorship']);
  const props = (entity.additionalProperty as Json[]).map(asRecord);
  const role = props.find((p) => p.name === 'role');
  assert.equal(role?.value, 'cathedral');
  assert.match(String(role?.description), /Seat of/);
});

test('parish: Church + PlaceOfWorship with required props (row 7)', () => {
  const entity = asRecord(churchEntity(base('parish')));
  assert.deepEqual(entity['@type'], ['Church', 'PlaceOfWorship']);
  assert.ok(entity.geo);
  assert.ok(entity.parentOrganization);
});

test('protestant: PlaceOfWorship + denomination property from DATA (row 8)', () => {
  const entity = asRecord(
    churchEntity({
      kind: 'protestant',
      name: 'Vilniaus evangelikų liuteronų bažnyčia',
      url: `${ORIGIN}/lt/t/vilniaus-evangeliku-liuteronu-baznycia`,
      address: VILNIUS_ADDRESS,
      denomination: 'Liuteronų', // controlled-vocabulary label, locale-resolved
    }),
  );
  assert.equal(entity['@type'], 'PlaceOfWorship');
  const props = (entity.additionalProperty as Json[]).map(asRecord);
  const denom = props.find((p) => p.name === 'denomination');
  assert.equal(denom?.value, 'Liuteronų');
});

test('orthodox: Church-led + denomination property + native Cyrillic alternateName (row 9)', () => {
  const entity = asRecord(
    churchEntity({
      ...base('orthodox'),
      name: 'Šv. Dvasios cerkvė',
      nativeName: 'Церковь Святого Духа',
      denomination: 'Stačiatikių',
    }),
  );
  assert.deepEqual(entity['@type'], ['Church', 'PlaceOfWorship']);
  assert.equal(entity.alternateName, 'Церковь Святого Духа'); // Cyrillic untouched
  const props = (entity.additionalProperty as Json[]).map(asRecord);
  assert.ok(props.some((p) => p.name === 'denomination' && p.value === 'Stačiatikių'));
});

test('other: denomination-agnostic PlaceOfWorship, no denomination property (row 10)', () => {
  const entity = asRecord(
    churchEntity({
      kind: 'other',
      name: 'Community chapel',
      url: `${ORIGIN}/lt/t/community-chapel`,
      address: VILNIUS_ADDRESS,
      denomination: 'ignored-by-design',
    }),
  );
  assert.equal(entity['@type'], 'PlaceOfWorship');
  assert.equal(entity.additionalProperty, undefined);
});

test('deanery: ReligiousOrganization at org level (rows 5/6)', () => {
  const entity = asRecord(
    churchEntity({
      kind: 'deanery',
      name: 'Vilniaus I dekanatas',
      url: `${ORIGIN}/lt/t/vilniaus-i-dekanatas`,
      address: VILNIUS_ADDRESS,
      parent: DIOCESE,
    }),
  );
  assert.equal(entity['@type'], 'ReligiousOrganization');
});

// =============================================================================
// REQUIRED-PROPERTY ENFORCEMENT
// =============================================================================

test('throws on missing name/url/address', () => {
  assert.throws(() => churchEntity({ ...base('parish'), name: '' }), /name/);
  assert.throws(() => churchEntity({ ...base('parish'), url: '' }), /url/);
  assert.throws(
    () => churchEntity({ kind: 'parish', name: 'x', url: `${ORIGIN}/x`, address: undefined as never }),
    /address/,
  );
});

test('denomination is REQUIRED for protestant and orthodox (rows 8/9)', () => {
  assert.throws(
    () =>
      churchEntity({
        kind: 'protestant',
        name: 'x',
        url: `${ORIGIN}/x`,
        address: VILNIUS_ADDRESS,
      }),
    /denomination/,
  );
  assert.throws(() => churchEntity({ ...base('orthodox'), denomination: undefined }), /denomination/);
});

test('geo + parent are EMITTED WHEN PRESENT for basilica/cathedral/parish (recommended props)', () => {
  for (const kind of ['basilica', 'cathedral', 'parish'] as const) {
    // Present → emitted (row 3 recommended props).
    const withData = asRecord(churchEntity(base(kind)));
    assert.ok(withData.geo);
    assert.ok(withData.parentOrganization);
    // Absent → omitted gracefully (pilot data layer carries neither yet).
    const withoutData = asRecord(churchEntity({ ...base(kind), geo: undefined, parent: undefined }));
    assert.equal(withoutData.geo, undefined);
    assert.equal(withoutData.parentOrganization, undefined);
  }
});

// =============================================================================
// LOCALE STRING HANDLING (DS-I18N)
// =============================================================================

test('LT diacritics pass through display strings untouched', () => {
  const entity = asRecord(churchEntity(base('parish')));
  assert.equal(entity.name, 'Šv. apaštalų Petro ir Povilo bažnyčia'); // ž, Š intact
  const address = asRecord(entity.address);
  assert.equal(address.streetAddress, 'Šv. Stepono g. 15');
});

test('Cyrillic segments pass through display strings untouched (ru pilot)', () => {
  const entity = asRecord(
    churchEntity({
      ...base('orthodox'),
      name: 'Церковь Святого Духа',
      denomination: 'Православная',
    }),
  );
  assert.equal(entity.name, 'Церковь Святого Духа');
});

test('churchSlug folds Cyrillic to ASCII (transliteration policy)', () => {
  assert.equal(churchSlug('Церковь Святого Духа'), 'tserkov-svyatogo-dukha');
});

test('churchSlug folds LT/LV/EE diacritics and hyphenates', () => {
  assert.equal(churchSlug('Šv. apaštalų Petro ir Povilo bažnyčia'), 'sv-apastalu-petro-ir-povilo-baznycia');
  assert.equal(churchSlug('Rīgas Svētā Pētera baznīca'), 'rigas-sveta-petera-baznica');
  assert.equal(churchSlug('Niguliste kirik — ajalooline'), 'niguliste-kirik-ajalooline');
});

// =============================================================================
// HREFLANG RECIPROCITY AROUND CHURCH-LANDING URLS
// (cites the existing reciprocity pattern: buildHreflangSet is reciprocal by
// construction; verifyHreflangReciprocity audits arbitrary page sets)
// =============================================================================

test('church-landing hreflang alternates are reciprocal across pilot locales', () => {
  const slug = churchSlug('Šv. apaštalų Petro ir Povilo bažnyčia');
  const pages = ['lt', 'en', 'ru'].map((locale) =>
    buildHreflangSet(ORIGIN, 't', `/churches/${slug}`, locale),
  );
  assert.deepEqual(verifyHreflangReciprocity(pages), []);
});
