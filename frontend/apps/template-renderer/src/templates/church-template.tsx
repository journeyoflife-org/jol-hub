/**
 * ChurchTemplate — sacred-family layout (church, basilica, cathedral,
 * diaconate, protestant, orthodox, other-church).
 *
 * Lazy-loaded via the template registry; one shared chunk for the whole
 * sacred family (arrangement differs only by tenant data).
 */
import { TemplateShell } from './template-shell';
import type { TemplateProps } from '@/lib/template-registry';

export default function ChurchTemplate(props: TemplateProps) {
  return <TemplateShell {...props} variant="sacred" />;
}
