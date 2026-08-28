/**
 * Input — labeled single-line text field with helper text, error state
 * (`aria-invalid` + `aria-describedby`), and required indicator.
 */
import { cn } from '../../../lib/utils';
import { describedBy, FieldChrome, fieldBorderClass, fieldControlClass } from '../field';
import type { InputProps } from './Input.types';

export function Input({ id, label, helperText, error, required, className, ...props }: InputProps) {
  return (
    <FieldChrome id={id} label={label} helperText={helperText} error={error} required={required}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(helperText), Boolean(error))}
        aria-required={required || undefined}
        className={cn(fieldControlClass, fieldBorderClass(Boolean(error)), className)}
        {...props}
      />
    </FieldChrome>
  );
}
