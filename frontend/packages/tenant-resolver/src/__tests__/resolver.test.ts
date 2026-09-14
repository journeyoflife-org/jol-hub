/**
 * Tenant resolution chain unit tests (STEP 5 "the spine").
 *
 * Covers: hostname/subdomain resolution, X-Tenant dev override,
 * X-Forwarded-Host proxy chains, resolution priority, slug allowlist,
 * unknown-tenant behavior (no enumeration), cache hit/miss, registry
 * integrity (Wave-1 pilots), schema naming (ADR-001) and the client-safe
 * sanitizer.
 *
 * Run: pnpm --filter @jol-hub/tenant-resolver test
 */
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  clearTenantCache,
  resolveTenant,
  resolveTenantCore,
  slugFromHost,
  slugFromHeader,
  tenantResolutionCacheSize,
  toPublicTenant,
  TENANT_HEADER,
} from '../index';
import { findTenantByDomain, findTenantBySlug, TENANTS } from '../registry';
import { FEATURES_BY_TIER, normalizeVertical, schemaForTenant, SLUG_PATTERN } from '../types';

const BASE = 'gyvenimo-kelias.lt';

describe('resolveTenant — subdomain resolution', () => {
  beforeEach(() => clearTenantCache());

  it('resolves a Wave-1 tenant from its subdomain Host', async () => {
    const tenant = await resolveTenant(`siauliai-diocese.${BASE}`, new Headers());
    assert.ok(tenant, 'siauliai-diocese must resolve');
    assert.equal(tenant.slug, 'siauliai-diocese');
    assert.equal(tenant.id, 'siauliai-diocese');
    assert.equal(tenant.vertical, 'diocese');
    assert.equal(tenant.packageTier, 'vip');
    assert.equal(tenant.locale, 'lt');
    assert.equal(tenant.schema, 't_siauliai_diocese');
  });

  it('strips a port from the Host value', async () => {
    const tenant = await resolveTenant(`siauliai-church.${BASE}:3000`, new Headers());
    assert.equal(tenant?.slug, 'siauliai-church');
  });

  it('strips the www. prefix (www.tenant.domain resolves as tenant)', async () => {
    const tenant = await resolveTenant(`www.siauliai-funeral.${BASE}`, new Headers());
    assert.equal(tenant?.slug, 'siauliai-funeral');
  });

  it('returns null for the apex domain (no tenant subdomain)', async () => {
    const tenant = await resolveTenant(BASE, new Headers());
    assert.equal(tenant, null);
  });

  it('returns null for an unknown subdomain (closed lookup, no enumeration)', async () => {
    const tenant = await resolveTenant(`no-such-tenant.${BASE}`, new Headers());
    assert.equal(tenant, null);
  });

  it('returns null for a foreign domain', async () => {
    const tenant = await resolveTenant('example.com', new Headers());
    assert.equal(tenant, null);
  });
});

describe('resolveTenant — X-Tenant header (dev/admin override)', () => {
  beforeEach(() => clearTenantCache());

  it('resolves via X-Tenant on localhost (development mode)', async () => {
    const headers = new Headers();
    headers.set(TENANT_HEADER, 'siauliai-funeral');
    const tenant = await resolveTenant('localhost:3000', headers);
    assert.ok(tenant);
    assert.equal(tenant.slug, 'siauliai-funeral');
    assert.equal(tenant.vertical, 'funeral');
  });

  it('normalizes header slugs (case-insensitive)', async () => {
    const headers = new Headers();
    headers.set(TENANT_HEADER, 'SIAULIAI-DIOCESE');
    const tenant = await resolveTenant('localhost', headers);
    assert.equal(tenant?.slug, 'siauliai-diocese');
  });

  it('rejects slugs violating the allowlist regex', async () => {
    for (const bad of ['../etc', 'foo_bar', 'bad slug', 'a.b', 'evil;DROP']) {
      const headers = new Headers();
      headers.set(TENANT_HEADER, bad);
      const tenant = await resolveTenant('localhost', headers);
      assert.equal(tenant, null, `slug ${JSON.stringify(bad)} must be rejected`);
    }
  });

  it('returns null for an unknown X-Tenant slug', async () => {
    const headers = new Headers();
    headers.set(TENANT_HEADER, 'ghost-tenant');
    const tenant = await resolveTenant('localhost', headers);
    assert.equal(tenant, null);
  });

  it('hostname wins over X-Tenant (resolution order a > c)', async () => {
    const headers = new Headers();
    headers.set(TENANT_HEADER, 'siauliai-funeral');
    const tenant = await resolveTenant(`siauliai-diocese.${BASE}`, headers);
    assert.equal(tenant?.slug, 'siauliai-diocese');
  });
});

describe('resolveTenant — X-Forwarded-Host (Proxmox/nginx chains)', () => {
  beforeEach(() => clearTenantCache());

  it('prefers X-Forwarded-Host over Host', async () => {
    const headers = new Headers();
    headers.set('x-forwarded-host', `siauliai-cleaning.${BASE}`);
    const tenant = await resolveTenant('internal-lb.proxmox.local', headers);
    assert.equal(tenant?.slug, 'siauliai-cleaning');
  });

  it('honors the first hop of a comma-separated X-Forwarded-Host', () => {
    const tenant = resolveTenantCore({
      forwardedHost: `kursenai-church.${BASE}, proxy.local`,
    });
    assert.equal(tenant?.slug, 'kursenai-church');
  });
});

describe('resolution cache', () => {
  beforeEach(() => clearTenantCache());

  it('repeat resolutions are served from cache (no new entry)', async () => {
    const first = await resolveTenant(`joniskis-deanery.${BASE}`, new Headers());
    const second = await resolveTenant(`joniskis-deanery.${BASE}`, new Headers());
    assert.ok(first);
    assert.equal(second?.slug, first.slug);
    // One host → exactly one cache entry, however many requests.
    assert.equal(tenantResolutionCacheSize(), 1);
  });

  it('caches negative results (unknown tenant) consistently', async () => {
    const first = await resolveTenant(`probe-unknown.${BASE}`, new Headers());
    const second = await resolveTenant(`probe-unknown.${BASE}`, new Headers());
    assert.equal(first, null);
    assert.equal(second, null);
    // The null result is cached — enumeration probes stay O(1).
    assert.equal(tenantResolutionCacheSize(), 1);
  });

  it('re-resolves after clearTenantCache()', async () => {
    const before = await resolveTenant(`pakruojis-church.${BASE}`, new Headers());
    assert.equal(tenantResolutionCacheSize(), 1);
    clearTenantCache();
    assert.equal(tenantResolutionCacheSize(), 0);
    const after = await resolveTenant(`pakruojis-church.${BASE}`, new Headers());
    assert.ok(before);
    assert.ok(after);
    // Registry tenants are singletons, so equality is behavioral, not identity.
    assert.deepEqual(after, before);
    assert.equal(tenantResolutionCacheSize(), 1);
  });

  it('keeps distinct cache entries per host|header combination', async () => {
    const byHost = resolveTenantCore({ host: `radviliskis-funeral.${BASE}` });
    const byHeader = resolveTenantCore({ host: 'localhost', xTenant: 'radviliskis-cleaning' });
    assert.equal(byHost?.slug, 'radviliskis-funeral');
    assert.equal(byHeader?.slug, 'radviliskis-cleaning');
    assert.equal(tenantResolutionCacheSize(), 2);
  });
});

describe('slug extraction helpers', () => {
  it('slugFromHost extracts the left-most non-www label', () => {
    assert.equal(slugFromHost(`siauliai-diocese.${BASE}`), 'siauliai-diocese');
    assert.equal(slugFromHost(`www.kelme-deanery.${BASE}:443`), 'kelme-deanery');
    assert.equal(slugFromHost(BASE), null);
    assert.equal(slugFromHost('other.example.com'), null);
    assert.equal(slugFromHost(null), null);
    assert.equal(slugFromHost(''), null);
  });

  it('slugFromHeader reads and validates the X-Tenant header', () => {
    const get = (name: string) => (name === TENANT_HEADER ? 'joniskis-church' : null);
    assert.equal(slugFromHeader(get), 'joniskis-church');
    assert.equal(slugFromHeader(() => 'NOT VALID!'), null);
    assert.equal(slugFromHeader(() => null), null);
  });
});

describe('registry integrity (Wave-1 pilot)', () => {
  it('holds the 21 Wave-1 tenants plus the 12 seed fixtures', () => {
    const wave1 = TENANTS.filter((tenant) => tenant.createdAt === '2026-08-25T00:00:00.000Z');
    assert.ok(wave1.length >= 21, `expected >= 21 Wave-1 tenants, got ${wave1.length}`);
    assert.ok(TENANTS.length >= 33, `expected >= 33 total tenants, got ${TENANTS.length}`);
  });

  it('every slug passes the allowlist and is unique', () => {
    const seen = new Set<string>();
    for (const tenant of TENANTS) {
      assert.ok(SLUG_PATTERN.test(tenant.slug), `invalid slug: ${tenant.slug}`);
      assert.ok(!seen.has(tenant.slug), `duplicate slug: ${tenant.slug}`);
      seen.add(tenant.slug);
    }
  });

  it('schema names follow ADR-001 (t_<id>, underscores only)', () => {
    for (const tenant of TENANTS) {
      assert.match(tenant.schema, /^t_[a-z0-9_]+$/, `bad schema for ${tenant.slug}`);
      assert.equal(tenant.schema, schemaForTenant(tenant.slug));
    }
  });

  it('features are supersets of the tier baseline', () => {
    for (const tenant of TENANTS) {
      for (const feature of FEATURES_BY_TIER[tenant.packageTier]) {
        assert.ok(
          tenant.features.includes(feature),
          `${tenant.slug} (${tenant.packageTier}) missing baseline feature ${feature}`,
        );
      }
    }
  });

  it('spot-checks the pilot spec', () => {
    const diocese = findTenantBySlug('siauliai-diocese');
    assert.equal(diocese?.vertical, 'diocese');
    assert.equal(diocese?.packageTier, 'vip');
    assert.ok(diocese?.features.includes('template-override'));

    const zagare = findTenantBySlug('joniskis-church');
    assert.equal(zagare?.vertical, 'church');
    assert.equal(zagare?.packageTier, 'normal');

    const baisogala = findTenantBySlug('radviliskis-church');
    assert.match(String(baisogala?.name.lt), /Baisogalos/);
  });

  it('closed lookups return null (no registry enumeration)', () => {
    assert.equal(findTenantBySlug('not-a-tenant'), null);
    assert.equal(findTenantByDomain('unknown.example.com'), null);
  });

  it('fixture-derived tenants get canonical verticals', () => {
    const parish = findTenantBySlug('parish-st-john-vilnius');
    assert.ok(parish, 'seed fixture tenant must be in the registry');
    assert.equal(parish.vertical, 'church'); // 'parish' normalized
  });
});

describe('vertical normalization (fixture-era → STEP-5 taxonomy)', () => {
  it('passes canonical values through', () => {
    assert.equal(normalizeVertical('diocese'), 'diocese');
    assert.equal(normalizeVertical('funeral'), 'funeral');
    assert.equal(normalizeVertical('cemetery-cleaning'), 'cemetery-cleaning');
  });

  it('maps fixture-era aliases', () => {
    assert.equal(normalizeVertical('parish'), 'church');
    assert.equal(normalizeVertical('chapel'), 'church');
    assert.equal(normalizeVertical('funeral-home'), 'funeral');
    assert.equal(normalizeVertical('cemetery'), 'cemetery-cleaning');
    assert.equal(normalizeVertical('orthodox-church'), 'orthodox');
    assert.equal(normalizeVertical('protestant-church'), 'protestant');
    assert.equal(normalizeVertical('monastery'), 'other-church');
    assert.equal(normalizeVertical('greek-catholic'), 'other-church');
  });

  it('falls back to other-church for unknown values', () => {
    assert.equal(normalizeVertical('something-else'), 'other-church');
  });
});

describe('toPublicTenant (client-safety)', () => {
  it('strips the schema (server-only secret) and keeps the rest', () => {
    const tenant = findTenantBySlug('siauliai-diocese');
    assert.ok(tenant);
    const publicTenant = toPublicTenant(tenant);
    assert.ok(!('schema' in publicTenant), 'schema must never reach clients');
    assert.equal(publicTenant.slug, tenant.slug);
    assert.equal(publicTenant.vertical, tenant.vertical);
    assert.deepEqual(publicTenant.features, tenant.features);
  });
});
