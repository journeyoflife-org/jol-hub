/**
 * Module component contract — STEP 6.
 *
 * Every module is a SERVER component receiving this standard prop shape.
 * The composer renders modules in sequence. `tenant` is the full server-side
 * record (schema present) — safe here because modules run server-side and
 * must forward only the theming subset (`{ vertical }`) to any client/ui
 * component, never the schema (ADR-001).
 */
import type { ReactElement } from 'react';
import type { Tenant } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { ModuleLayout } from '@/lib/page-config';
import { themeVerticalFor } from '@/lib/template-registry';

export interface ModuleProps {
  /** Full server-side tenant (schema present — server modules only). */
  tenant: Tenant;
  /** Active locale. */
  locale: SupportedLocale;
  /** Module-specific content (from PageConfig `props`). */
  content: Record<string, unknown>;
  /** Module behavior settings (from PageConfig `settings`). */
  settings: Record<string, unknown>;
  /** Layout container chosen by the composer. */
  layout: ModuleLayout;
  /** Tenant URL prefix, e.g. `/lt/siauliai-church`. */
  basePath: string;
}

/** A module renders to a ReactElement (async modules return a Promise). */
export type ModuleComponent = (props: ModuleProps) =>
  | ReactElement
  | null
  | Promise<ReactElement | null>;

/**
 * Client-safe theming subset for ui components. NEVER pass the full tenant
 * (which carries `schema`) into a client/ui component. Structurally matches
 * the ui package's `TenantTheme` (`{ vertical?: VerticalAccentName }`).
 */
export function tenantThemeFor(tenant: Tenant): { vertical: ReturnType<typeof themeVerticalFor> } {
  return { vertical: themeVerticalFor(tenant.vertical) };
}
