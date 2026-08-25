/**
 * ChurchTemplate — sacred-family layout (church, basilica, cathedral,
 * diaconate, protestant, orthodox, other-church).
 *
 * Character: warm gold/amber accent, welcoming & reverent, community-focused.
 * Hero: `church` variant (warm overlay + liturgical-gold rule). Composition:
 * welcome hero, latest news, upcoming events, offering CTA, contact.
 * SEO: schema.org Church / CatholicChurch (per tenant, via vertical-theme).
 *
 * Lazy-loaded via the template registry; one shared chunk for the whole
 * sacred family. Rendering logic is SHARED (VerticalHomeTemplate) — the
 * per-tenant differentiation (accent, hero, schema) is data-driven from
 * `tenant.vertical`, so there is no duplicated component code.
 */
import { VerticalHomeTemplate } from './base-template';
import type { TemplateProps } from '@/lib/template-registry';

export default function ChurchTemplate(props: TemplateProps) {
  return <VerticalHomeTemplate {...props} />;
}
