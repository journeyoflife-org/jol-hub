/**
 * Mock auth sessions — STEP 15 (tenant-scoped RBAC fixtures).
 *
 * Shape mirrors `@jol-hub/auth/oidc` AuthSession (identity + tenant roles
 * only — tokens NEVER appear in test fixtures either).
 */

/** Local mirror keeps this package free of a hard dependency on auth. */
export interface MockAuthSession {
  user: {
    sub: string;
    email: string;
    name?: string;
    roles: Array<{ tenantSlug: string; role: 'admin' | 'editor' | 'clergy' | 'viewer' }>;
    platformRole?: 'superadmin' | 'support';
    mfaEnrolled: boolean;
  };
  expiresAt: number;
}

export function mockSession(overrides: Partial<MockAuthSession['user']> = {}): MockAuthSession {
  return {
    user: {
      sub: 'user-1',
      email: 'editor@example.com',
      name: 'Test Editor',
      roles: [{ tenantSlug: 'test-church', role: 'editor' }],
      mfaEnrolled: false,
      ...overrides,
    },
    // Deterministic future expiry (tests must not depend on wall time).
    expiresAt: new Date('2099-01-01T00:00:00Z').getTime(),
  };
}

export function mockAdminSession(tenantSlug = 'test-church'): MockAuthSession {
  return mockSession({
    email: 'admin@example.com',
    roles: [{ tenantSlug, role: 'admin' }],
    mfaEnrolled: true,
  });
}

export function mockSuperAdminSession(): MockAuthSession {
  return mockSession({
    email: 'jol-admin@example.com',
    roles: [],
    platformRole: 'superadmin',
    mfaEnrolled: true,
  });
}

export function mockViewerSession(tenantSlug = 'test-church'): MockAuthSession {
  return mockSession({
    email: 'viewer@example.com',
    roles: [{ tenantSlug, role: 'viewer' }],
  });
}
