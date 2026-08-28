/**
 * PageComposer — renders a validated PageConfig's modules in sequence.
 *
 * Responsibilities:
 *  - Order is JOL-controlled (config order); tenants only toggle `visible`.
 *  - Feature gating: a module renders only if the tenant's package entitles
 *    it (registry `requiredFeature`) AND it is visible.
 *  - Layout: each module is wrapped in a container per its `layout` option,
 *    using design-system spacing tokens for a consistent vertical rhythm.
 *
 * The composer is an async server component; async modules (list modules
 * that fetch collections) are awaited by React's RSC rendering.
 */
import type { ReactElement } from 'react';
import type { Tenant } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { Module, ModuleLayout, PageConfig } from './page-config';
import { getModuleComponent, isModuleEntitled } from '@/modules/registry';

export interface PageComposerProps {
  config: PageConfig;
  /** Full server-side tenant (schema present — never forwarded to clients). */
  tenant: Tenant;
  locale: SupportedLocale;
  /** Tenant URL prefix, e.g. `/lt/siauliai-church`. */
  basePath: string;
}

/** Container classes per layout option (design-system spacing tokens). */
const LAYOUT_CLASS: Record<ModuleLayout, string> = {
  'full-width': 'w-full',
  contained: 'container mx-auto px-4',
  'two-column-60-40': 'container mx-auto px-4',
  'two-column-50-50': 'container mx-auto px-4',
  'three-column': 'container mx-auto px-4',
};

/** Vertical rhythm between modules (design-system spacing). */
const MODULE_SPACING = 'py-12 md:py-16';

async function renderModule(
  module: Module,
  tenant: Tenant,
  locale: SupportedLocale,
  basePath: string,
): Promise<ReactElement | null> {
  const Component = getModuleComponent(module.type);
  if (!Component) return null;

  const rendered = await Component({
    tenant,
    locale,
    content: module.props,
    settings: module.settings,
    layout: module.layout,
    basePath,
  });

  // A module may resolve to null (e.g. empty collection) — skip its wrapper
  // entirely so it contributes no whitespace.
  if (rendered === null) return null;

  return (
    <section data-module={module.type} data-module-id={module.id} className={MODULE_SPACING}>
      <div className={LAYOUT_CLASS[module.layout]}>{rendered}</div>
    </section>
  );
}

export async function PageComposer({ config, tenant, locale, basePath }: PageComposerProps) {
  // Visible + entitled modules, in JOL-controlled order.
  const active = config.modules.filter(
    (module) => module.visible !== false && isModuleEntitled(module.type, tenant.features),
  );

  const rendered = await Promise.all(
    active.map((module) => renderModule(module, tenant, locale, basePath)),
  );
  const blocks = rendered.filter((block): block is ReactElement => block !== null);

  if (blocks.length === 0) return null;
  return <div className="flex flex-col">{blocks}</div>;
}
