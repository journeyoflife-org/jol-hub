/**
 * EntityFactCard — definition-list fact card for entity landings
 * (dedication, style, founded, diocese link, …).
 *
 * Semantics: `<dl>` rows (DS-A11Y-10 adjacent — programmatic labelling);
 * linked values render as focus-visible links with ≥24px targets.
 */
import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import { Card, CardContent, CardHeader, CardTitle } from '../../primitives/card';
import type { EntityFactCardProps } from './EntityFactCard.types';

export function EntityFactCard({ heading, items, tenant, className }: EntityFactCardProps) {
  return (
    <Card tenant={tenant} className={className}>
      {heading && (
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {items.map((fact) => (
            <div key={fact.label} className="contents">
              <dt className="font-medium text-neutral-600 dark:text-neutral-300">{fact.label}</dt>
              <dd className="text-neutral-900 dark:text-neutral-100">
                {fact.href ? (
                  <a
                    href={fact.href}
                    className={cn(
                      'focus-ring inline-flex min-h-[24px] items-center rounded-sm underline-offset-2 hover:underline',
                      accentTextClass(tenant),
                    )}
                  >
                    {fact.value}
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
