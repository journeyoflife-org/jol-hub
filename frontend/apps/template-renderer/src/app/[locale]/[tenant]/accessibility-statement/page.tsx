/**
 * Accessibility statement — STEP 12: /[locale]/[tenant]/accessibility-statement.
 *
 * Published per tenant in all pilot languages (EU Accessibility Act 2025
 * practice): conformance claim (WCAG 2.2 AA), measures, known limitations
 * with workarounds, feedback channel, assessment method + date.
 *
 * The statement is BOILERPLATE platform content — tenant-specific details
 * (the institution name) are interpolated, never fabricated beyond the
 * registry/fixture identity.
 */
import type { Metadata } from 'next';
import {
  getMessages,
  translate,
  translateWithValues,
  isSupportedLocale,
} from '@journeyoflife-org/i18n';
import { DEFAULT_LOCALE } from '@journeyoflife-org/i18n/config';
import { buildTenantMetadata, tenantDisplayName } from '@/lib/page-seo';
import { resolveTenantRoute } from '@/lib/route-dispatch';

/** Date of the latest accessibility assessment (kept with the audit doc). */
const ASSESSMENT_DATE = '2026-08-25';

export const revalidate = 3600;

interface TenantA11yStatementParams {
  locale: string;
  tenant: string;
}

export async function generateMetadata({
  params,
}: {
  params: TenantA11yStatementParams;
}): Promise<Metadata> {
  const { tenant, fixture, locale } = resolveTenantRoute(params);
  const messages = getMessages(locale);
  const name = tenantDisplayName(tenant, fixture, locale);
  return buildTenantMetadata({
    tenant,
    fixture,
    locale,
    route: '/accessibility-statement',
    title: translate(messages, 'accessibilityStatement.pageTitle'),
    description: `${translate(messages, 'accessibilityStatement.intro')} ${name}`,
  });
}

export default async function TenantAccessibilityStatementPage({
  params,
}: {
  params: TenantA11yStatementParams;
}) {
  const { tenant, fixture, locale, basePath } = resolveTenantRoute(params);
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);
  const name = tenantDisplayName(tenant, fixture, effectiveLocale);

  const section = (titleKey: string, textKey: string, values?: Record<string, string>) => (
    <section className="mt-8">
      <h2 className="font-heading text-primary text-xl font-bold">
        {translate(messages, titleKey)}
      </h2>
      <p className="mt-3 leading-relaxed text-gray-700">
        {values
          ? translateWithValues(messages, effectiveLocale, textKey, values)
          : translate(messages, textKey)}
      </p>
    </section>
  );

  return (
    <article className="container mx-auto max-w-3xl px-4 py-12">
      <header>
        <h1 className="font-heading text-primary text-3xl font-bold md:text-4xl">
          {translate(messages, 'accessibilityStatement.pageTitle')}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-gray-700">
          {translate(messages, 'accessibilityStatement.intro')} <strong>{name}</strong>.
        </p>
      </header>

      {section('accessibilityStatement.conformanceTitle', 'accessibilityStatement.conformanceText')}
      {section('accessibilityStatement.measuresTitle', 'accessibilityStatement.measuresText')}
      {section('accessibilityStatement.limitationsTitle', 'accessibilityStatement.limitationsText')}

      <section className="mt-8">
        <h2 className="font-heading text-primary text-xl font-bold">
          {translate(messages, 'accessibilityStatement.feedbackTitle')}
        </h2>
        <p className="mt-3 leading-relaxed text-gray-700">
          {translate(messages, 'accessibilityStatement.feedbackText')}
        </p>
        <a
          href={`${basePath}/contact`}
          className="bg-primary focus-ring mt-4 inline-block rounded-md px-6 py-3 font-medium text-white"
        >
          {translate(messages, 'accessibilityStatement.feedbackCta')}
        </a>
      </section>

      {section('accessibilityStatement.assessmentTitle', 'accessibilityStatement.assessmentText', {
        date: ASSESSMENT_DATE,
      })}
    </article>
  );
}
