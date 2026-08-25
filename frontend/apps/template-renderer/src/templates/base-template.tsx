/**
 * BaseTemplate — shared composition base for all vertical templates (STEP 7).
 *
 * One shell, many verticals. It owns the cross-cutting concerns that are
 * IDENTICAL across verticals so the vertical files stay pure composition:
 *  - the `data-vertical` hook + `--vertical-accent` custom property (CSS
 *    targeting / theming),
 *  - baseline structured data (vertical-aware Organization + WebSite),
 *  - the analytics integration point (GDPR consent-gated — inert until a
 *    consented analytics service exists),
 *  - rendering the page's module composition via the STEP 6 PageComposer.
 *
 * Header/Footer chrome is owned by `app/[locale]/[tenant]/layout.tsx` (not
 * re-rendered here); the cookie-consent banner lives there too so it covers
 * every tenant page, not just template-rendered ones.
 *
 * Server component. `tenant` carries `schema` — it never leaves this boundary.
 */
import type { ReactNode } from 'react';
import type { Tenant } from '@jol-hub/tenant-resolver';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { PageConfig } from '@/lib/page-config';
import { PageComposer } from '@/lib/page-composer';
import { JsonLd, websiteEntity, type JsonValue } from '@/lib/json-ld';
import { verticalThemeFor, verticalAccentStyle } from '@/lib/vertical-theme';
import { pickLocalized } from '@/lib/i18n-helpers';
import { buildVerticalHomeConfig } from '@/lib/vertical-defaults';
import { TemplateRenderer } from '@/components/TemplateRenderer';
import type { TemplateProps } from '@/lib/template-registry';

export interface BaseTemplateProps {
  /** Full server-side tenant record (schema present — never forwarded on). */
  tenant: Tenant;
  locale: SupportedLocale;
  /** Tenant URL prefix, e.g. `/lt/siauliai-church`. */
  basePath: string;
  /** Module composition to render (JOL-controlled order). */
  config?: PageConfig;
  /** Optional extra content rendered after the composition. */
  children?: ReactNode;
}

export function BaseTemplate({ tenant, locale, basePath, config, children }: BaseTemplateProps) {
  const theme = verticalThemeFor(tenant.vertical);
  const name = pickLocalized(tenant.name, locale);

  // Baseline structured data with the vertical-specific Organization subtype.
  const org: JsonValue = { '@type': theme.schemaType, name, url: basePath };

  return (
    <div data-vertical={tenant.vertical} style={verticalAccentStyle(tenant.vertical)}>
      <JsonLd data={[org, websiteEntity(name, basePath)]} />

      {/*
        Analytics placeholder (GDPR consent-gated). Intentionally inert: no
        analytics is loaded until the visitor grants the `analytics` consent
        category (managed by the cookie-consent banner in the tenant layout)
        AND a consented analytics provider is configured. Never emit trackers
        by default (ePrivacy Art. 5(3) / GDPR Art. 6).
      */}

      {config ? (
        <PageComposer config={config} tenant={tenant} locale={locale} basePath={basePath} />
      ) : null}
      {children}
    </div>
  );
}

/**
 * Shared vertical-template renderer — the single logic all five pilot
 * vertical templates delegate to (zero duplication; differentiation is the
 * data-driven accent/hero/composition resolved from `tenant.vertical`).
 *
 * Fixture/backend content wins when present (pilot fidelity); otherwise the
 * vertical's default home composition renders. NOTE: deep backend pages will
 * swap the home composition for a fetched page config once that service ships.
 */
export function VerticalHomeTemplate({ tenant, locale, basePath, content, pageData }: TemplateProps) {
  if (content && pageData) {
    return <TemplateRenderer fixture={content} page={pageData} basePath={basePath} />;
  }
  return (
    <BaseTemplate
      tenant={tenant}
      locale={locale}
      basePath={basePath}
      config={buildVerticalHomeConfig(tenant.vertical)}
    />
  );
}
