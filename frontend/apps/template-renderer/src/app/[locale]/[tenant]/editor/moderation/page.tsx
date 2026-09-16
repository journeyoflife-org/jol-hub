/**
 * Moderation queue — STEP 14: /[locale]/[tenant]/editor/moderation.
 *
 * Human decision surface for pending tenant changes. RBAC (defense in
 * depth on top of the middleware authentication gate):
 *   - tenant `admin` role approves/rejects for THIS tenant;
 *   - platform superadmin (JOL staff) overrides in any tenant;
 *   - everyone else → generic 403 (no entitlement leakage).
 *
 * The AI screening result shown in the queue is ADVISORY — the human
 * decision recorded here is final and audit-logged (SOC 2 CC7.2).
 */
import { redirect } from 'next/navigation';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { isAdmin, isSuperAdmin } from '@jol-hub/auth/oidc';
import { getAuthSession, isAuthConfigured } from '@/lib/auth';
import { isEditorConfigured } from '@/lib/editor-client';
import { resolveTenantRoute } from '@/lib/route-dispatch';
import { ModerationQueue } from '@/components/editor';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function EditorModerationPage({
  params,
}: {
  params: { locale: string; tenant: string };
}) {
  const { tenant, locale, basePath } = resolveTenantRoute(params);
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);

  let authorized = false;
  let reviewer = '';

  if (isAuthConfigured()) {
    const session = await getAuthSession();
    if (!session) {
      redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`${basePath}/editor/moderation`)}`);
    }
    // Tenant admin OR platform superadmin — editors submit, admins decide.
    authorized = isAdmin(session, tenant.slug) || isSuperAdmin(session);
    reviewer = session.user.email;
    if (!authorized) {
      redirect('/403-forbidden');
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 font-heading text-2xl font-bold">{translate(messages, 'editor.moderationTitle')}</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        {translate(messages, 'auth.editorModerationNote')}
      </p>
      {!isAuthConfigured() ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          {translate(messages, 'auth.authNotConfigured')}
        </div>
      ) : (
        <ModerationQueue
          tenantSlug={tenant.slug}
          editorConfigured={isEditorConfigured()}
          authorized={authorized}
          reviewer={reviewer}
        />
      )}
    </main>
  );
}
