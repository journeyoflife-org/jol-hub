/**
 * Shared tenant-independent compliance pages (privacy, cookies, consent, DSR).
 *
 * These routes are NOT part of tenant fixtures: they are shared UI that was
 * duplicated across all 12 legacy lt-* apps. Rendering them once here keeps
 * fixtures limited to differentiating content.
 *
 * STEP 4: ALL copy comes from the `compliance` message namespace in the
 * request locale — GDPR Art. 12–14 (information in the data subject's
 * language). Interpolation uses ICU via intl-messageformat (server-safe).
 */
import IntlMessageFormat from 'intl-messageformat';
import { Card, CardContent } from '@jol-hub/ui';
import { getMessages, translate } from '@jol-hub/i18n';
import type { MessageCatalog } from '@jol-hub/i18n';
import type { SupportedLocale } from '@jol-hub/i18n';
import type { TenantFixture } from '@jol-hub/seed-data';
import type { SharedRoute } from '@/lib/content-loader';
import { pickLocalized } from '@/lib/i18n-helpers';

interface SharedCompliancePageProps {
  route: SharedRoute;
  fixture: TenantFixture;
  basePath: string;
  locale: SupportedLocale;
}

/** ICU-format a catalog key with values (server-side). */
function formatKey(
  catalog: MessageCatalog,
  locale: SupportedLocale,
  key: string,
  values: Record<string, string>,
): string {
  const pattern = translate(catalog, key);
  return String(new IntlMessageFormat(pattern, locale).format(values));
}

export function SharedCompliancePage({ route, fixture, locale }: SharedCompliancePageProps) {
  const catalog = getMessages(locale);
  const name = pickLocalized(fixture.name, locale);
  const email = fixture.identity?.email;
  const phone = fixture.identity?.phone;
  const address = fixture.identity?.address;

  const contact = [email, phone].filter(Boolean).join(', ');

  const body: Record<SharedRoute, { titleKey: string; paragraphs: string[] }> = {
    '/privacy': {
      titleKey: 'privacyConsent.policyTitle',
      paragraphs: [
        formatKey(catalog, locale, 'compliance.privacyIntro', { name }),
        translate(catalog, 'compliance.privacySpecialData'),
        email
          ? formatKey(catalog, locale, 'compliance.privacyContact', { contact })
          : translate(catalog, 'compliance.privacyContactGeneric'),
      ],
    },
    '/cookies': {
      titleKey: 'privacyConsent.cookiesTitle',
      paragraphs: [
        translate(catalog, 'compliance.cookiesNecessary'),
        translate(catalog, 'compliance.cookiesNoThirdParty'),
      ],
    },
    '/consent': {
      titleKey: 'privacyConsent.consentTitle',
      paragraphs: [
        translate(catalog, 'compliance.consentManage'),
        translate(catalog, 'compliance.consentVersioning'),
        email
          ? formatKey(catalog, locale, 'compliance.consentHelp', { email })
          : translate(catalog, 'compliance.consentHelpGeneric'),
      ],
    },
    '/dsr': {
      titleKey: 'privacyConsent.dsrTitle',
      paragraphs: [
        translate(catalog, 'compliance.dsrRights'),
        translate(catalog, 'compliance.dsrTimeline'),
        email
          ? formatKey(catalog, locale, 'compliance.dsrSubmit', { email })
          : translate(catalog, 'compliance.dsrSubmitGeneric'),
      ],
    },
  };

  const { titleKey, paragraphs } = body[route];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-heading font-bold text-primary">
        {translate(catalog, titleKey)}
      </h1>
      <Card>
        <CardContent className="p-6 space-y-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
          {address && <p className="text-sm text-gray-500 pt-2 border-t">{address}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
