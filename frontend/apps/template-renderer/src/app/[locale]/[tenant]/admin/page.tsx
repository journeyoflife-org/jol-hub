/**
 * Admin dashboard — STEP 10: /[locale]/[tenant]/admin.
 *
 * Role-aware overview: content moderation queue, analytics, settings and
 * user management. Sections render ONLY when the session's tenant role
 * carries the matching permission (RBAC matrix, `@jol-hub/auth/oidc`).
 *
 * PILOT: with no backend data plane the sections render structured empty
 * states — nothing is fabricated. Tenant admins missing MFA see the SOC 2
 * CC6.2 enrollment prompt.
 */
import { getMessages, translate, translateWithValues, isSupportedLocale } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';
import {
  hasPermission,
  mfaRequiredButMissing,
  tenantRoleFor,
  type Permission,
} from '@jol-hub/auth/oidc';
import { getAuthSession, isAuthConfigured } from '@/lib/auth';
import { resolveTenantRoute } from '@/lib/route-dispatch';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminDashboardPage({
  params,
}: {
  params: { locale: string; tenant: string };
}) {
  const { tenant, locale, basePath } = resolveTenantRoute(params);
  const effectiveLocale = isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
  const messages = getMessages(effectiveLocale);

  if (!isAuthConfigured()) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-4 font-heading text-2xl font-bold">{translate(messages, 'auth.adminTitle')}</h1>
        <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
          {translate(messages, 'auth.authNotConfigured')}
        </p>
      </main>
    );
  }

  const session = await getAuthSession();
  // Guarded by the layout; this satisfies TS narrowing only.
  if (!session) return null;

  const grant = tenantRoleFor(session, tenant.slug);
  const sections: { key: string; permission: Permission; anchor?: string }[] = [
    { key: 'sectionModeration', permission: 'content.edit' },
    { key: 'sectionAnalytics', permission: 'analytics.view' },
    { key: 'sectionSettings', permission: 'settings.view', anchor: 'settings' },
    { key: 'sectionUsers', permission: 'users.manage' },
  ];
  const visible = sections.filter((section) => hasPermission(session, tenant.slug, section.permission));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">{translate(messages, 'auth.adminTitle')}</h1>
        {grant ? (
          <span className="rounded-full bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {translate(messages, `auth.role_${grant.role}`)}
          </span>
        ) : null}
      </div>

      {/* SOC 2 CC6.2: privileged access requires MFA enrollment. */}
      {mfaRequiredButMissing(session, tenant.slug) ? (
        <p className="mb-6 rounded-md border border-warning-300 bg-warning-50 p-4 text-sm text-warning-800 dark:border-warning-700 dark:bg-warning-900 dark:text-warning-100">
          {translate(messages, 'auth.mfaRequiredNotice')}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((section) => (
          <section
            key={section.key}
            id={section.anchor}
            aria-label={translate(messages, `auth.${section.key}`)}
            className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h2 className="mb-2 font-heading text-lg font-semibold">
              {translate(messages, `auth.${section.key}`)}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {translate(messages, 'auth.sectionEmpty')}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
        {translateWithValues(messages, effectiveLocale, 'auth.rbacNote', { tenant: tenant.slug })}
      </p>
      <p className="mt-2 text-xs">
        <a href={`${basePath}/editor`} className="underline">
          {translate(messages, 'auth.editorLink')}
        </a>
      </p>
    </main>
  );
}
