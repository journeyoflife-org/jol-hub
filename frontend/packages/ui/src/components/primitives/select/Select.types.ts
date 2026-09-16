import type { FieldChromeProps } from '../field/FieldChrome.types';

/** A single option of {@link Select}. */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Props for {@link Select}. */
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'required'>,
    FieldChromeProps {
  /** Options rendered inside the native `<select>`. */
  options: SelectOption[];
  /** Placeholder option shown when nothing is selected. */
  placeholder?: string;
}
