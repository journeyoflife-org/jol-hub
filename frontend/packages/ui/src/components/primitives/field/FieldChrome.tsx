/**
 * FieldChrome — shared label/helper/error scaffolding for form controls.
 *
 * Accessibility contract:
 * - `<label htmlFor>` association
 * - required indicator is decorative (`aria-hidden`); the control itself
 *   carries `aria-required`
 * - error message gets `<id>-error` and helper `<id>-helper`; controls
 *   reference them via `aria-describedby`
 */
import { cn } from '../../../lib/utils';
import type { FieldChromeProps } from './FieldChrome.types';

export interface FieldChromeLayoutProps extends FieldChromeProps {
  children: React.ReactNode;
}

/** Build the `aria-describedby` value for a field. */
export function describedBy(id: string, hasHelper: boolean, hasError: boolean): string | undefined {
  const ids = [hasError ? `${id}-error` : null, hasHelper ? `${id}-helper` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

export function FieldChrome({ id, label, helperText, error, required, children }: FieldChromeLayoutProps) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
        {label}
        {required && (
          <span aria-hidden="true" className="ms-1 text-error-700 dark:text-error-400">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-error-700 dark:text-error-400">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${id}-helper`} className={cn('text-sm text-neutral-600 dark:text-neutral-300')}>
          {helperText}
        </p>
      )}
    </div>
  );
}

/** Base classes for text-like form controls (design-token focus ring). */
export const fieldControlClass =
  'w-full rounded-md border bg-neutral-50 px-3 py-2 text-sm text-neutral-900 ' +
  'placeholder:text-neutral-400 focus-ring transition-colors motion-reduce:transition-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'dark:bg-neutral-900 dark:text-neutral-50 dark:placeholder:text-neutral-500';

/** Border classes by validity state. */
export function fieldBorderClass(hasError: boolean): string {
  return hasError
    ? 'border-error-700 dark:border-error-500'
    : 'border-neutral-300 dark:border-neutral-700';
}
