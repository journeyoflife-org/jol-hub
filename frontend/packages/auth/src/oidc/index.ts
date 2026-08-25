/**
 * jol-auth OIDC barrel — SERVER-SAFE surface (types, RBAC, config, options).
 * Client hooks live behind `@jol-hub/auth/oidc/hooks` so server modules can
 * import this barrel without crossing the React server/client boundary.
 */
export * from './types';
export * from './rbac';
export {
  CLAIMS,
  discoverIssuer,
  isAuthConfigured,
  jolAuthEnv,
  resetDiscoveryCache,
  type OidcDiscovery,
} from './config';
export { buildJolAuthOptions, type JolAuthJwt } from './options';
