/**
 * Tenant resolution contract — STEP 5 ("the spine").
 *
 * Chain: domain/subdomain → tenant → schema → template variant → locale
 * → content.
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1 / CC6.3):
 * - `schema` is a SERVER-ONLY value (ADR-001 schema-per-tenant + RLS).
 *   It travels exclusively in server-side request headers and MUST NEVER
 *   be serialized into client payloads.
 * - `id` here is the public slug — database IDs are never used in URLs.
 */
import type { LocalizedText } from '@jol-hub/seed-data';

/**
 * Canonical vertical taxonomy (STEP 5 contract).
 *
 * Note: 'deanery' is added to the STEP-5 list because the Wave-1 pilot
 * itself contains deanery tenants (e.g. siauliai-deanery); fixture-era
 * verticals are normalized into this set via {@link normalizeVertical}.
 */
export type Vertical =
  | 'basilica'
  | 'cathedral'
  | 'diocese'
  | 'diaconate'
  | 'deanery'
  | 'church'
  | 'protestant'
  | 'orthodox'
  | 'other-church'
  | 'funeral'
  | 'cemetery-cleaning';

/** Subscription tier — drives feature gating (useTenantFeature). */
export type PackageTier = 'cheap' | 'normal' | 'vip';

export interface TenantSettings {
  /** Admin-selected template override (future; registry default today). */
  templateOverride?: string;
  [key: string]: unknown;
}

/** The full resolution-chain tenant object. */
export interface Tenant {
  /** Public identifier — always the slug (never a database ID). */
  id: string;
  /** URL-safe slug; validated against SLUG_PATTERN. */
  slug: string;
  /** Localized display name. */
  name: LocalizedText;
  /** Canonical vertical (template variant selector). */
  vertical: Vertical;
  /**
   * PostgreSQL schema, format `t_<id>` (ADR-001).
   * SERVER-ONLY — never expose to the client.
   */
  schema: string;
  /** Default locale for the tenant (content language). */
  locale: string;
  /** Package tier (CHEAP/NORMAL/VIP). */
  packageTier: PackageTier;
  /** Custom domain (exact-hostname resolution). Null = subdomain-only. */
  domain: string | null;
  /** Effective feature flags (tier baseline + per-tenant overrides). */
  features: string[];
  /** Tenant-specific settings (template overrides, branding, …). */
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

/** Allowlist for tenant slugs — anything else is rejected pre-lookup. */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/** Schema naming per ADR-001: t_<id> with dashes folded to underscores. */
export function schemaForTenant(slug: string): string {
  return `t_${slug.replace(/-/g, '_')}`;
}

/** Feature baselines per package tier (supersets downwards). */
export const FEATURES_BY_TIER: Record<PackageTier, string[]> = {
  cheap: ['contact-form', 'service-schedule', 'basic-seo'],
  normal: [
    'contact-form',
    'service-schedule',
    'basic-seo',
    'donations',
    'gallery',
    'events',
    'news',
  ],
  vip: [
    'contact-form',
    'service-schedule',
    'basic-seo',
    'donations',
    'gallery',
    'events',
    'news',
    'custom-domain',
    'analytics',
    'api-access',
    'template-override',
  ],
};

/**
 * Normalize a fixture-era vertical (seed-data taxonomy) into the canonical
 * STEP-5 taxonomy. Canonical values pass through unchanged.
 */
export function normalizeVertical(vertical: string): Vertical {
  switch (vertical) {
    case 'basilica':
    case 'cathedral':
    case 'diocese':
    case 'diaconate':
    case 'deanery':
    case 'church':
    case 'protestant':
    case 'orthodox':
    case 'other-church':
    case 'funeral':
    case 'cemetery-cleaning':
      return vertical;
    // Fixture-era aliases → canonical
    case 'parish':
    case 'chapel':
      return 'church';
    case 'monastery':
    case 'greek-catholic':
      return 'other-church';
    case 'cemetery':
      return 'cemetery-cleaning';
    case 'funeral-home':
      return 'funeral';
    case 'orthodox-church':
      return 'orthodox';
    case 'protestant-church':
      return 'protestant';
    default:
      return 'other-church';
  }
}
