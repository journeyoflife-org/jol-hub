// =============================================================================
// JOL-HUB Federation Hierarchy Types
// 4-tier canonical hierarchy: Federation > Country > Diocese > Parish
// GDPR Article 44: Data residency enforcement via hierarchical context
// =============================================================================

export type FederationTier = 'global' | 'country' | 'diocese' | 'parish';

export interface HierarchyNode {
  id: string;
  tier: FederationTier;
  name: string;
  parentId: string | null;
  countryCode?: string;
  dioceseId?: string;
  parishId?: string;
  children: HierarchyNode[];
}

export interface FederationContext {
  tier: FederationTier;
  entityId: string;
  entityName: string;
  parentEntityId?: string;
  countryCode?: string;
  dataResidencyRegion: EEARegion;
  allowedScopes: HierarchyScope[];
}

// EEA Regions for GDPR Article 44 data residency
export type EEARegion = 
  | 'EU_NORDIC'    // DK, SE, FI
  | 'EU_BALTIC'    // LT, LV, EE
  | 'EU_WESTERN'   // DE, FR, NL, BE, AT, IE, LU
  | 'EU_SOUTHERN'  // IT, ES, PT, GR, CY, MT
  | 'EU_EASTERN';  // PL, CZ, SK, HU, RO, BG, SI, HR

export interface HierarchyScope {
  tier: FederationTier;
  permissions: Permission[];
}

export interface Permission {
  action: 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';
  resource: EntityType;
  constraints?: Record<string, unknown>;
}

export type EntityType = 
  | 'parish'
  | 'diocese'
  | 'country'
  | 'user'
  | 'donation'
  | 'content'
  | 'analytics';

// Tier-specific permission definitions
// SOC2 CC6.1: Role-based access control implementation
export interface TierPermissions {
  global: {
    canViewAll: true;
    canManageCountries: true;
    canConfigureSystem: true;
    canAccessAllData: true;
  };
  country: {
    canViewDioceses: true;
    canManageDioceses: true;
    canViewCountryAnalytics: true;
    restrictedToCountry: true;
  };
  diocese: {
    canViewParishes: true;
    canManageParishes: true;
    canApproveParishes: true;
    restrictedToDiocese: true;
  };
  parish: {
    canManageContent: true;
    canViewParishAnalytics: true;
    canManageDonations: true;
    restrictedToParish: true;
  };
}

export interface BreadcrumbItem {
  tier: FederationTier;
  id: string;
  name: string;
  href: string;
}
