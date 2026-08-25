/**
 * ContactFormClient — client boundary for the contact form (STEP 6).
 *
 * The ui ContactForm is a client component requiring an `onSubmit` handler,
 * which cannot cross the server→client boundary. This client wrapper owns
 * the handler. All props are serializable primitives — NEVER the tenant
 * record (schema-stripping happens in the server wrapper).
 *
 * PILOT NOTE: the backend contact endpoint is not wired yet; submission
 * resolves successfully as a stub. Replace with a fetch to the tenant contact
 * endpoint when it ships (GDPR consent is already captured by the form).
 */
'use client';

import { ContactForm } from '@jol-hub/ui/components/composite';
import type { ContactFormValues } from '@jol-hub/ui/components/composite';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import type { tenantThemeFor } from './types';

/** Client-safe theming shape (matches the server's tenantThemeFor output). */
type ClientTenantTheme = ReturnType<typeof tenantThemeFor>;

export interface ContactFormClientProps {
  privacyPolicyHref: string;
  title?: string;
  tenant?: ClientTenantTheme;
}

export function ContactFormClient({ privacyPolicyHref, title, tenant }: ContactFormClientProps) {
  const t = useTranslations('forms');

  const handleSubmit = async (_data: ContactFormValues) => {
    // TODO(backend): POST to the tenant contact endpoint with consent context.
    return { ok: true, message: t('sent') };
  };

  return (
    <ContactForm
      onSubmit={handleSubmit}
      privacyPolicyHref={privacyPolicyHref}
      title={title}
      tenant={tenant}
    />
  );
}
