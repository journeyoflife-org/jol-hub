/**
 * DeaneryTemplate — administrative layout for deanery tenants (dekanatas),
 * grouping the region's parishes. Smaller scale than the diocese.
 *
 * Character: navy accent (related to, but lighter than, the diocese purple),
 * formal & welcoming. Hero: `default` variant. Composition: hero, deanery
 * news, deanery events, contact. SEO: schema.org Church / Organization.
 *
 * Parish list within the deanery is composed from real tenant data once the
 * registry exposes parish↔deanery relationships (never fabricated here).
 *
 * Rendering logic is SHARED (VerticalHomeTemplate); differentiation is
 * data-driven from `tenant.vertical` (no duplicated component code).
 */
import { VerticalHomeTemplate } from './base-template';
import type { TemplateProps } from '@/lib/template-registry';

export default function DeaneryTemplate(props: TemplateProps) {
  return <VerticalHomeTemplate {...props} />;
}
