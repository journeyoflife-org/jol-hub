/**
 * Tenant-scoped RBAC — STEP 10.
 *
 * Pure, framework-agnostic role/permission logic. Fully unit-testable; used
 * by both server guards (middleware/layouts) and client hooks.
 *
 * PERMISSION MATRIX (role → permissions), documented per spec:
 *
 *   viewer  — read-only on their own profile. No content, no settings.
 *   clergy  — content.edit (liturgical content), analytics.view.
 *   editor  — content.edit, analytics.view, settings.view
 *             (10% tenant-controlled content; changes go through the
 *              moderation queue — JOL retains 90% control).
 *   admin   — everything: + commerce.manage, users.manage. MFA REQUIRED
 *             (SOC 2 CC6.2 — privileged access).
 *
 *   superadmin (platform) — all permissions in ALL tenants (JOL staff).
 *
 * Vertical nuances (funeral/diocese/etc.) refine WHICH content types a role
 * touches, not the permission set itself — those live in the backend policy.
 */
import {
  ROLE_RANK,
  type AuthSession,
  type Permission,
  type TenantRole,
  type TenantRoleName,
} from './types';

/** Role → granted permissions (cumulative hierarchy is applied on top). */
export const PERMISSION_MATRIX: Record<TenantRoleName, readonly Permission[]> = {
  viewer: [],
  clergy: ['content.edit', 'analytics.view'],
  editor: ['content.edit', 'analytics.view', 'settings.view'],
  admin: ['content.edit', 'analytics.view', 'settings.view', 'commerce.manage', 'users.manage'],
};

/** True when the session carries a platform superadmin grant. */
export function isSuperAdmin(session: AuthSession | null): boolean {
  return session?.user.platformRole === 'superadmin';
}

/** The user's role grant for ONE tenant, or null when they have none. */
export function tenantRoleFor(session: AuthSession | null, tenantSlug: string): TenantRole | null {
  if (!session) return null;
  return session.user.roles.find((grant) => grant.tenantSlug === tenantSlug) ?? null;
}

/**
 * Hierarchical role check: true when the user holds `minimumRole` OR HIGHER
 * for the tenant. Superadmins pass every tenant check. Null sessions fail.
 */
export function hasRole(
  session: AuthSession | null,
  tenantSlug: string,
  minimumRole: TenantRoleName,
): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  const grant = tenantRoleFor(session, tenantSlug);
  if (!grant) return false;
  return ROLE_RANK[grant.role] >= ROLE_RANK[minimumRole];
}

/** Convenience: tenant admin (or platform superadmin). */
export function isAdmin(session: AuthSession | null, tenantSlug: string): boolean {
  return hasRole(session, tenantSlug, 'admin');
}

/**
 * Permission check through the matrix. Superadmins hold every permission.
 * Unknown tenants/roles yield false (deny by default).
 */
export function hasPermission(
  session: AuthSession | null,
  tenantSlug: string,
  permission: Permission,
): boolean {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  const grant = tenantRoleFor(session, tenantSlug);
  if (!grant) return false;
  return PERMISSION_MATRIX[grant.role].includes(permission);
}

/**
 * SOC 2 CC6.2: privileged roles MUST have MFA enrolled. Returns true when the
 * user's role for the tenant requires MFA and it is NOT enrolled (the UI
 * should force enrollment; the IdP enforces the challenge at login).
 */
export function mfaRequiredButMissing(session: AuthSession | null, tenantSlug: string): boolean {
  if (!session) return false;
  return isAdmin(session, tenantSlug) && !session.user.mfaEnrolled;
}

const VALID_ROLES: readonly TenantRoleName[] = ['admin', 'editor', 'clergy', 'viewer'];

/**
 * Defensive parse of the IdP's tenant-roles claim (`jol:tenant_roles`).
 * Claims are UNTRUSTED input: anything malformed is dropped, role values are
 * allowlist-checked, tenant slugs are pattern-checked. Deny by default.
 */
export function parseTenantRoles(raw: unknown): TenantRole[] {
  if (!Array.isArray(raw)) return [];
  const grants: TenantRole[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    const slug = candidate.tenant ?? candidate.tenantSlug;
    const role = candidate.role;
    if (
      typeof slug === 'string' &&
      /^[a-z0-9-]{1,64}$/.test(slug) &&
      typeof role === 'string' &&
      (VALID_ROLES as readonly string[]).includes(role)
    ) {
      grants.push({ tenantSlug: slug, role: role as TenantRoleName });
    }
  }
  return grants;
}
