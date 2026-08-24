/**
 * Edge middleware: resolves the tenant from the X-Tenant header or the
 * request subdomain and rewrites to `/<tenant>/<path>`.
 *
 * SECURITY (GDPR Art. 9 / SOC 2 CC6.1): unknown tenants are never named;
 * unresolved requests fall through to the route layer which returns a bare
 * 404 with no tenant enumeration.
 */
import { withTenantResolution } from '@jol-hub/tenant-resolver/middleware';

export default withTenantResolution();

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
