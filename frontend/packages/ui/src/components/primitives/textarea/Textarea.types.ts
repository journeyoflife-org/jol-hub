import type { FieldChromeProps } from '../field/FieldChrome.types';

/** Props for {@link Textarea}. */
export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'required'>,
    FieldChromeProps {}
