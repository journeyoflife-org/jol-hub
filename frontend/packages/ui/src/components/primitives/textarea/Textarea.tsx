/**
 * Textarea — labeled multi-line text field with the same accessibility
 * contract as {@link Input}.
 */
import { cn } from '../../../lib/utils';
import { describedBy, FieldChrome, fieldBorderClass, fieldControlClass } from '../field';
import type { TextareaProps } from './Textarea.types';

export function Textarea({ id, label, helperText, error, required, className, rows = 4, ...props }: TextareaProps) {
  return (
    <FieldChrome id={id} label={label} helperText={helperText} error={error} required={required}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(helperText), Boolean(error))}
        aria-required={required || undefined}
        className={cn(fieldControlClass, fieldBorderClass(Boolean(error)), 'resize-y', className)}
        {...props}
      />
    </FieldChrome>
  );
}
