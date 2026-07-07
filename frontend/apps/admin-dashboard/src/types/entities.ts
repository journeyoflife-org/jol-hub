// =============================================================================
// JOL-HUB Entity Types
// Discriminated unions for Catholic vs Commercial entities
// Canon Law CIC 1300-1307: Donation tracking restrictions for Catholic entities
// =============================================================================

import type { FederationTier } from './hierarchy';

export type EntityCategory = 'catholic' | 'commercial';

export interface BaseEntity {
  id: string;
  category: EntityCategory;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  federationTier: FederationTier;
  countryCode: string;
}

export type EntityStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'archived';

// =============================================================================
// Catholic Entities - Subject to Canon Law
// =============================================================================

export interface Parish extends BaseEntity {
  type: 'parish';
  name: string;
  subdomain: string;
  dioceseId: string;
  dioceseName: string;
  contact: ParishContact;
  admin: ParishAdmin;
  canonical: CanonicalInfo;
  theme?: ParishTheme;
  stats?: ParishStats;
}

export interface ParishContact {
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ParishAdmin {
  id: string;
  name: string;
  email: string;
  role: 'parish_admin' | 'parish_priest' | 'parish_editor';
}

// Canon Law CIC 1300-1307: Canonical approval requirements
export interface CanonicalInfo {
  consecrationDate?: string;
  patronSaint?: string;
  diocese: string;
  bishopId: string;
  bishopName?: string;
  canonicalStatus: 'active' | 'suppressed' | 'merged';
  approvalDocuments?: ApprovalDocument[];
}

export interface ApprovalDocument {
  id: string;
  type: 'bishop_approval' | 'vat_license' | 'sacramental_register';
  uploadedAt: string;
  uploadedBy: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ParishTheme {
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  liturgicalColorsEnabled: boolean;
}

export interface ParishStats {
  members: number;
  donations: number;
  pageViews: number;
  lastActivity: string;
}

// Diocese Entity
export interface Diocese extends BaseEntity {
  type: 'diocese';
  name: string;
  bishopName: string;
  bishopId: string;
  countryId: string;
  parishesCount: number;
  establishedDate: string;
}

// Country Entity
export interface CountryEntity extends BaseEntity {
  type: 'country';
  name: string;
  code: string;
  flag: string;
  languages: string[];
  currency: string;
  diocesesCount: number;
  parishesCount: number;
}

// =============================================================================
// Commercial Entities - Subject to VAT/License verification
// =============================================================================

export interface CommercialEntity extends BaseEntity {
  type: 'religious_order' | 'pilgrimage_operator' | 'religious_goods' | 'catholic_media';
  name: string;
  vatNumber: string;
  vatVerified: boolean;
  vatVerifiedAt?: string;
  licenseNumber?: string;
  licenseVerified: boolean;
  contact: CommercialContact;
}

export interface CommercialContact {
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website?: string;
}

// =============================================================================
// User Entity
// =============================================================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  tier: FederationTier;
  entityBindings: EntityBinding[];
  status: 'active' | 'inactive' | 'suspended';
  mfaEnabled: boolean;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

export type AdminRole = 
  | 'super_admin'
  | 'country_admin'
  | 'diocese_admin'
  | 'parish_admin'
  | 'parish_editor'
  | 'support'
  | 'auditor';

export interface EntityBinding {
  entityType: 'parish' | 'diocese' | 'country' | 'global';
  entityId: string;
  entityName: string;
  permissions: string[];
}

// =============================================================================
// List Response Types
// =============================================================================

export interface EntityListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: Record<string, unknown>;
}

// =============================================================================
// Generic Entity Type (for table display)
// =============================================================================

export interface Entity {
  id: string;
  name: string;
  type: string;
  status: string;
  category: EntityCategory;
  country: string;
  countryFlag: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  website?: string;
  description?: string;
  diocese?: string;
  vatNumber?: string;
  verified?: boolean;
  vatVerified?: boolean;
  gdprCompliant?: boolean;
  canonicalApproval?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Re-export User type
export type User = AdminUser;
