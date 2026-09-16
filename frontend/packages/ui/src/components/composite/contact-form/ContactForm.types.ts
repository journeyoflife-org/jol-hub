import type { TenantTheme } from '../../../lib/tenant-theme';

/** Props for {@link ContactForm}. */
export interface ContactFormProps {
  /** Async submit handler — return a success/error message. */
  onSubmit: (data: ContactFormValues) => Promise<{ ok: boolean; message: string }>;
  /** Privacy policy URL used in the GDPR consent text. */
  privacyPolicyHref: string;
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Heading override. */
  title?: string;
  /** Extra class name. */
  className?: string;
}

/** Validated form values. */
export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
}
