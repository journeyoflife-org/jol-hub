/**
 * Vertical default home compositions — STEP 7.
 *
 * JOL-controlled per-vertical module sequences for tenants without a backend
 * page config (pilot). Every vertical composes the SAME STEP 6 modules — the
 * differentiation is selection, order, layout and the vertical hero variant,
 * never duplicated components. Content stays data-driven: list modules fetch
 * their collections (empty in pilot → they collapse), so nothing is fabricated.
 */
import type { Vertical } from '@jol-hub/tenant-resolver';
import type { Module, PageConfig } from './page-config';
import { verticalThemeFor } from './vertical-theme';

function module(
  id: string,
  type: Module['type'],
  props: Record<string, unknown> = {},
  layout: Module['layout'] = 'contained',
): Module {
  return { id, type, props, layout, settings: {}, visible: true };
}

/** Hero module pre-configured with the vertical's hero treatment. */
function heroModule(vertical: Vertical): Module {
  return module('home-hero', 'hero', { variant: verticalThemeFor(vertical).heroVariant }, 'full-width');
}

/**
 * Build the default home composition for a vertical.
 * Registry gates commercial modules (donations/contact-form) by entitlement.
 */
export function buildVerticalHomeConfig(vertical: Vertical): PageConfig {
  const hero = heroModule(vertical);

  switch (vertical) {
    // Memorial: restrained hero, services overview, always-reachable contact.
    case 'funeral':
      return {
        route: '/',
        modules: [
          hero,
          module('home-services', 'service-list', { limit: 6 }),
          module('home-contact', 'contact-form', {}, 'two-column-60-40'),
        ],
      };

    // Service: bright hero, services, booking-oriented contact.
    case 'cemetery-cleaning':
      return {
        route: '/',
        modules: [
          hero,
          module('home-services', 'service-list', { limit: 6 }),
          module('home-contact', 'contact-form', {}, 'two-column-60-40'),
        ],
      };

    // Administrative: news + events for the region; no donation CTA.
    case 'diocese':
    case 'deanery':
      return {
        route: '/',
        modules: [
          hero,
          module('home-news', 'news-list', { limit: 3 }),
          module('home-events', 'event-list', { limit: 3 }),
          module('home-contact', 'contact-form'),
        ],
      };

    // Church-landing family (packages 03 Basilica / 04 Cathedral /
    // 08 Protestant / 09 Orthodox — 07 Parish proved the pattern): the
    // reference structure is hero + content(60-40 fact card) + events +
    // services + gallery + map + contact. NO donation-cta: the payment
    // track is FROZEN (DECISION-LOG D-052) and donations default OFF.
    case 'basilica':
    case 'cathedral':
    case 'orthodox':
    case 'protestant':
      return {
        route: '/',
        modules: [
          hero,
          module('home-content', 'content', {}, 'two-column-60-40'),
          module('home-events', 'event-list', { limit: 3 }),
          module('home-services', 'service-list', { limit: 4 }),
          module('home-gallery', 'gallery', { limit: 6 }),
          module('home-map', 'map'),
          module('home-contact', 'contact-form'),
        ],
      };

    // Sacred family (remaining church verticals): news + events + offering
    // + contact (donation-cta stays entitlement-gated, default OFF).
    default:
      return {
        route: '/',
        modules: [
          hero,
          module('home-news', 'news-list', { limit: 3 }),
          module('home-events', 'event-list', { limit: 3 }),
          module('home-donation', 'donation-cta'),
          module('home-contact', 'contact-form'),
        ],
      };
  }
}
