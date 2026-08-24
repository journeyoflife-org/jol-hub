/**
 * Avatar + AvatarGroup — user representation with initials fallback.
 *
 * The fallback carries the person's name as `aria-label`; images require
 * an explicit `alt`. The group collapses overflow into a `+N` counter.
 */
import { cn } from '../../../lib/utils';
import type { AvatarGroupProps, AvatarProps } from './Avatar.types';

const SIZES: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary-100 font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-100',
        SIZES[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={alt ?? name} className="h-full w-full object-cover" width={64} height={64} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}

export function AvatarGroup({ items, max = 4, label = 'Grupė / Group', className }: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <span role="group" aria-label={label} className={cn('inline-flex items-center', className)}>
      {visible.map((item, index) => (
        <span key={`${item.name}-${index}`} className={cn(index > 0 && '-ms-2')}>
          <Avatar {...item} className={cn('ring-2 ring-neutral-50 dark:ring-neutral-900', item.className)} />
        </span>
      ))}
      {overflow > 0 && (
        <span
          role="img"
          aria-label={`Dar ${overflow} ${overflow === 1 ? 'narys' : 'nariai'} / ${overflow} more`}
          className={cn(
            '-ms-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-700 ring-2 ring-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 dark:ring-neutral-900',
          )}
        >
          <span aria-hidden="true">+{overflow}</span>
        </span>
      )}
    </span>
  );
}
