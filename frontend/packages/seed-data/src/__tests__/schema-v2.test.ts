import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GovernanceSchema, TenantFixtureSchema, TENANT_FIXTURE_SCHEMA } from '../schema';

describe('GovernanceSchema (v2)', () => {
  it('accepts valid governance metadata', () => {
    const result = GovernanceSchema.safeParse({
      sourceUrl: 'https://www.katedra.lt/about',
      verifiedDate: '2026-09-01',
      verifier: 'admin@katedra.lt',
      approvalStatus: 'approved',
      nextReviewDate: '2027-09-01',
    });
    assert.ok(result.success);
  });

  it('rejects missing required fields (sourceUrl, verifiedDate, approvalStatus)', () => {
    const result = GovernanceSchema.safeParse({ verifier: 'x' });
    assert.ok(!result.success);
  });

  it('rejects invalid approvalStatus values', () => {
    const result = GovernanceSchema.safeParse({
      sourceUrl: 'https://example.com',
      verifiedDate: '2026-09-01',
      approvalStatus: 'bogus',
    });
    assert.ok(!result.success);
  });

  it('accepts expired nextReviewDate (warning only, not blocking)', () => {
    const result = GovernanceSchema.safeParse({
      sourceUrl: 'https://example.com',
      verifiedDate: '2020-01-01',
      approvalStatus: 'approved',
      nextReviewDate: '2021-01-01',
    });
    assert.ok(result.success);
  });
});

describe('LocalizedTextSchema — pl field (v2)', () => {
  it('accepts pl as optional locale in LocalizedText', () => {
    const result = TenantFixtureSchema.safeParse({
      slug: 'test-parish',
      vertical: 'parish',
      locale: 'lt',
      name: { lt: 'LT', en: 'EN', pl: 'PL' },
      tagline: { lt: 'LT' },
      pages: [{ route: '/', title: { lt: 'Tit' }, contentBlocks: [] }],
      governance: {
        sourceUrl: 'https://example.com',
        verifiedDate: '2026-09-01',
        approvalStatus: 'approved',
      },
    });
    if (!result.success) console.error(result.error);
    assert.ok(result.success);
  });
});

describe('TENANT_FIXTURE_SCHEMA version', () => {
  it('bumps to v2', () => {
    assert.equal(TENANT_FIXTURE_SCHEMA, 'tenant-fixture/v2');
  });
});
