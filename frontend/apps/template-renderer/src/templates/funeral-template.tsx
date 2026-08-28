/**
 * FuneralTemplate — memorial layout for funeral homes.
 *
 * Character: subdued slate accent, dignified & compassionate, professional.
 * Hero: `funeral` variant (restrained stone palette, no bright colors).
 * Composition: restrained hero, services overview, always-reachable contact
 * (24/7). SEO: schema.org FuneralHome.
 *
 * GDPR note: obituary content concerns the deceased (not living persons'
 * personal data) but is a sensitive context — keep imagery/copy dignified and
 * never add trackers without consent.
 *
 * Rendering logic is SHARED (VerticalHomeTemplate); differentiation is
 * data-driven from `tenant.vertical` (no duplicated component code).
 */
import { VerticalHomeTemplate } from './base-template';
import type { TemplateProps } from '@/lib/template-registry';

export default function FuneralTemplate(props: TemplateProps) {
  return <VerticalHomeTemplate {...props} />;
}
