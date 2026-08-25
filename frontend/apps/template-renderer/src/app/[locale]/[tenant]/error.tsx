/**
 * Tenant error boundary — STEP 6.
 *
 * Catches rendering/data errors thrown by any page under `/{locale}/{tenant}`
 * WITHOUT crashing the whole app (the layout chrome stays intact). Client
 * component (required by Next.js for error boundaries).
 *
 * UX per spec: a retry action (re-runs the failed segment), a contact-support
 * link, and an error reference (the production `digest`) so the incident can
 * be correlated in logs. Copy is i18n-driven via the layout's provider.
 *
 * SECURITY: the message is generic — never echo internals or tenant schema.
 */
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from '@jol-hub/i18n/use-translations';
import { reportError } from '@/lib/error-tracking';

interface TenantErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TenantErrorBoundary({ error, reset }: TenantErrorProps) {
  const t = useTranslations('errors');
  const pathname = usePathname();

  // Derive the tenant base path (`/{locale}/{tenant}`) for the support link.
  const segments = pathname.split('/').filter(Boolean);
  const basePath = segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : '/';
  const errorId = error.digest ?? 'n/a';

  useEffect(() => {
    // Surface the digest for log correlation (observability picks up console).
    console.error(`[tenant:error] ${errorId}`, error);
    // STEP 16: report to the telemetry ingress (rendering category, redacted).
    void reportError(error, { route: pathname });
  }, [error, errorId, pathname]);

  return (
    <main role="alert" className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-heading font-bold">{t('errorTitle')}</h1>
        <p className="text-gray-600">{t('generic')}</p>
        <p className="text-xs text-gray-400">
          {t('errorId')}: <code className="select-all">{errorId}</code>
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 font-medium text-white focus-ring"
          >
            {t('retry')}
          </button>
          <a href={`${basePath}/contact`} className="text-primary underline focus-ring rounded">
            {t('contactSupport')}
          </a>
        </div>
      </div>
    </main>
  );
}
