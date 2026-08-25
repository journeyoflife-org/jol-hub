/**
 * jol-auth OIDC session types — STEP 10.
 *
 * Tenant-user identity for the template renderer (public / parishioner /
 * clergy / tenant admin). Distinct from the Bitrix24 staff auth elsewhere in
 * this package.
 *
 * SECURITY (SOC 2 CC6.1, OWASP ASVS L2):
 *   - Roles are TENANT-SCOPED: a user can be admin of Church A and viewer of
 *     Church B. There are no global tenant roles.
 *   - Tokens NEVER appear in these types as carried values — the session
 *     surface exposed to the client contains identity + roles only.
 *   - RS256 trajectory: upstream ID-token signatures are verified against the
 *     issuer JWKS (handled by next-auth); hub's own session JWT is signed
 *     with NEXTAUTH_SECRET.
 */

/** Tenant-scoped role names. */
export type TenantRoleName = 'admin' | 'editor' | 'clergy' | 'viewer';

/** Platform-level role (JOL staff) — above every tenant role. */
export type PlatformRole = 'superadmin' | 'support';

/** A role grant bound to ONE tenant (RLS-friendly). */
export interface TenantRole {
  /** Public tenant identifier (slug). */
  tenantSlug: string;
  role: TenantRoleName;
}

/** Authenticated user as exposed to the client (NO tokens). */
export interface AuthUser {
  /** OIDC subject — stable user id from jol-auth. */
  sub: string;
  email: string;
  name?: string;
  /** Tenant-scoped grants. */
  roles: TenantRole[];
  /** Platform role (JOL staff) when present. */
  platformRole?: PlatformRole;
  /** True once TOTP/WebAuthn is enrolled (MFA). */
  mfaEnrolled: boolean;
}

/** Session shape consumed by UI + guards. */
export interface AuthSession {
  user: AuthUser;
  /** Session expiry — epoch milliseconds. */
  expiresAt: number;
}

/**
 * Role hierarchy (per spec: viewer < editor < admin; clergy sits between
 * viewer and editor — liturgical/content duties without settings access).
 * `superadmin` is platform-level and outranks every tenant role.
 */
export const ROLE_RANK: Record<TenantRoleName, number> = {
  viewer: 1,
  clergy: 2,
  editor: 3,
  admin: 4,
};

/** Permissions gated by the RBAC matrix (see rbac.ts). */
export type Permission =
  | 'content.edit'
  | 'settings.view'
  | 'commerce.manage'
  | 'users.manage'
  | 'analytics.view';

/** Claim name jol-auth uses for tenant role grants (contract with the IdP). */
export const TENANT_ROLES_CLAIM = 'jol:tenant_roles';

/** Claim name for the MFA flag (`amr`-supplementary). */
export const MFA_ENROLLED_CLAIM = 'jol:mfa_enrolled';
