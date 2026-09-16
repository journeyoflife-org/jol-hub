/**
 * CleaningTemplate — service layout for cemetery-care tenants
 * (kapinių priežiūra): monument cleaning, maintenance, restoration.
 *
 * Character: fresh green/sage accent, bright & trustworthy, professional and
 * respectful of memorials. Hero: `cleaning` variant (bright, high-contrast).
 * Composition: bright hero, services overview, booking-oriented contact.
 * SEO: schema.org LocalBusiness (+ Service when priced).
 *
 * Rendering logic is SHARED (VerticalHomeTemplate); differentiation is
 * data-driven from `tenant.vertical` (no duplicated component code).
 */
import { VerticalHomeTemplate } from './base-template';
import type { TemplateProps } from '@/lib/template-registry';

export default function CleaningTemplate(props: TemplateProps) {
  return <VerticalHomeTemplate {...props} />;
}
