/**
 * SEO core tests — STEP 11.
 *
 * Covers canonical normalization, hreflang reciprocity, description clamping,
 * robots policy, sitemap sharding/policy, JSON-LD required fields, OG
 * fallback and IndexNow payload building.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { absoluteCanonical, normalizeRoute, sameCanonical, sanitizeOrigin } from '../canonical';
import { buildHreflangSet, PILOT_HREFLANG, verifyHreflangReciprocity } from '../hreflang';
import { autoDescription, clampDescription, DESCRIPTION_MAX, robotsPolicyFor, tenantTitleTemplate } from '../metadata';
import { isSitemapKind, lastmodIso, shardUrls, SITEMAP_MAX_URLS, SITEMAP_POLICY } from '../sitemap';
import { ROBOTS_DISALLOW, robotsDirectives } from '../robots';
import { faqPageEntity, localBusinessEntity, productEntity, websiteWithSearchEntity } from '../structured-data';
import { ogImagePath, resolveOgImage, twitterCardFor } from '../open-graph';
import { buildIndexNowPayload, INDEXNOW_MAX_URLS } from '../indexing';
import type { Json } from '../types';

const ORIGIN = 'https://baznycia.lt';

// =============================================================================
// CANONICALS
// =============================================================================

test('normalizeRoute strips query/fragment and trailing slash', () => {
  assert.equal(normalizeRoute('/news/foo?utm_source=x#comments'), '/news/foo');
  assert.equal(normalizeRoute('news/foo/'), '/news/foo');
  assert.equal(normalizeRoute('//about//'), '/about');
  assert.equal(normalizeRoute('/'), '/');
});

test('sanitizeOrigin rejects paths and normalizes case/slash', () => {
  assert.equal(sanitizeOrigin('HTTPS://Example.COM/'), 'https://example.com');
  assert.throws(() => sanitizeOrigin('https://example.com/path'));
  assert.throws(() => sanitizeOrigin('not-a-url'));
});

test('absoluteCanonical builds absolute URLs', () => {
  assert.equal(absoluteCanonical(ORIGIN, '/lt/t/news/a?u=1'), `${ORIGIN}/lt/t/news/a`);
  assert.equal(absoluteCanonical(ORIGIN, '/'), `${ORIGIN}/`);
});

test('sameCanonical ignores query/case/trailing slash', () => {
  assert.equal(sameCanonical('https://A.lt/x/?u=1', 'https://a.lt/x'), true);
  assert.equal(sameCanonical('https://a.lt/x', 'https://a.lt/y'), false);
});

// =============================================================================
// HREFLANG
// =============================================================================

test('hreflang set is absolute, complete and has x-default → lt', () => {
  const set = buildHreflangSet(ORIGIN, 'siauliai-church', '/news/a', 'en');
  assert.equal(set.canonical, `${ORIGIN}/en/siauliai-church/news/a`);
  assert.equal(set.languages['lt-LT'], `${ORIGIN}/lt/siauliai-church/news/a`);
  assert.equal(set.languages['en-LT'], `${ORIGIN}/en/siauliai-church/news/a`);
  assert.equal(set.languages['ru-LT'], `${ORIGIN}/ru/siauliai-church/news/a`);
  assert.equal(set.languages['x-default'], `${ORIGIN}/lt/siauliai-church/news/a`);
});

test('hreflang is reciprocal by construction across locales', () => {
  const pages = ['lt', 'en', 'ru'].map((locale) =>
    buildHreflangSet(ORIGIN, 't', '/about', locale),
  );
  assert.deepEqual(verifyHreflangReciprocity(pages), []);
});

test('hreflang reciprocity audit detects one-way links', () => {
  const good = buildHreflangSet(ORIGIN, 't', '/', 'lt');
  const broken = { ...good, canonical: `${ORIGIN}/en/t`, languages: { 'lt-LT': `${ORIGIN}/lt/t` } };
  const violations = verifyHreflangReciprocity([good, broken]);
  assert.ok(violations.length > 0);
});

test('pilot hreflang matrix is lt-LT/en-LT/ru-LT', () => {
  assert.deepEqual(
    PILOT_HREFLANG.map((entry) => entry.hreflang),
    ['lt-LT', 'en-LT', 'ru-LT'],
  );
});

// =============================================================================
// METADATA POLICY
// =============================================================================

test('title template follows "%s | {tenant}"', () => {
  const template = tenantTitleTemplate('Šiaulių katedra');
  assert.equal(template.template, '%s | Šiaulių katedra');
  assert.equal(template.default, 'Šiaulių katedra');
});

test('clampDescription keeps <= 160 chars on a word boundary', () => {
  const long = 'žodis '.repeat(40);
  const clamped = clampDescription(long);
  assert.ok(clamped.length <= DESCRIPTION_MAX + 1); // +1 for the ellipsis
  assert.ok(clamped.endsWith('…'));
});

test('clampDescription passes short descriptions through', () => {
  assert.equal(clampDescription('Trumpas aprašymas.'), 'Trumpas aprašymas.');
});

test('autoDescription returns undefined for empty content', () => {
  assert.equal(autoDescription(undefined), undefined);
  assert.equal(autoDescription('   '), undefined);
});

test('robots policy: public index,follow; privileged noindex', () => {
  for (const kind of ['home', 'news-article', 'event-detail', 'about', 'contact'] as const) {
    assert.deepEqual(robotsPolicyFor(kind), { index: true, follow: true }, kind);
  }
  for (const kind of ['admin', 'editor', 'api'] as const) {
    assert.deepEqual(robotsPolicyFor(kind), { index: false, follow: false }, kind);
  }
});

// =============================================================================
// SITEMAP
// =============================================================================

test('sitemap policy matches the spec (home/news/events priorities)', () => {
  assert.deepEqual(SITEMAP_POLICY.home, { changefreq: 'daily', priority: 1.0 });
  assert.deepEqual(SITEMAP_POLICY['news-article'], { changefreq: 'daily', priority: 0.8 });
  assert.deepEqual(SITEMAP_POLICY['event-detail'], { changefreq: 'hourly', priority: 0.9 });
  assert.deepEqual(SITEMAP_POLICY.about, { changefreq: 'monthly', priority: 0.5 });
});

test('privileged kinds are excluded from sitemaps', () => {
  assert.equal(isSitemapKind('admin'), false);
  assert.equal(isSitemapKind('editor'), false);
  assert.equal(isSitemapKind('home'), true);
});

test('shardUrls respects the 50k limit', () => {
  const urls = Array.from({ length: SITEMAP_MAX_URLS + 10 }, (_, i) => `https://x.lt/${i}`);
  const shards = shardUrls(urls);
  assert.equal(shards.length, 2);
  assert.equal(shards[0]?.length, SITEMAP_MAX_URLS);
  assert.equal(shards[1]?.length, 10);
});

test('lastmodIso normalizes dates and rejects garbage', () => {
  assert.match(lastmodIso(new Date('2026-01-02T03:04:05Z')) ?? '', /^2026-01-02T03:04:05/);
  assert.equal(lastmodIso('not-a-date'), undefined);
  assert.equal(lastmodIso(undefined), undefined);
});

// =============================================================================
// ROBOTS
// =============================================================================

test('robots disallows privileged areas and query variants', () => {
  for (const path of ['/admin', '/editor', '/api/', '/*?*']) {
    assert.ok(ROBOTS_DISALLOW.includes(path), path);
  }
});

test('robotsDirectives covers a single * agent with allow + disallow', () => {
  const directives = robotsDirectives();
  assert.equal(directives.userAgent, '*');
  assert.ok(directives.allow.includes('/'));
  assert.ok(directives.disallow.length > 0);
});

// =============================================================================
// STRUCTURED DATA (Rich Results required fields)
// =============================================================================

function asRecord(value: Json): Record<string, Json> {
  return value as Record<string, Json>;
}

test('localBusinessEntity carries name/url/address/geo/phone', () => {
  const entity = asRecord(
    localBusinessEntity({
      type: 'FuneralHome',
      name: 'Laidojimo namai',
      url: 'https://x.lt/lt/t',
      address: { addressLocality: 'Šiauliai', postalCode: '76100' },
      geo: { latitude: 55.93, longitude: 23.31 },
      telephone: '+370 600 00000',
    }),
  );
  assert.equal(entity['@type'], 'FuneralHome');
  assert.equal(entity['@context'], 'https://schema.org');
  assert.ok(entity.name);
  assert.ok(entity.url);
  assert.ok(entity.address);
  assert.ok(entity.geo);
  assert.ok(entity.telephone);
  const address = asRecord(entity.address as Json);
  assert.equal(address['@type'], 'PostalAddress');
  assert.equal(address.addressCountry, 'LT');
});

test('productEntity includes offers with VAT-inclusive price', () => {
  const entity = asRecord(productEntity({ name: 'Gėlės', url: 'https://x.lt/p/1', price: '12.10' }));
  assert.equal(entity['@type'], 'Product');
  const offers = asRecord(entity.offers as Json);
  assert.equal(offers.price, '12.10');
  assert.equal(offers.priceCurrency, 'EUR');
  const spec = asRecord(offers.priceSpecification as Json);
  assert.equal(spec.valueAddedTaxIncluded, true);
});

test('faqPageEntity builds Question/Answer pairs', () => {
  const entity = asRecord(faqPageEntity([{ question: 'Kada?', answer: 'Sekmadieniais.' }]));
  assert.equal(entity['@type'], 'FAQPage');
  const main = entity.mainEntity as Json[];
  const first = asRecord(main[0] as Json);
  assert.equal(first['@type'], 'Question');
  assert.ok(first.acceptedAnswer);
});

test('websiteWithSearchEntity includes SearchAction', () => {
  const entity = asRecord(websiteWithSearchEntity('X', 'https://x.lt', 'https://x.lt/search?q={search_term_string}'));
  assert.equal(entity['@type'], 'WebSite');
  const action = asRecord(entity.potentialAction as Json);
  assert.equal(action['@type'], 'SearchAction');
});

// =============================================================================
// OG + INDEXNOW
// =============================================================================

test('OG image fallback chain: tenant image > generated > omitted', () => {
  assert.equal(
    resolveOgImage({ tenantImage: 'https://x.lt/logo.png', generationEnabled: true, tenantSlug: 't', route: '/' }),
    'https://x.lt/logo.png',
  );
  assert.equal(
    resolveOgImage({ generationEnabled: true, tenantSlug: 't', route: '/news/a' }),
    ogImagePath('t', '/news/a'),
  );
  assert.equal(resolveOgImage({ generationEnabled: false, tenantSlug: 't', route: '/' }), undefined);
});

test('twitter card follows image availability', () => {
  assert.equal(twitterCardFor('https://x.lt/og.png').card, 'summary_large_image');
  assert.equal(twitterCardFor(undefined).card, 'summary');
});

test('IndexNow payload caps at 10k URLs and builds keyLocation', () => {
  const urls = Array.from({ length: INDEXNOW_MAX_URLS + 5 }, (_, i) => `https://x.lt/${i}`);
  const payload = buildIndexNowPayload({ host: 'x.lt', key: 'k1', urls });
  assert.equal(payload.urlList.length, INDEXNOW_MAX_URLS);
  assert.equal(payload.keyLocation, 'https://x.lt/indexnow-key.txt');
});
