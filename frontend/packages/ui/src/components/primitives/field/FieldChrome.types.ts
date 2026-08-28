/** Shared chrome props for labeled form fields (Input/Textarea/Select). */
export interface FieldChromeProps {
  /** Unique field id — associates label, control and messages. */
  id: string;
  /** Visible label text. */
  label: string;
  /** Helper text rendered below the control. */
  helperText?: string;
  /** Error message — sets `aria-invalid` and `aria-describedby` wiring. */
  error?: string;
  /** Marks the field required (visible indicator + `aria-required`). */
  required?: boolean;
}
