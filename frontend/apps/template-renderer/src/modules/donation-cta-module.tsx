/**
 * DonationCtaModule — donation widget (STEP 6 module; STEP 8 commerce form).
 *
 * COMMERCIAL ENTITLEMENT: rendered only when the tenant's package includes
 * the `donations` feature (NORMAL/VIP). CHEAP tenants never see it.
 * Stripe is not wired in the pilot (see ADR-007); the form shows a
 * pending-payments notice. The rich STEP-8 DonationForm (amount presets,
 * frequency, GDPR consent, anonymous option) is a client component and
 * self-gates via `useTenantFeature('donations')`.
 */
import { DonationForm } from '@/components/commerce';
import { isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import type { ModuleProps } from './types';

export default function DonationCtaModule({ tenant, locale }: ModuleProps) {
  // Package gating — the 90/10 model: JOL controls entitlements.
  if (!tenant.features.includes('donations')) return null;

  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;

  return <DonationForm locale={effectiveLocale} />;
}
