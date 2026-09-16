/**
 * 403 Forbidden target — STEP 10 (RBAC insufficient role).
 *
 * Server guards redirect here when an AUTHENTICATED user lacks the required
 * tenant role. The body is deliberately GENERIC (no role names, no tenant
 * details) so probes cannot map entitlements across tenants (SOC 2 CC6.1).
 * The middleware-level role gate answers with a real HTTP 403 status; this
 * page is the layout-level fallback (defense in depth).
 */
import { getMessages, translate } from '@jol-hub/i18n';
import { DEFAULT_LOCALE } from '@jol-hub/i18n/config';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  const messages = getMessages(DEFAULT_LOCALE);
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="max-w-md space-y-4 text-center">
        <p className="font-heading text-6xl font-bold text-primary">403</p>
        <h1 className="font-heading text-2xl font-bold">{translate(messages, 'auth.forbiddenTitle')}</h1>
        <p className="text-gray-600">{translate(messages, 'auth.forbiddenText')}</p>
      </div>
    </main>
  );
}
