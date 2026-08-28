/**
 * Modules registry — STEP 6.
 *
 * Maps each module type to its component + commercial entitlement. Modules
 * are SERVER components; the composer invokes them (awaiting async ones).
 *
 * Code-splitting: the interactive ui components wrapped by modules
 * (Gallery lightbox, ContactForm, DonationWidget) are 'use client' and are
 * split into lazy client chunks automatically by Next.js — so the browser
 * only downloads interactivity it needs. Server-module code never ships to
 * the client bundle.
 *
 * Adding a module: create `src/modules/<name>-module.tsx` (default export),
 * add the type to page-config's ModuleTypeSchema, and register it here.
 */
import type { ModuleType } from '@/lib/page-config';
import type { ModuleComponent } from './types';

import HeroModule from './hero-module';
import ContentModule from './content-module';
import FeatureGridModule from './feature-grid-module';
import NewsListModule from './news-list-module';
import EventListModule from './event-list-module';
import ServiceListModule from './service-list-module';
import GalleryModule from './gallery-module';
import TestimonialModule from './testimonial-module';
import ContactFormModule from './contact-form-module';
import MapModule from './map-module';
import DonationCtaModule from './donation-cta-module';
import SubscriptionCtaModule from './subscription-cta-module';

export interface ModuleRegistration {
  /** Module component (server; may be async). */
  component: ModuleComponent;
  /**
   * Entitlement required to render (checked against tenant.features).
   * `null` = always allowed. Commercial modules are gated so CHEAP tenants
   * never see them.
   */
  requiredFeature: string | null;
}

/** Registry: module type → component + gating. */
export const MODULE_REGISTRY: Record<ModuleType, ModuleRegistration> = {
  hero: { component: HeroModule, requiredFeature: null },
  content: { component: ContentModule, requiredFeature: null },
  'feature-grid': { component: FeatureGridModule, requiredFeature: null },
  'news-list': { component: NewsListModule, requiredFeature: null },
  'event-list': { component: EventListModule, requiredFeature: null },
  'service-list': { component: ServiceListModule, requiredFeature: null },
  gallery: { component: GalleryModule, requiredFeature: 'gallery' },
  testimonial: { component: TestimonialModule, requiredFeature: null },
  'contact-form': { component: ContactFormModule, requiredFeature: 'contact-form' },
  map: { component: MapModule, requiredFeature: null },
  'donation-cta': { component: DonationCtaModule, requiredFeature: 'donations' },
  'subscription-cta': { component: SubscriptionCtaModule, requiredFeature: null },
};

/** Resolve a module type to its component (null for unknown — defensive). */
export function getModuleComponent(type: ModuleType): ModuleComponent | null {
  return MODULE_REGISTRY[type]?.component ?? null;
}

/** True when the tenant's package permits rendering this module type. */
export function isModuleEntitled(type: ModuleType, features: string[]): boolean {
  const required = MODULE_REGISTRY[type]?.requiredFeature ?? null;
  if (required === null) return true;
  return features.includes(required);
}
