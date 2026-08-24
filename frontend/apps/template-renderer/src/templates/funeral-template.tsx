/**
 * FuneralTemplate — memorial layout for funeral homes.
 * Subdued accent, dignified treatment (see isMemorialVertical in the UI kit).
 */
import { TemplateShell } from './template-shell';
import type { TemplateProps } from '@/lib/template-registry';

export default function FuneralTemplate(props: TemplateProps) {
  return <TemplateShell {...props} variant="memorial" />;
}
