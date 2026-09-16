/**
 * Commerce capability gating — STEP 8.
 *
 * Commercial modules are package-tier-gated (SOC 2 CC6.1 access control).
 * The tier → feature baseline lives in `@jol-hub/tenant-resolver`
 * (FEATURES_BY_TIER); this helper answers "does this tenant's feature set
 * include a commerce capability?" so components can hide themselves or show
 * an upgrade prompt.
 *
 * Vertical-appropriateness (e.g. booking only for funeral/cleaning) is a
 * COMPOSITION concern — the vertical template decides which commerce modules
 * to include. This helper only answers entitlement.
 */
import type { CommerceCapability } from './types';

/** Feature-flag names used for commerce capabilities (see FEATURES_BY_TIER). */
export const COMMERCE_FEATURES: Record<CommerceCapability, string> = {
  booking: 'booking',
  donations: 'donations',
  shop: 'shop',
  subscriptions: 'subscriptions',
};

/**
 * True when the tenant's effective feature set entitles it to `capability`.
 * Accepts the raw feature array (tenant.features / PublicTenant.features) so
 * it stays usable in both server and client code without importing the tenant
 * record (schema never crosses to the client).
 */
export function hasCommerceCapability(
  features: readonly string[],
  capability: CommerceCapability,
): boolean {
  return features.includes(COMMERCE_FEATURES[capability]);
}

/**
 * Convenience: the subset of commerce capabilities a feature set entitles.
 * Useful for rendering a capability-aware UI.
 */
export function entitledCapabilities(features: readonly string[]): CommerceCapability[] {
  return (Object.keys(COMMERCE_FEATURES) as CommerceCapability[]).filter((capability) =>
    hasCommerceCapability(features, capability),
  );
}
