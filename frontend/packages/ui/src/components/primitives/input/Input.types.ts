import type { FieldChromeProps } from '../field/FieldChrome.types';

/** Props for {@link Input}. */
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'>,
    FieldChromeProps {}
