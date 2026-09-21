import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { clearTenantCache, resolveTenant } from '../index';
import { findTenantByDomain, TENANTS } from '../registry';

describe('domain resolution from fixture identity.domain', () => {
  beforeEach(() => clearTenantCache());

  it('populates TENANT_BY_DOMAIN from fixture identity.domain', () => {
    // basilica-vilnius-cathedral has identity.domain = 'katedra.lt'
    const tenant = findTenantByDomain('katedra.lt');
    assert.ok(tenant, 'katedra.lt must resolve');
    assert.equal(tenant.slug, 'basilica-vilnius-cathedral');
  });

  it('resolves tenant from custom domain hostname', async () => {
    const tenant = await resolveTenant('katedra.lt', new Headers());
    assert.ok(tenant);
    assert.equal(tenant.slug, 'basilica-vilnius-cathedral');
  });

  it('domain resolution is case-insensitive', () => {
    const t1 = findTenantByDomain('KATEDRA.LT');
    const t2 = findTenantByDomain('katedra.lt');
    assert.deepEqual(t1, t2);
  });

  it('returns null for unknown domain (no enumeration)', () => {
    const tenant = findTenantByDomain('not-a-real-domain.example.com');
    assert.equal(tenant, null);
  });
});

describe('registry count SSOT (B1)', () => {
  it('TENANTS array contains all Wave-1 pilots plus fixture-derived tenants', () => {
    // Count is derived from source data, not hardcoded in comments
    assert.ok(TENANTS.length >= 33, `expected >= 33 tenants, got ${TENANTS.length}`);
  });
});
