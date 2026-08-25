/**
 * JSON-LD structured data generators — STEP 11.
 *
 * Canonical pure builders for the schema.org types required by the SEO
 * architecture. The renderer's `lib/json-ld.tsx` holds the page-composition
 * variants used since STEP 6; this module supplies the remaining types
 * (LocalBusiness with geo/openingHours, Product, FAQPage, WebSite +
 * SearchAction) and is independently unit-tested against the fields Google
 * Rich Results requires.
 *
 * VALIDATION TARGETS (Rich Results):
 *   - LocalBusiness: name, address; recommended: geo, telephone, url.
 *   - Event: name, startDate, location.
 *   - Product: name; recommended: image, offers.
 *   - FAQPage: mainEntity Question/Answer pairs.
 *
 * GDPR: generators never embed personal data beyond what the tenant chooses
 * to publish (obituary names etc. are tenant content decisions, never
 * derived here).
 */
import type { Json } from './types';

const CONTEXT = 'https://schema.org';

export interface PostalAddressInput {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export function postalAddressEntity(address: PostalAddressInput): Json {
  return {
    '@type': 'PostalAddress',
    ...(address.streetAddress ? { streetAddress: address.streetAddress } : {}),
    ...(address.addressLocality ? { addressLocality: address.addressLocality } : {}),
    ...(address.addressRegion ? { addressRegion: address.addressRegion } : {}),
    ...(address.postalCode ? { postalCode: address.postalCode } : {}),
    addressCountry: address.addressCountry ?? 'LT',
  };
}

export interface LocalBusinessInput {
  /** Schema type: Church, FuneralHome, LocalBusiness, Cemetery… */
  type: string;
  name: string;
  url: string;
  address?: PostalAddressInput;
  geo?: { latitude: number; longitude: number };
  telephone?: string;
  openingHours?: string[];
  image?: string;
  description?: string;
}

/** LocalBusiness family (Local SEO): address, geo, phone, opening hours. */
export function localBusinessEntity(input: LocalBusinessInput): Json {
  return {
    '@context': CONTEXT,
    '@type': input.type,
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.address ? { address: postalAddressEntity(input.address) } : {}),
    ...(input.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: input.geo.latitude, longitude: input.geo.longitude } }
      : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.openingHours && input.openingHours.length > 0
      ? { openingHoursSpecification: input.openingHours }
      : {}),
  };
}

export interface ProductInput {
  name: string;
  url: string;
  description?: string;
  image?: string;
  /** VAT-inclusive price, decimal string (schema.org convention). */
  price?: string;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder' | 'BackOrder';
  sku?: string;
}

/** Product schema (shop): name + offers(PriceSpecification) + availability. */
export function productEntity(input: ProductInput): Json {
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.price
      ? {
          offers: {
            '@type': 'Offer',
            price: input.price,
            priceCurrency: input.currency ?? 'EUR',
            availability: `https://schema.org/${input.availability ?? 'InStock'}`,
            // VAT-inclusive pricing is the displayed price (LT 21%).
            priceSpecification: {
              '@type': 'PriceSpecification',
              price: input.price,
              priceCurrency: input.currency ?? 'EUR',
              valueAddedTaxIncluded: true,
            },
          },
        }
      : {}),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQPage schema from content blocks marked as Q&A. */
export function faqPageEntity(items: FaqItem[]): Json {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

/** WebSite schema with SearchAction (site search). */
export function websiteWithSearchEntity(name: string, url: string, searchTemplate?: string): Json {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name,
    url,
    ...(searchTemplate
      ? {
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: searchTemplate },
            'query-input': 'required name=search_term_string',
          },
        }
      : {}),
  };
}
