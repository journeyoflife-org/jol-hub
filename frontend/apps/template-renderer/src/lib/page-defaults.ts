/**
 * Default page compositions — STEP 6.
 *
 * JOL-controlled module sequences used when a tenant has no backend page
 * config (pilot). Modules here are self-contained (i18n happens inside each
 * module), so these configs carry NO user-visible literals — only structure,
 * layout and non-text settings.
 */
import type { Module, PageConfig } from './page-config';

function module(
  id: string,
  type: Module['type'],
  props: Record<string, unknown> = {},
  layout: Module['layout'] = 'contained',
): Module {
  return { id, type, props, layout, settings: {}, visible: true };
}

/** Home for tenants without a fixture/backend config (Wave 1). */
export function buildHomeConfig(route = '/'): PageConfig {
  return {
    route,
    modules: [
      module('home-hero', 'hero', {}, 'full-width'),
      module('home-news', 'news-list', { limit: 3 }),
      module('home-events', 'event-list', { limit: 3 }),
      // Registry gates these by package entitlement (donations/contact-form).
      module('home-donation', 'donation-cta', {}),
      module('home-contact', 'contact-form', {}),
    ],
  };
}

/** About — hero + content (content populates from the backend later). */
export function buildAboutConfig(route = '/about'): PageConfig {
  return {
    route,
    modules: [module('about-hero', 'hero', {}, 'full-width'), module('about-content', 'content', {})],
  };
}

/**
 * Contact — map (needs coordinates) + the contact form. The route renders
 * its own header + tenant contact-info card above this composition, so no
 * hero module here.
 */
export function buildContactConfig(route = '/contact'): PageConfig {
  return {
    route,
    modules: [
      module('contact-map', 'map', {}),
      module('contact-form', 'contact-form', {}, 'two-column-60-40'),
    ],
  };
}
