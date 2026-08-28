/**
 * Mock tenant data — STEP 15 (deterministic fixtures, never random).
 */
import type { Tenant } from '@jol-hub/tenant-resolver';

/** A NORMAL-tier church tenant with commerce + editing entitlements. */
export function mockTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'test-church',
    slug: 'test-church',
    name: { lt: 'Šv. Testaus Bažnyčia', en: 'St. Test Church' },
    vertical: 'church',
    schema: 't_test_church', // server-only in production — never rendered
    locale: 'lt',
    packageTier: 'normal',
    domain: null,
    features: ['contact-form', 'donations', 'events', 'news', 'booking', 'content-editing'],
    settings: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** A CHEAP tenant — read-only content, no commerce/editing entitlements. */
export function mockCheapTenant(overrides: Partial<Tenant> = {}): Tenant {
  return mockTenant({
    id: 'test-cheap',
    slug: 'test-cheap',
    packageTier: 'cheap',
    features: ['contact-form', 'service-schedule', 'basic-seo'],
    ...overrides,
  });
}

/** A VIP funeral tenant — full commerce surface. */
export function mockFuneralTenant(overrides: Partial<Tenant> = {}): Tenant {
  return mockTenant({
    id: 'test-funeral',
    slug: 'test-funeral',
    vertical: 'funeral',
    packageTier: 'vip',
    features: [
      'contact-form', 'donations', 'events', 'news', 'booking',
      'content-editing', 'shop', 'subscriptions',
    ],
    ...overrides,
  });
}
