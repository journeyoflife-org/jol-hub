/**
 * Template registry — STEP 5 link: tenant → template variant.
 *
 * Maps the canonical STEP-5 vertical taxonomy to lazy-loaded template
 * components. Templates are compositions of shared UI with vertical-specific
 * arrangement; selection is driven by `tenant.vertical`, with an optional
 * admin `settings.templateOverride` (gated by the 'template-override'
 * feature, i.e. VIP tier).
 *
 * Lazy loading: templates are resolved via dynamic `import()` so each
 * vertical ships as its own chunk — a funeral visitor never downloads the
 * diocese template.
 */
import type { ComponentType } from 'react';
import type { Tenant, Vertical } from '@jol-hub/tenant-resolver';
import type { TenantFixture, TenantPage, Vertical as FixtureVertical } from '@jol-hub/seed-data';
import type { SupportedLocale } from '@jol-hub/i18n';

/** Props every vertical template receives (server-rendered). */
export interface TemplateProps {
  /** Resolved tenant (server-side record; templates are server components). */
  tenant: Tenant;
  /** Active locale for localized fields. */
  locale: SupportedLocale;
  /** Tenant URL prefix, e.g. `/lt/siauliai-church`. */
  basePath: string;
  /** Fixture content when available (pilot era). */
  content?: TenantFixture;
  /** Resolved page inside `content` (tenant-relative route already matched). */
  pageData?: TenantPage;
}

export type TenantTemplate = ComponentType<TemplateProps>;

type TemplateLoader = () => Promise<{ default: TenantTemplate }>;

/** Vertical → lazy template module. One chunk per template family. */
const TEMPLATE_LOADERS: Record<Vertical, TemplateLoader> = {
  basilica: () => import('@/templates/church-template'),
  cathedral: () => import('@/templates/church-template'),
  diaconate: () => import('@/templates/church-template'),
  church: () => import('@/templates/church-template'),
  protestant: () => import('@/templates/church-template'),
  orthodox: () => import('@/templates/church-template'),
  'other-church': () => import('@/templates/church-template'),
  diocese: () => import('@/templates/diocese-template'),
  deanery: () => import('@/templates/deanery-template'),
  funeral: () => import('@/templates/funeral-template'),
  'cemetery-cleaning': () => import('@/templates/cleaning-template'),
};

/** Stable ids for `settings.templateOverride` (admin customization). */
const TEMPLATE_BY_ID: Record<string, TemplateLoader> = {
  church: () => import('@/templates/church-template'),
  diocese: () => import('@/templates/diocese-template'),
  deanery: () => import('@/templates/deanery-template'),
  funeral: () => import('@/templates/funeral-template'),
  cleaning: () => import('@/templates/cleaning-template'),
};

/**
 * Resolve the template component for a tenant.
 * Honors `settings.templateOverride` ONLY when the tenant's package
 * includes the 'template-override' feature (unknown ids fall back).
 */
export async function getTemplateForTenant(tenant: Tenant): Promise<TenantTemplate> {
  const override = tenant.settings.templateOverride;
  if (typeof override === 'string' && tenant.features.includes('template-override')) {
    const overrideLoader = TEMPLATE_BY_ID[override];
    if (overrideLoader) {
      return (await overrideLoader()).default;
    }
  }
  const loader = TEMPLATE_LOADERS[tenant.vertical] ?? TEMPLATE_LOADERS.church;
  return (await loader()).default;
}

/**
 * Bridge the STEP-5 vertical taxonomy onto the design-system accent tokens
 * (STEP 2), which still use the fixture-era names. Unknown mappings fall
 * back to `undefined` → components use the neutral primary accent.
 */
export function themeVerticalFor(vertical: Vertical): FixtureVertical | undefined {
  switch (vertical) {
    case 'basilica':
      return 'basilica';
    case 'cathedral':
      return 'cathedral';
    case 'diocese':
      return 'diocese';
    case 'deanery':
      return 'deanery';
    case 'church':
    case 'diaconate':
    case 'other-church':
      return 'parish';
    case 'protestant':
      return 'protestant-church';
    case 'orthodox':
      return 'orthodox-church';
    case 'funeral':
      return 'funeral-home';
    case 'cemetery-cleaning':
      return 'cemetery';
    default:
      return undefined;
  }
}
