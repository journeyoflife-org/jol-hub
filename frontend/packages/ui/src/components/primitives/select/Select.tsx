/**
 * Select — labeled native `<select>` (progressive enhancement: works
 * without JavaScript and inherits platform keyboard/screen-reader
 * behavior) with the shared field accessibility contract.
 */
import { cn } from '../../../lib/utils';
import { describedBy, FieldChrome, fieldBorderClass, fieldControlClass } from '../field';
import type { SelectProps } from './Select.types';

export function Select({
  id,
  label,
  helperText,
  error,
  required,
  options,
  placeholder,
  className,
  defaultValue,
  ...props
}: SelectProps) {
  return (
    <FieldChrome id={id} label={label} helperText={helperText} error={error} required={required}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, Boolean(helperText), Boolean(error))}
        aria-required={required || undefined}
        defaultValue={defaultValue ?? (placeholder !== undefined ? '' : undefined)}
        className={cn(fieldControlClass, fieldBorderClass(Boolean(error)), className)}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  );
}
