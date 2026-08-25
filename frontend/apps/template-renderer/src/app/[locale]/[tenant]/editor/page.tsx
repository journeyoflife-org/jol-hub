/**
 * Editor area — STEP 10: /[locale]/[tenant]/editor (10% tenant control).
 *
 * Block-editor surface for tenant-managed content. GUARD: editor role or
 * higher for THIS tenant (viewers/clergy are redirected to the generic 403).
 * All submissions flow through the moderation queue — JOL retains 90%
 * control; nothing publishes directly.
 *
 * PILOT: no content backend — the page renders the guarded shell with an
 * empty state. No fabricated blocks/media.
 */
import { redirect } from 'next/navigation';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { hasRole } from '@jol-hub/auth/oidc';
import { getAuthSession, isAuthConfigured } from '@/lib/auth';
import { resolveTenantRoute } from '@/lib/route-dispatch';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function EditorPage({
  params,
}: {
  params: { locale: string; tenant: string };
}) {
  const { tenant, locale, basePath } = resolveTenantRoute(params);
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);

  if (isAuthConfigured()) {
    const session = await getAuthSession();
    if (!session) {
      redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`${basePath}/editor`)}`);
    }
    // Editor-or-higher gate (clergy/viewer insufficient for block editing).
    if (!hasRole(session, tenant.slug, 'editor')) {
      redirect('/403-forbidden');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 font-heading text-2xl font-bold">{translate(messages, 'auth.editorTitle')}</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        {translate(messages, 'auth.editorModerationNote')}
      </p>

      <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
        {isAuthConfigured()
          ? translate(messages, 'auth.editorEmpty')
          : translate(messages, 'auth.authNotConfigured')}
      </div>
    </main>
  );
}
