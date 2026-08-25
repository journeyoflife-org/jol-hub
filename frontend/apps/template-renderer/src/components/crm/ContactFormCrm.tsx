/**
 * ContactFormCrm — STEP 9 (CRM-aware contact form).
 *
 * Extends the base ui ContactForm: on submit it creates a Bitrix24 lead via
 * the SAME-ORIGIN proxy `POST /api/crm/leads` (which forwards through the
 * hub backend → jol-bitrix24-integration). UTM attribution is captured from
 * the current URL and sanitized (sdk `captureUtm`).
 *
 * SECURITY (STEP 9 rules):
 *   - The browser NEVER calls Bitrix24 directly and never sees backend URLs
 *     or tokens — only the same-origin proxy.
 *   - Tenant attribution travels in the validated body (RLS enforced by the
 *     backend).
 *
 * TOKEN ROTATION (90-day cycle, backend-owned): a 503 `auth-rotation`
 * response shows "CRM temporarily unavailable" and AUTO-RETRIES once after a
 * short delay — the rotation window is brief and the retry is transparent.
 *
 * PILOT: when `crmConfigured` is false (no BACKEND_API_URL) the form keeps
 * the existing STEP-6 stub behaviour (resolves successfully) so public
 * contact pages stay functional until the CRM endpoint ships.
 */
'use client';

import { useCallback } from 'react';
import { ContactForm, type ContactFormValues } from '@jol-hub/ui/components/composite';
import { captureUtm } from '@jol-hub/bitrix-sdk';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import type { tenantThemeFor } from '@/modules/types';

/** Client-safe theming shape (matches the server's tenantThemeFor output). */
type ClientTenantTheme = ReturnType<typeof tenantThemeFor>;

/** Delay before the single auto-retry during token rotation (ms). */
const ROTATION_RETRY_DELAY_MS = 1500;

export interface ContactFormCrmProps {
  tenantSlug: string;
  privacyPolicyHref: string;
  /** Server-computed: is the CRM backend path configured? */
  crmConfigured: boolean;
  title?: string;
  tenant?: ClientTenantTheme;
}

interface ProxyResponse {
  reference?: string;
  error?: string;
  retryable?: boolean;
}

async function postLead(body: unknown): Promise<{ status: number; data: ProxyResponse }> {
  const response = await fetch('/api/crm/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ProxyResponse;
  return { status: response.status, data };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ContactFormCrm({
  tenantSlug,
  privacyPolicyHref,
  crmConfigured,
  title,
  tenant,
}: ContactFormCrmProps) {
  const tForms = useTranslations('forms');
  const tCrm = useTranslations('crm');

  const handleSubmit = useCallback(
    async (values: ContactFormValues): Promise<{ ok: boolean; message: string }> => {
      // Pilot: CRM path not configured — keep the STEP-6 stub behaviour.
      if (!crmConfigured) {
        return { ok: true, message: tForms('sent') };
      }

      const payload = {
        tenantSlug,
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        consent: values.consent,
        // UTM attribution — sanitized in the sdk before it leaves the browser.
        utm: typeof window !== 'undefined' ? captureUtm(window.location.search) : undefined,
      };

      let attempt = 0;
      // Initial attempt + at most ONE auto-retry (token-rotation window).
      // eslint-disable-next-line no-constant-condition
      while (true) {
        let result: { status: number; data: ProxyResponse };
        try {
          result = await postLead(payload);
        } catch {
          return { ok: false, message: tCrm('errorGeneric') };
        }

        if (result.status === 201 && result.data.reference) {
          return {
            ok: true,
            message: `${tCrm('successReference', { reference: result.data.reference })} ${tCrm('followUp24h')}`,
          };
        }

        // Token rotation: brief, backend-owned. Auto-retry once.
        if (result.data.error === 'auth-rotation' && attempt === 0) {
          attempt += 1;
          await sleep(ROTATION_RETRY_DELAY_MS);
          continue;
        }
        if (result.data.error === 'auth-rotation') {
          return { ok: false, message: tCrm('rotationRetry') };
        }
        if (result.data.error === 'rate-limit') {
          return { ok: false, message: tCrm('rateLimited') };
        }
        return { ok: false, message: tCrm('errorGeneric') };
      }
    },
    [crmConfigured, tenantSlug, tForms, tCrm],
  );

  return (
    <ContactForm
      onSubmit={handleSubmit}
      privacyPolicyHref={privacyPolicyHref}
      title={title}
      tenant={tenant}
    />
  );
}
