/**
 * Editor area — STEP 10 guard, STEP 14 surface: /[locale]/[tenant]/editor.
 *
 * Constrained block editor for the tenant's designated 10% content +
 * quarantine-first media uploader. GUARDS (defense in depth — middleware
 * enforces authentication, this page enforces role + entitlement):
 *   - tenant `editor` role or higher (viewers/clergy → generic 403);
 *   - `content-editing` feature: NORMAL/VIP tenants only — CHEAP tenants
 *     get the read-only notice (spec TASK 8).
 *
 * Nothing here publishes directly: drafts autosave (30s) and publishing
 * submits to the moderation queue (AI screening + human decision).
 */
import { redirect } from 'next/navigation';
import { getMessages, translate, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import { hasRole } from '@jol-hub/auth/oidc';
import { getAuthSession, isAuthConfigured } from '@/lib/auth';
import { isEditorConfigured } from '@/lib/editor-client';
import { resolveTenantRoute } from '@/lib/route-dispatch';
import { BlockEditor, MediaUploader } from '@/components/editor';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

/** The designated editable region id (JOL controls WHICH blocks are editable). */
const EDITABLE_PAGE_ID = 'tenant-editable';

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

  const editingEntitled = tenant.features.includes('content-editing');

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 font-heading text-2xl font-bold">{translate(messages, 'auth.editorTitle')}</h1>
      <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        {translate(messages, 'auth.editorModerationNote')}
      </p>

      {!editingEntitled ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-700">
          {translate(messages, 'editor.readOnlyTier')}
        </div>
      ) : (
        <div className="space-y-12">
          <BlockEditor
            tenantSlug={tenant.slug}
            pageId={EDITABLE_PAGE_ID}
            editorConfigured={isEditorConfigured()}
            basePath={basePath}
          />
          <section aria-labelledby="media-uploader-heading">
            <h2 id="media-uploader-heading" className="mb-3 font-heading text-xl font-semibold">
              {translate(messages, 'editor.mediaSectionTitle')}
            </h2>
            <MediaUploader tenantSlug={tenant.slug} editorConfigured={isEditorConfigured()} />
          </section>
        </div>
      )}
    </main>
  );
}
