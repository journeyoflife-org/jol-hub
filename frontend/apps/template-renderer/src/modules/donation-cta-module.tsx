/**
 * DonationCtaModule — donation widget (STEP 6 module).
 *
 * COMMERCIAL ENTITLEMENT: rendered only when the tenant's package includes
 * the `donations` feature (NORMAL/VIP). CHEAP tenants never see it.
 * Stripe is not wired in the pilot (see ADR-007); the widget shows a
 * pending-payments notice via the ui DonationWidget.
 */
import { DonationWidget } from '@jol-hub/ui/components/composite';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { tenantThemeFor, type ModuleProps } from './types';

export default function DonationCtaModule({ tenant, locale }: ModuleProps) {
  // Package gating — the 90/10 model: JOL controls entitlements.
  if (!tenant.features.includes('donations')) return null;

  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);
  const title = translate(messages, 'commerce.donateTitle');

  return <DonationWidget title={title} tenant={tenantThemeFor(tenant)} />;
}
