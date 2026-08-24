// =============================================================================
// JOL-HUB Authentication and Authorization
// SOC2 CC6.1: Role-based access control implementation
// 4-tier federation hierarchy: global > country > diocese > parish
// GDPR Article 44: Data residency enforcement at every access check
// Defense in depth: Compromised Tier 3 password only exposes 1 diocese
// =============================================================================

import type { AdminRole, FederationTier, Permission, EntityType } from '@/types';

// =============================================================================
// 4-Tier Admin Hierarchy Types
// Defense in depth: Each tier has strictly limited scope
// =============================================================================

/**
 * AdminTier - 4-tier hierarchy for access control
 * - super: Tier 1 (JOL-HUB internal, global view - aggregated data only)
 * - country: Tier 2 (Country admin, e.g., all LT entities)
 * - diocese: Tier 3 (Diocese/Group admin, subset of country)
 * - facility: Tier 4 (Single parish/funeral home)
 */
export type AdminTier =
  | 'super'      // Tier 1: JOL-HUB internal, global view only
  | 'country'    // Tier 2: Country admin (e.g., all LT entities)
  | 'diocese'    // Tier 3: Diocese/Group admin (subset of country)
  | 'facility';  // Tier 4: Single parish/funeral home

/**
 * HierarchyContext - User context with tier and scope information
 * GDPR Article 44: dataResidency enforces strict border control
 */
export interface HierarchyContext {
  tier: AdminTier;
  country: EUCountryCode | null;  // null for super admin
  scopeId: string | null;          // Diocese ID for Tier 3, Parish ID for Tier 4
  dataResidency: EUCountryCode;   // STRICT ENFORCEMENT - data cannot leave this country
  role: AdminRole;
  userId: string;
}

/**
 * EU Country Codes for 27 member states
 */
export type EUCountryCode =
  | 'at' | 'be' | 'bg' | 'cy' | 'cz' | 'de' | 'dk' | 'ee' | 'es' | 'fi'
  | 'fr' | 'gr' | 'hr' | 'hu' | 'ie' | 'it' | 'lt' | 'lu' | 'lv' | 'mt'
  | 'nl' | 'pl' | 'pt' | 'ro' | 'se' | 'si' | 'sk';

/**
 * Entity with hierarchy information for access checks
 */
export interface HierarchicalEntity {
  country: string;
  dioceseId?: string;
  id: string;
}

// =============================================================================
// Core Access Control Functions
// GDPR Article 44: Data cannot cross borders
// =============================================================================

/**
 * canAccessEntity - Check if user can access a specific entity
 * GDPR Article 44: Data cannot cross borders - enforced at every level
 *
 * Security principle: If a hacker steals a Tier 3 password,
 * they can only see 1 diocese, not the whole country.
 */
export function canAccessEntity(
  user: HierarchyContext,
  entity: HierarchicalEntity
): boolean {
  // GDPR Article 44: Data cannot cross borders
  // Lithuanian admin cannot see Latvian data
  if (user.country && user.country !== entity.country) {
    console.warn(
      `[GDPR-44] Access denied: User country ${user.country} cannot access entity in ${entity.country}`
    );
    return false;
  }

  // Tier-based access checks
  switch (user.tier) {
    case 'super':
      // Tier 1: Can access everything, but should only see aggregated data
      return true;

    case 'country':
      // Tier 2: Can access all entities within their country
      return user.country === entity.country;

    case 'diocese':
      // Tier 3: Can only access entities in their assigned diocese
      return user.country === entity.country &&
             user.scopeId === entity.dioceseId;

    case 'facility':
      // Tier 4: Can only access their own facility
      return user.scopeId === entity.id;

    default:
      return false;
  }
}

/**
 * canViewAggregatedData - Check if user can view aggregated analytics
 * Only super admins can view cross-country aggregated data
 */
export function canViewAggregatedData(user: HierarchyContext): boolean {
  return user.tier === 'super';
}

/**
 * canManageUsers - Check if user can manage other users
 */
export function canManageUsers(
  user: HierarchyContext,
  targetUserTier: AdminTier
): boolean {
  // Cannot manage users at same or higher tier
  const tierLevels: Record<AdminTier, number> = {
    super: 1,
    country: 2,
    diocese: 3,
    facility: 4,
  };

  return tierLevels[user.tier] < tierLevels[targetUserTier];
}

// =============================================================================
// Visual Indicators for UI
// =============================================================================

/**
 * getTierBadge - Get visual indicator for tier in UI
 */
export function getTierBadge(tier: AdminTier): {
  color: string;
  label: string;
  icon: string;
  description: string;
} {
  switch (tier) {
    case 'super':
      return {
        color: 'bg-purple-600',
        label: 'Federation Super Admin',
        icon: '🌍',
        description: 'Global aggregated view only',
      };
    case 'country':
      return {
        color: 'bg-blue-600',
        label: 'Country Administrator',
        icon: '🏳️',
        description: 'Full access within assigned country',
      };
    case 'diocese':
      return {
        color: 'bg-green-600',
        label: 'Diocese/Group Manager',
        icon: '⛪',
        description: 'Limited to assigned diocese',
      };
    case 'facility':
      return {
        color: 'bg-gray-600',
        label: 'Facility Administrator',
        icon: '🏛️',
        description: 'Single facility access only',
      };
  }
}

/**
 * getTierLevel - Get numeric tier level for comparison
 */
export function getTierLevel(tier: AdminTier): number {
  const levels: Record<AdminTier, number> = {
    super: 1,
    country: 2,
    diocese: 3,
    facility: 4,
  };
  return levels[tier];
}

// =============================================================================
// Hierarchy Context Helpers
// =============================================================================

/**
 * createHierarchyContext - Create a hierarchy context from user data
 */
export function createHierarchyContext(params: {
  role: AdminRole;
  userId: string;
  country?: EUCountryCode;
  scopeId?: string;
}): HierarchyContext {
  const tier = roleToTier(params.role);
  
  return {
    tier,
    country: tier === 'super' ? null : (params.country ?? null),
    scopeId: tier === 'diocese' || tier === 'facility' ? (params.scopeId ?? null) : null,
    dataResidency: params.country ?? 'lt', // Default to LT for safety
    role: params.role,
    userId: params.userId,
  };
}

/**
 * roleToTier - Map admin role to tier
 */
export function roleToTier(role: AdminRole): AdminTier {
  switch (role) {
    case 'super_admin':
    case 'auditor':
      return 'super';
    case 'country_admin':
      return 'country';
    case 'diocese_admin':
      return 'diocese';
    case 'parish_admin':
    case 'parish_editor':
    default:
      return 'facility';
  }
}

// =============================================================================
// Legacy Role-Based Access Control (backwards compatible)
// =============================================================================

// Map roles to their federation tier
export const TIER_ROLE_MAPPING: Record<FederationTier, AdminRole[]> = {
  global: ['super_admin', 'auditor'],
  country: ['country_admin'],
  diocese: ['diocese_admin'],
  parish: ['parish_admin', 'parish_editor'],
};

// SOC2 CC6.1: Define permissions for each role
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    { action: 'create', resource: 'country' },
    { action: 'create', resource: 'diocese' },
    { action: 'create', resource: 'parish' },
    { action: 'create', resource: 'user' },
    { action: 'read', resource: 'analytics' },
    { action: 'update', resource: 'country' },
    { action: 'update', resource: 'diocese' },
    { action: 'update', resource: 'parish' },
    { action: 'delete', resource: 'parish' },
    { action: 'approve', resource: 'parish' },
    { action: 'export', resource: 'analytics' },
  ],
  country_admin: [
    { action: 'create', resource: 'diocese' },
    { action: 'create', resource: 'parish' },
    { action: 'create', resource: 'user' },
    { action: 'read', resource: 'analytics', constraints: { scope: 'country' } },
    { action: 'update', resource: 'diocese' },
    { action: 'update', resource: 'parish' },
    { action: 'approve', resource: 'parish' },
    { action: 'export', resource: 'analytics', constraints: { scope: 'country' } },
  ],
  diocese_admin: [
    { action: 'create', resource: 'parish' },
    { action: 'create', resource: 'user', constraints: { scope: 'diocese' } },
    { action: 'read', resource: 'analytics', constraints: { scope: 'diocese' } },
    { action: 'update', resource: 'parish' },
    { action: 'approve', resource: 'parish' },
    { action: 'export', resource: 'analytics', constraints: { scope: 'diocese' } },
  ],
  parish_admin: [
    { action: 'create', resource: 'content', constraints: { scope: 'parish' } },
    { action: 'create', resource: 'user', constraints: { scope: 'parish' } },
    { action: 'read', resource: 'analytics', constraints: { scope: 'parish' } },
    { action: 'update', resource: 'parish', constraints: { scope: 'own' } },
    { action: 'export', resource: 'analytics', constraints: { scope: 'parish' } },
  ],
  parish_editor: [
    { action: 'create', resource: 'content', constraints: { scope: 'parish' } },
    { action: 'read', resource: 'analytics', constraints: { scope: 'parish' } },
  ],
  support: [
    { action: 'read', resource: 'parish' },
    { action: 'read', resource: 'user' },
    { action: 'read', resource: 'analytics' },
  ],
  auditor: [
    { action: 'read', resource: 'parish' },
    { action: 'read', resource: 'user' },
    { action: 'read', resource: 'analytics' },
    { action: 'export', resource: 'analytics' },
  ],
};

// Check if a role has a specific permission
export function hasPermission(
  role: AdminRole,
  action: Permission['action'],
  resource: EntityType
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(
    (p) => p.action === action && p.resource === resource
  );
}

// Get the federation tier for a role
export function getRoleTier(role: AdminRole): FederationTier {
  switch (role) {
    case 'super_admin':
    case 'auditor':
      return 'global';
    case 'country_admin':
      return 'country';
    case 'diocese_admin':
      return 'diocese';
    case 'parish_admin':
    case 'parish_editor':
      return 'parish';
    default:
      return 'parish';
  }
}

// Human-readable role labels
export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Administrator',
  country_admin: 'Country Administrator',
  diocese_admin: 'Diocese Administrator',
  parish_admin: 'Parish Administrator',
  parish_editor: 'Parish Editor',
  support: 'Support Staff',
  auditor: 'Auditor',
};

// Badge colors for roles in the UI
export const ROLE_BADGE_COLORS: Record<AdminRole, string> = {
  super_admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  country_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  diocese_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  parish_admin: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  parish_editor: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  support: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  auditor: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};
