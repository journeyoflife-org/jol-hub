/**
 * DioceseTemplate — administrative layout for diocesan tenants (the VIP
 * regional anchors of Wave 1).
 */
import { TemplateShell } from './template-shell';
import type { TemplateProps } from '@/lib/template-registry';

export default function DioceseTemplate(props: TemplateProps) {
  return <TemplateShell {...props} variant="administrative" />;
}
