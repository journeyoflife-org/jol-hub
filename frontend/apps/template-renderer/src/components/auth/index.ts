/**
 * Auth components barrel — STEP 10 (jol-auth OIDC).
 *
 * Session cookies are httpOnly + SameSite=Strict (never JS-readable); all
 * auth traffic goes through the same-origin NextAuth API. See
 * `@jol-hub/auth/oidc` for the RBAC core and options factory.
 */
export { AuthSlot } from './AuthSlot';
export type { AuthSlotProps } from './AuthSlot';
export { LoginButton } from './LoginButton';
export { UserMenu } from './UserMenu';
export type { UserMenuProps } from './UserMenu';
