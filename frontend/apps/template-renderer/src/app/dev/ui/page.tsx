/**
 * Env-gated component showcase — STEP 3 acceptance test page.
 *
 * Renders the full shared-UI Showcase (every component, all major
 * variants) ONLY when `UI_PREVIEW=1`. In every normal deployment the
 * env var is unset, so the route returns a bare 404 — identical to an
 * unknown page, i.e. no information disclosure and no tenant hints.
 *
 * This route sits OUTSIDE the `[tenant]` segment: static paths beat the
 * dynamic catch-all, and the tenant middleware passes through when no
 * tenant resolves (root domain, no X-Tenant header).
 *
 * Verify locally:
 *   UI_PREVIEW=1 pnpm --filter template-renderer dev  →  http://localhost:3000/dev/ui
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Showcase } from '@jol-hub/ui/dev/showcase';

// Evaluate the UI_PREVIEW gate per-request, never at prerender time.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'UI Showcase',
  // Never indexed: internal verification surface only.
  robots: { index: false, follow: false },
};

export default function UiPreviewPage() {
  if (process.env.UI_PREVIEW !== '1') {
    notFound();
  }
  return <Showcase />;
}
