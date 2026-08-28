/**
 * Profile page — STEP 10: /[locale]/[tenant]/profile.
 *
 * Shows the authenticated user's identity, their role for THIS tenant
 * (tenant-scoped RBAC), MFA status and the change-password link into
 * jol-auth's account console. Unauthenticated visitors are redirected to
 * sign-in with a return URL; in open mode (pilot) a quiet notice renders.
 *
 * SECURITY: only identity-level data is shown; tokens never reach this page.
 */
import { redirect } from 'next/navigation';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { jolAuthEnv, tenantRoleFor } from '@jol-hub/auth/oidc';
import { getAuthSession, isAuthConfigured } from '@/lib/auth';
import { resolveTenantRoute } from '@/lib/route-dispatch';

export const dynamic = 'force-dynamic';

export const metadata = { robots: { index: false, follow: false } };

export default async function ProfilePage({
  params,
}: {
  params: { locale: string; tenant: string };
}) {
  const { tenant, locale, basePath } = resolveTenantRoute(params);
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);
  const session = await getAuthSession();

  if (isAuthConfigured() && !session) {
    // Return-URL preserving sign-in redirect.
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`${basePath}/profile`)}`);
  }

  if (!isAuthConfigured() || !session) {
    // Open mode (pilot): quiet notice, no fabricated identity.
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="mb-4 font-heading text-2xl font-bold">
          {translate(messages, 'auth.profileTitle')}
        </h1>
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
          {translate(messages, 'auth.authNotConfigured')}
        </p>
      </main>
    );
  }

  const grant = tenantRoleFor(session, tenant.slug);
  const accountUrl = jolAuthEnv().issuer.replace(/\/+$/, '');

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="mb-6 font-heading text-2xl font-bold">
        {translate(messages, 'auth.profileTitle')}
      </h1>

      <dl className="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">
            {translate(messages, 'auth.profileName')}
          </dt>
          <dd className="font-medium">{session.user.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">
            {translate(messages, 'auth.profileEmail')}
          </dt>
          <dd className="font-medium">{session.user.email}</dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">
            {translate(messages, 'auth.profileRole')}
          </dt>
          <dd className="font-medium">
            {grant ? translate(messages, `auth.role_${grant.role}`) : translate(messages, 'auth.noTenantRole')}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">
            {translate(messages, 'auth.profileMfa')}
          </dt>
          <dd className="font-medium">
            {session.user.mfaEnrolled
              ? translate(messages, 'auth.mfaEnabled')
              : translate(messages, 'auth.mfaDisabled')}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex gap-3">
        <a
          href={`${accountUrl}/account`}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          {translate(messages, 'auth.changePassword')}
        </a>
      </div>
    </main>
  );
}
