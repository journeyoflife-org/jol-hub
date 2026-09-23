import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateTenantPages } from '../page-archetypes';
import { TenantFixtureSchema, TenantPageSchema } from '../schema';
import type { TenantFixture } from '../schema';

/** Minimal valid fixture for archetype testing. */
function makeFixture(overrides: Partial<TenantFixture> = {}): TenantFixture {
  const base = {
    slug: 'test-parish',
    vertical: 'parish' as const,
    locale: 'lt',
    name: { lt: 'Test Parish', en: 'Test Parish EN' },
    tagline: { lt: 'Test tagline', en: 'Test tagline EN' },
    identity: {
      entityId: 'test-001',
      jurisdiction: 'Test Diocese',
      established: '1500',
      address: 'Test g. 1, Vilnius',
      email: 'test@example.lt',
      phone: '+370 5 000 0000',
    },
    governance: {
      sourceUrl: 'https://example.com',
      verifiedDate: '2026-09-01',
      approvalStatus: 'approved' as const,
    },
    pages: [{ route: '/', title: { lt: 'Pradžia' }, contentBlocks: [] }],
    ...overrides,
  };
  return TenantFixtureSchema.parse(base);
}

describe('generateTenantPages', () => {
  it('produces exactly 5 pages for a sacred-family tenant', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    assert.equal(pages.length, 5);
  });

  it('produces pages with correct routes', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    const routes = pages.map((p) => p.route);
    assert.deepStrictEqual(routes, ['/', '/about', '/contact', '/services', '/schedule']);
  });

  it('every page has at least one content block', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    for (const page of pages) {
      assert.ok(
        page.contentBlocks.length >= 1,
        `Page ${page.route} has no content blocks`
      );
    }
  });

  it('all generated pages validate against TenantPageSchema', () => {
    const fixture = makeFixture({ vertical: 'cemetery' });
    const pages = generateTenantPages(fixture);
    for (const page of pages) {
      const result = TenantPageSchema.safeParse(page);
      assert.ok(result.success, `Page ${page.route} failed validation: ${result.error}`);
    }
  });

  it('home page for sacred vertical includes massSchedule block', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    const home = pages.find((p) => p.route === '/')!;
    const hasMassSchedule = home.contentBlocks.some((b) => b.type === 'massSchedule');
    assert.ok(hasMassSchedule, 'sacred home page should include massSchedule');
  });

  it('home page for memorial vertical includes list block (not massSchedule)', () => {
    const fixture = makeFixture({ vertical: 'cemetery' });
    const pages = generateTenantPages(fixture);
    const home = pages.find((p) => p.route === '/')!;
    const hasList = home.contentBlocks.some((b) => b.type === 'list');
    const hasMassSchedule = home.contentBlocks.some((b) => b.type === 'massSchedule');
    assert.ok(hasList, 'memorial home page should include list');
    assert.ok(!hasMassSchedule, 'memorial home page should NOT include massSchedule');
  });

  it('about page for sacred vertical includes clergyRoleList', () => {
    const fixture = makeFixture({ vertical: 'parish' });
    const pages = generateTenantPages(fixture);
    const about = pages.find((p) => p.route === '/about')!;
    const hasClergy = about.contentBlocks.some((b) => b.type === 'clergyRoleList');
    assert.ok(hasClergy, 'sacred about page should include clergyRoleList');
  });

  it('about page for administrative vertical includes visitingInfo (not clergyRoleList)', () => {
    const fixture = makeFixture({ vertical: 'diocese' });
    const pages = generateTenantPages(fixture);
    const about = pages.find((p) => p.route === '/about')!;
    const hasVisiting = about.contentBlocks.some((b) => b.type === 'visitingInfo');
    const hasClergy = about.contentBlocks.some((b) => b.type === 'clergyRoleList');
    assert.ok(hasVisiting, 'administrative about page should include visitingInfo');
    assert.ok(!hasClergy, 'administrative about page should NOT include clergyRoleList');
  });

  it('works for all 12 verticals without throwing', () => {
    const verticals = [
      'parish',
      'basilica',
      'cathedral',
      'chapel',
      'monastery',
      'orthodox-church',
      'greek-catholic',
      'diocese',
      'deanery',
      'cemetery',
      'funeral-home',
      'protestant-church',
    ] as const;
    for (const vertical of verticals) {
      const fixture = makeFixture({ vertical });
      const pages = generateTenantPages(fixture);
      assert.equal(pages.length, 5, `${vertical} should produce 5 pages`);
    }
  });
});
