/**
 * Root layout — tenant-agnostic shell.
 *
 * STEP 2 (Design System):
 * - Wraps the app in the JOL `ThemeProvider` (light/dark/system).
 * - Inlines `THEME_INIT_SCRIPT` before first paint — no theme FOUT.
 * - Sets `lang` dynamically from the resolved tenant's locale (lt/en/ru
 *   path; unknown/unresolved requests fall back to `lt`).
 * - Fonts: system-first token stacks (Inter / Source Serif 4 preferred);
 *   no build-time webfont fetch — the build environment is offline and
 *   fallbacks keep every tenant deterministic. Webfonts can be vendored
 *   later via `next/font/local` without changing the token contract.
 *
 * Tenant identity (name, nav, contacts) is rendered by `app/[tenant]/layout.tsx`.
 */
import type { Metadata } from 'next';
import '@jol-hub/ui/styles/tokens.css';
import '@jol-hub/ui/styles/globals.css';
import './globals.css';

import { ThemeProvider, THEME_INIT_SCRIPT } from '@jol-hub/ui/providers';
import { resolveCurrentTenant } from '@/lib/tenant-resolver';
import { loadTenantFixture } from '@/lib/content-loader';

export const metadata: Metadata = {
  title: {
    default: 'JOL-HUB',
    template: '%s | JOL-HUB',
  },
  description: 'Journey Of Life multi-tenant platform',
  authors: [{ name: 'JOL-HUB' }],
  // SECURITY: no tenant hints in default metadata (no enumeration).
};

/** Resolve the document language from the tenant locale (default: lt). */
function resolveDocumentLang(): string {
  const tenant = resolveCurrentTenant();
  if (!tenant) return 'lt';
  const fixture = loadTenantFixture(tenant.tenantId);
  return fixture?.locale ?? 'lt';
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = resolveDocumentLang();

  return (
    <html lang={lang} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        {/* FOUT prevention: apply persisted theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
