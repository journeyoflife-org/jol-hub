/**
 * ContactForm — GDPR-compliant contact form.
 *
 * - Zod validation: real-time (on blur after first submit) + on submit
 * - `aria-invalid` / `aria-describedby` wiring on every field
 * - Consent checkbox with mandatory privacy-policy link (GDPR Art. 6/7)
 * - Honeypot field (hidden from AT and keyboard) for basic spam defence
 * - Submission results announced via an assertive live region
 * - All user-facing strings from the message catalog (STEP 4)
 */
'use client';

import { useRef, useState } from 'react';
import { z } from 'zod';
import { useTranslations } from '@jol-hub/i18n/use-translations';

import { accentTextClass } from '../../../lib/tenant-theme';
import { LiveRegion } from '../../accessibility/live-region';
import { Button } from '../../primitives/button';
import { Input } from '../../primitives/input';
import { Textarea } from '../../primitives/textarea';
import type { ContactFormProps, ContactFormValues } from './ContactForm.types';

/** Structural contract only — displayed messages come from the catalog. */
export const contactFormSchema = z.object({
  name: z.string().min(2, 'name'),
  email: z.string().email('email'),
  phone: z
    .string()
    .regex(/^[+\d][\d\s()-]{0,20}$/, 'phone')
    .or(z.literal('')),
  message: z.string().min(10, 'message'),
  consent: z.literal(true, { errorMap: () => ({ message: 'consent' }) }),
});

/** Zod field path → validation.* message key. */
const FIELD_ERROR_KEYS: Record<keyof ContactFormValues, string> = {
  name: 'nameRequired',
  email: 'emailInvalid',
  phone: 'phoneInvalid',
  message: 'messageTooShort',
  consent: 'consentRequired',
};

type FieldErrors = Partial<Record<keyof ContactFormValues, string>>;

export function ContactForm({ onSubmit, privacyPolicyHref, tenant, title, className }: ContactFormProps) {
  const tForms = useTranslations('forms');
  const tValidation = useTranslations('validation');
  const tErrors = useTranslations('errors');
  const tConsent = useTranslations('privacyConsent');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const validate = (form: HTMLFormElement): FieldErrors => {
    const data = new FormData(form);
    const parsed = contactFormSchema.safeParse({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      message: String(data.get('message') ?? ''),
      consent: data.get('consent') === 'on',
    });
    if (parsed.success) return {};
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactFormValues;
      if (!fieldErrors[key]) fieldErrors[key] = tValidation(FIELD_ERROR_KEYS[key]);
    }
    return fieldErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setAttempted(true);
    setStatus(null);

    // Honeypot filled → silently pretend success (do not reveal detection).
    if (honeypotRef.current?.value) {
      setStatus({ ok: true, message: tForms('sent') });
      return;
    }

    const fieldErrors = validate(event.currentTarget);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      setStatus({ ok: false, message: tValidation('formHasErrors') });
      return;
    }

    const data = new FormData(event.currentTarget);
    const values: ContactFormValues = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      phone: String(data.get('phone') ?? ''),
      message: String(data.get('message') ?? ''),
      consent: data.get('consent') === 'on',
    };

    setSubmitting(true);
    try {
      const result = await onSubmit(values);
      setStatus(result);
      if (result.ok) event.currentTarget.reset();
    } catch {
      setStatus({ ok: false, message: tErrors('sendFailed') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLFormElement>): void => {
    if (!attempted) return;
    setErrors(validate(event.currentTarget));
  };

  return (
    <form onSubmit={handleSubmit} onBlur={handleBlur} noValidate className={className}>
      {title && (
        <h2 className="mb-4 font-heading text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{title}</h2>
      )}
      <div className="flex flex-col gap-4">
        {/* Honeypot — hidden from humans and assistive technology. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="contact-website">
            {tForms('websiteLabel')}
            <input
              ref={honeypotRef}
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>

        <Input id="contact-name" name="name" label={tForms('nameLabel')} required error={errors.name} autoComplete="name" />
        <Input id="contact-email" name="email" label={tForms('emailLabel')} type="email" required error={errors.email} autoComplete="email" />
        <Input id="contact-phone" name="phone" label={tForms('phoneLabel')} type="tel" error={errors.phone} autoComplete="tel" />
        <Textarea id="contact-message" name="message" label={tForms('messageLabel')} required error={errors.message} />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <input
              id="contact-consent"
              name="consent"
              type="checkbox"
              aria-required="true"
              aria-invalid={errors.consent ? true : undefined}
              aria-describedby={errors.consent ? 'contact-consent-error' : undefined}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary focus-ring dark:border-neutral-700"
            />
            <label htmlFor="contact-consent" className="text-sm text-neutral-700 dark:text-neutral-200">
              {tConsent('consentTextBefore')}{' '}
              <a href={privacyPolicyHref} className={accentTextClass(tenant)}>
                {tConsent('policyLinkLabel')}
              </a>
              {tConsent('consentTextAfter')}
            </label>
          </div>
          {errors.consent && (
            <p id="contact-consent-error" className="text-sm text-error-700 dark:text-error-400">
              {errors.consent}
            </p>
          )}
        </div>

        <Button type="submit" loading={submitting} tenant={tenant} className="self-start">
          {submitting ? tForms('sending') : tForms('submit')}
        </Button>
      </div>

      <LiveRegion politeness="assertive" message={status?.message ?? ''} />
    </form>
  );
}
