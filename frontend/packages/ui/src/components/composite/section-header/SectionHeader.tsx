/**
 * SectionHeader — eyebrow + heading + description + optional action.
 * Heading level is configurable to keep the document outline valid.
 */
import { cn } from '../../../lib/utils';
import { accentTextClass, type TenantTheme } from '../../../lib/tenant-theme';
import type { SectionHeaderProps } from './SectionHeader.types';

export interface SectionHeaderFullProps extends SectionHeaderProps {
  /** Tenant theming — colors the eyebrow. */
  tenant?: TenantTheme;
}

const ALIGN = {
  left: 'text-start items-start',
  center: 'text-center items-center',
  right: 'text-end items-end',
} as const;

export function SectionHeader({
  eyebrow,
  title,
  description,
  headingLevel = 2,
  align = 'left',
  action,
  tenant,
  className,
}: SectionHeaderFullProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className={cn('mb-8 flex flex-col gap-2', ALIGN[align], className)}>
      {eyebrow && (
        <p className={cn('text-sm font-semibold uppercase tracking-wider', accentTextClass(tenant))}>
          {eyebrow}
        </p>
      )}
      <Heading className="font-heading text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
        {title}
      </Heading>
      {description && (
        <p className={cn('max-w-2xl text-neutral-600 dark:text-neutral-300', align === 'center' && 'mx-auto')}>
          {description}
        </p>
      )}
      {action && (
        <a
          href={action.href}
          className={cn('mt-1 font-medium underline-offset-4 hover:underline focus-ring rounded-sm', accentTextClass(tenant))}
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
