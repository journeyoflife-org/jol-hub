/**
 * Internal 404 target for the STEP-5 tenant gate (fallback route).
 *
 * NOTE (STEP 1 hygiene fix): the middleware now answers unknown tenants
 * with a DIRECT generic 404 instead of rewriting here — middleware
 * rewrites are re-proxied internally by the standalone server and break
 * under x-forwarded-proto: https. This route is kept so direct hits still
 * return a proper 404 via the not-found boundary.
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
