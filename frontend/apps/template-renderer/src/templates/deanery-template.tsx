/**
 * DeaneryTemplate — administrative layout for deanery tenants (dekanatas),
 * grouping the region's parishes.
 */
import { TemplateShell } from './template-shell';
import type { TemplateProps } from '@/lib/template-registry';

export default function DeaneryTemplate(props: TemplateProps) {
  return <TemplateShell {...props} variant="administrative" />;
}
