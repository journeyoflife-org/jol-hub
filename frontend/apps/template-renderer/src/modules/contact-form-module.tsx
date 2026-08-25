/**
 * ContactFormModule — contact form (STEP 6 module; STEP 9 CRM-aware).
 *
 * Server wrapper: strips the tenant record to its theming subset before the
 * client boundary (schema never crosses), then renders the CRM-aware client
 * form. Submissions create a Bitrix24 lead through the SAME-ORIGIN proxy
 * `/api/crm/leads` → hub backend → jol-bitrix24-integration; the browser
 * never sees backend URLs or tokens (STEP 9 rules). GDPR consent + privacy
 * link are built into the ui ContactForm.
 */
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { ContactFormCrm } from '@/components/crm';
import { isCrmConfigured } from '@/lib/bitrix-client';
import { tenantThemeFor, type ModuleProps } from './types';

export default function ContactFormModule({ tenant, locale, content, basePath }: ModuleProps) {
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);
  const title =
    typeof content.title === 'string' && content.title.length > 0
      ? content.title
      : translate(messages, 'navigation.contactTitle');

  return (
    <ContactFormCrm
      tenantSlug={tenant.slug}
      privacyPolicyHref={`${basePath}/privacy`}
      crmConfigured={isCrmConfigured()}
      title={title}
      tenant={tenantThemeFor(tenant)}
    />
  );
}
