/**
 * Global 404 — deliberately generic.
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): this page must never reveal whether
 * a tenant slug exists, list valid tenants, or echo the attempted value.
 * A helpful, tenant-free message is the only allowed disclosure.
 *
 * STEP 4: strings come from the message catalog of the resolved locale
 * (GDPR Art. 12 — information in the user's language, even on errors).
 */
import { headers } from 'next/headers';
import { getMessages, translate, isSupportedLocale } from '@journeyoflife-org/i18n';
import { DEFAULT_LOCALE, LOCALE_HEADER } from '@journeyoflife-org/i18n/config';

export default function NotFound() {
  const headerLocale = headers().get(LOCALE_HEADER);
  const locale = isSupportedLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const messages = getMessages(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="max-w-md space-y-4 text-center">
        <p className="font-heading text-primary text-6xl font-bold">404</p>
        <h1 className="font-heading text-2xl font-bold">
          {translate(messages, 'errors.notFoundTitle')}
        </h1>
        <p className="text-gray-600">{translate(messages, 'errors.notFoundBody')}</p>
      </div>
    </main>
  );
}
