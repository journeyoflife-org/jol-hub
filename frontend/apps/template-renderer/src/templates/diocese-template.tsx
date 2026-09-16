/**
 * DioceseTemplate — administrative layout for diocesan tenants (the VIP
 * regional anchors of Wave 1).
 *
 * Character: deep purple/gold accent, formal & authoritative yet welcoming.
 * Hero: `default` variant (institutional). Composition: hero, regional news,
 * upcoming events, contact. SEO: schema.org CatholicChurch /
 * ReligiousOrganization.
 *
 * Multi-site intent: deanery/parish links are composed from real tenant data
 * once the registry exposes those relationships (never fabricated here).
 *
 * Rendering logic is SHARED (VerticalHomeTemplate); differentiation is
 * data-driven from `tenant.vertical` (no duplicated component code).
 */
import { VerticalHomeTemplate } from './base-template';
import type { TemplateProps } from '@/lib/template-registry';

export default function DioceseTemplate(props: TemplateProps) {
  return <VerticalHomeTemplate {...props} />;
}
