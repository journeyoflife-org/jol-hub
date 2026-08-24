/**
 * FeatureGrid — responsive 2–4 column feature showcase.
 * Icons are Lucide React components (emojis are forbidden as icons —
 * they are announced inconsistently by screen readers).
 */
import { cn } from '../../../lib/utils';
import { accentTextClass } from '../../../lib/tenant-theme';
import type { FeatureGridProps } from './FeatureGrid.types';

const COLUMNS = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
} as const;

export function FeatureGrid({ features, columns = 3, tenant, className }: FeatureGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-6', COLUMNS[columns], className)}>
      {features.map((feature) => {
        const Icon = feature.icon;
        const body = (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'inline-flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800',
                accentTextClass(tenant),
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h3 className="font-heading text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {feature.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">{feature.description}</p>
            {feature.href && (
              <span className={cn('text-sm font-medium underline-offset-4 hover:underline', accentTextClass(tenant))}>
                {feature.linkLabel ?? 'Skaityti daugiau / Read more'}
              </span>
            )}
          </>
        );

        return feature.href ? (
          <a
            key={feature.title}
            href={feature.href}
            className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-6 transition-shadow motion-reduce:transition-none hover:shadow-md focus-ring dark:border-neutral-800"
          >
            {body}
          </a>
        ) : (
          <div key={feature.title} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-6 dark:border-neutral-800">
            {body}
          </div>
        );
      })}
    </div>
  );
}
