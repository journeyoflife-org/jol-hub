/**
 * VendorDashboardShell — DISPLAY-ONLY vendor surface shell (hub-render side
 * of the CLOSED payment boundary). Purely presentational: header (vendor
 * name + caller-provided stats) and a content region for consumer-composed
 * blocks. Requires ZERO marketplace API contact to render meaningfully —
 * every value arrives via props; transaction/payout surfaces remain inert
 * placeholders until the payment-track freeze is lifted (D-052).
 */
import { cn } from '../../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../primitives/card';
import type { VendorDashboardShellProps } from './VendorDashboardShell.types';

export function VendorDashboardShell({
  vendorName,
  stats = [],
  children,
  tenant,
  className,
}: VendorDashboardShellProps) {
  return (
    <section aria-label={vendorName} className={cn('flex flex-col gap-4', className)}>
      <Card tenant={tenant}>
        <CardHeader>
          <CardTitle>{vendorName}</CardTitle>
        </CardHeader>
        {stats.length > 0 && (
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-neutral-600 dark:text-neutral-300">{stat.label}</dt>
                  <dd className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        )}
      </Card>
      {children}
    </section>
  );
}
