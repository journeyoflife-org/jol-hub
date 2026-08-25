/**
 * ContactFormModule — contact form (STEP 6 module).
 *
 * Server wrapper: strips the tenant record to its theming subset before the
 * client boundary (schema never crosses), then renders the client child that
 * owns the submit handler. GDPR consent + privacy link are built into the ui
 * ContactForm.
 */
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { tenantThemeFor, type ModuleProps } from './types';
import { ContactFormClient } from './contact-form-client';

export default function ContactFormModule({ tenant, locale, content, basePath }: ModuleProps) {
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);
  const title =
    typeof content.title === 'string' && content.title.length > 0
      ? content.title
      : translate(messages, 'navigation.contactTitle');

  return (
    <ContactFormClient
      privacyPolicyHref={`${basePath}/privacy`}
      title={title}
      tenant={tenantThemeFor(tenant)}
    />
  );
}
