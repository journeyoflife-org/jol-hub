/**
 * RBAC core tests — STEP 10.
 *
 * Covers the tenant-scoped role hierarchy, the permission matrix, MFA gating
 * and defensive IdP-claim parsing. Run via `pnpm --filter @jol-hub/auth test`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasPermission,
  hasRole,
  isAdmin,
  isSuperAdmin,
  mfaRequiredButMissing,
  parseTenantRoles,
  PERMISSION_MATRIX,
  tenantRoleFor,
} from '../rbac';
import type { AuthSession } from '../types';

function session(roles: AuthSession['user']['roles'], extra?: Partial<AuthSession['user']>): AuthSession {
  return {
    user: { sub: 'u1', email: 'u@example.com', roles, mfaEnrolled: false, ...extra },
    expiresAt: Date.now() + 60_000,
  };
}

// =============================================================================
// ROLE HIERARCHY (tenant-scoped)
// =============================================================================

test('hasRole enforces the hierarchy per tenant', () => {
  const s = session([{ tenantSlug: 'church-a', role: 'editor' }]);
  assert.equal(hasRole(s, 'church-a', 'viewer'), true);
  assert.equal(hasRole(s, 'church-a', 'clergy'), true);
  assert.equal(hasRole(s, 'church-a', 'editor'), true);
  assert.equal(hasRole(s, 'church-a', 'admin'), false);
});

test('roles are TENANT-SCOPED: admin of A is nobody in B', () => {
  const s = session([{ tenantSlug: 'church-a', role: 'admin' }]);
  assert.equal(isAdmin(s, 'church-a'), true);
  assert.equal(isAdmin(s, 'church-b'), false);
  assert.equal(hasRole(s, 'church-b', 'viewer'), false);
});

test('a user may hold different roles in different tenants', () => {
  const s = session([
    { tenantSlug: 'church-a', role: 'admin' },
    { tenantSlug: 'church-b', role: 'viewer' },
  ]);
  assert.equal(tenantRoleFor(s, 'church-a')?.role, 'admin');
  assert.equal(tenantRoleFor(s, 'church-b')?.role, 'viewer');
  assert.equal(hasRole(s, 'church-b', 'editor'), false);
});

test('null session denies everything (deny by default)', () => {
  assert.equal(hasRole(null, 'church-a', 'viewer'), false);
  assert.equal(isAdmin(null, 'church-a'), false);
  assert.equal(hasPermission(null, 'church-a', 'content.edit'), false);
});

test('superadmin outranks every tenant role', () => {
  const s = session([], { platformRole: 'superadmin' });
  assert.equal(isSuperAdmin(s), true);
  assert.equal(hasRole(s, 'any-tenant', 'admin'), true);
  assert.equal(hasPermission(s, 'any-tenant', 'users.manage'), true);
});

// =============================================================================
// PERMISSION MATRIX
// =============================================================================

test('viewer is read-only (no permissions)', () => {
  const s = session([{ tenantSlug: 't', role: 'viewer' }]);
  assert.equal(hasPermission(s, 't', 'content.edit'), false);
  assert.equal(hasPermission(s, 't', 'settings.view'), false);
});

test('editor can edit content and view settings but not manage users', () => {
  const s = session([{ tenantSlug: 't', role: 'editor' }]);
  assert.equal(hasPermission(s, 't', 'content.edit'), true);
  assert.equal(hasPermission(s, 't', 'settings.view'), true);
  assert.equal(hasPermission(s, 't', 'users.manage'), false);
  assert.equal(hasPermission(s, 't', 'commerce.manage'), false);
});

test('admin holds the full tenant permission set', () => {
  const s = session([{ tenantSlug: 't', role: 'admin' }]);
  for (const permission of PERMISSION_MATRIX.admin) {
    assert.equal(hasPermission(s, 't', permission), true);
  }
});

test('matrix is monotonic up the hierarchy', () => {
  const order = ['viewer', 'clergy', 'editor', 'admin'] as const;
  for (let i = 1; i < order.length; i += 1) {
    const below = PERMISSION_MATRIX[order[i - 1]!];
    const above = PERMISSION_MATRIX[order[i]!];
    for (const permission of below) {
      assert.ok(above.includes(permission), `${order[i]} must include ${permission}`);
    }
  }
});

// =============================================================================
// MFA GATING (SOC 2 CC6.2)
// =============================================================================

test('admin without MFA is flagged; enrolled admin is not', () => {
  assert.equal(mfaRequiredButMissing(session([{ tenantSlug: 't', role: 'admin' }]), 't'), true);
  assert.equal(
    mfaRequiredButMissing(session([{ tenantSlug: 't', role: 'admin' }], { mfaEnrolled: true }), 't'),
    false,
  );
});

test('non-admin roles do not require MFA', () => {
  assert.equal(mfaRequiredButMissing(session([{ tenantSlug: 't', role: 'editor' }]), 't'), false);
});

// =============================================================================
// CLAIM PARSING (untrusted IdP input)
// =============================================================================

test('parseTenantRoles accepts well-formed grants', () => {
  const parsed = parseTenantRoles([
    { tenant: 'church-a', role: 'admin' },
    { tenantSlug: 'church-b', role: 'viewer' },
  ]);
  assert.deepEqual(parsed, [
    { tenantSlug: 'church-a', role: 'admin' },
    { tenantSlug: 'church-b', role: 'viewer' },
  ]);
});

test('parseTenantRoles drops malformed/hostile entries', () => {
  const parsed = parseTenantRoles([
    { tenant: 'CHURCH-A', role: 'admin' }, // uppercase slug
    { tenant: 'church-a', role: 'superuser' }, // unknown role
    { tenant: '../../../etc', role: 'admin' }, // traversal slug
    'not-an-object',
    null,
    { role: 'admin' }, // missing tenant
  ]);
  assert.deepEqual(parsed, []);
});

test('parseTenantRoles handles non-array input', () => {
  assert.deepEqual(parseTenantRoles(undefined), []);
  assert.deepEqual(parseTenantRoles({ tenant: 'x', role: 'admin' }), []);
  assert.deepEqual(parseTenantRoles('admin'), []);
});
