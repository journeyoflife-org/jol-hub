/**
 * Internal 404 target for the STEP-5 tenant gate.
 *
 * The middleware REWRITES unresolvable/unknown tenant requests here
 * (URL preserved — no redirect, so probes learn nothing from the address
 * bar). Calling {@link notFound} delegates to the global not-found
 * boundary, which is what guarantees a real HTTP 404 status while the
 * rewrite keeps the original URL.
 *
 * The body therefore comes from `app/not-found.tsx` — deliberately the SAME
 * generic message rendered for "tenant does not exist" and "page does not
 * exist", which prevents tenant enumeration (GDPR Art. 9 / SOC 2 CC6.1).
 * Never echo the attempted host/slug here.
 */
import { notFound } from 'next/navigation';

// Reads request context → per-request rendering (never statically baked).
export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

export default function TenantNotFound(): never {
  // Terminal route: always 404 via the not-found boundary (generic body).
  notFound();
}
