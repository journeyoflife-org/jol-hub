/**
 * CleaningTemplate — service layout for cemetery-care tenants
 * (kapinių priežiūra): service-schedule-first arrangement.
 */
import { TemplateShell } from './template-shell';
import type { TemplateProps } from '@/lib/template-registry';

export default function CleaningTemplate(props: TemplateProps) {
  return <TemplateShell {...props} variant="service" />;
}
