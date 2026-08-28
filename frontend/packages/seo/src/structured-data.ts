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

// =============================================================================
// CHURCH ENTITIES (Phase 2.2 batch 1 — one builder for pages 3/4/7/8/9/10)
// =============================================================================

/**
 * Church-landing kind — controlled vocabulary. The kind selects the schema.org
 * TYPE shape only; denomination LABELS are DATA (entity-graph controlled
 * vocabulary, locale-translated) and are passed in, never hardcoded here
 * (DS-THEME-01 discipline applied to the SEO layer).
 */
export type ChurchKind =
  | 'basilica'
  | 'cathedral'
  | 'deanery'
  | 'parish'
  | 'protestant'
  | 'orthodox'
  | 'other';

export interface ChurchEntityInput {
  kind: ChurchKind;
  /** Localized display name (LT/EN/RU pilot — caller passes the resolved string). */
  name: string;
  /** Absolute canonical URL of this landing page (SEO hard rule 1). */
  url: string;
  address: PostalAddressInput;
  /** Required for basilica/cathedral/parish/orthodox (strategy rows 3/4/7/9). */
  geo?: { latitude: number; longitude: number };
  telephone?: string;
  openingHours?: string[];
  image?: string;
  description?: string;
  /** Parent org (diocese) — required for basilica/cathedral/parish (row 3 props). */
  parent?: { name: string; url?: string };
  /**
   * Denomination/tradition label from the entity-graph controlled vocabulary
   * (locale-resolved). REQUIRED for protestant/orthodox kinds (rows 8/9);
   * optional for 'other'; NEVER a hardcoded literal in this module.
   */
  denomination?: string;
  /** Native-script name (Cyrillic source of truth, row 9 name_native). */
  nativeName?: string;
  /** Basilica only: precise `+ CatholicChurch` typing where known (row 3). */
  preciseCatholic?: boolean;
  /** Cathedral only: the see this cathedral is seat of (row 4). */
  seatOf?: string;
}

/** Kinds requiring a denomination label from the data layer (rows 8/9). */
const DENOMINATION_REQUIRED_KINDS: ReadonlySet<ChurchKind> = new Set(['protestant', 'orthodox']);

/** Kinds requiring geo + parent org (strategy rows 3/4/7 required props). */
const GEO_PARENT_REQUIRED_KINDS: ReadonlySet<ChurchKind> = new Set([
  'basilica',
  'cathedral',
  'parish',
]);

function requireField(cond: unknown, field: string, kind: ChurchKind): void {
  if (!cond) {
    throw new Error(`churchEntity: missing required field '${field}' for kind '${kind}'`);
  }
}

/**
 * Shared church-landing builder (Phase 2.2 batch 1: pages 3/4/7/8/9 reduce to
 * this one parameterized builder; 'other' covers page 10, 'deanery' covers
 * org-level landings — the deaneries COLLECTION ItemList is itemListEntity's
 * job, not this builder's).
 *
 * Type selection per strategy-doc schema map:
 *   basilica   → Church (+CatholicChurch when precise) + PlaceOfWorship
 *   cathedral  → Church + PlaceOfWorship, cathedral role via additionalProperty
 *   parish     → Church + PlaceOfWorship
 *   orthodox   → Church + PlaceOfWorship + denomination property
 *   protestant → PlaceOfWorship + denomination property
 *   other      → PlaceOfWorship (denomination-agnostic, row 10)
 *   deanery    → ReligiousOrganization (org-level, rows 5/6)
 */
export function churchEntity(input: ChurchEntityInput): Json {
  const { kind } = input;
  requireField(input.name, 'name', kind);
  requireField(input.url, 'url', kind);
  requireField(input.address, 'address', kind);
  if (DENOMINATION_REQUIRED_KINDS.has(kind)) {
    requireField(input.denomination, 'denomination', kind);
  }
  if (GEO_PARENT_REQUIRED_KINDS.has(kind)) {
    requireField(input.geo, 'geo', kind);
    requireField(input.parent, 'parent', kind);
  }

  const type =
    kind === 'deanery'
      ? 'ReligiousOrganization'
      : kind === 'protestant' || kind === 'other'
        ? 'PlaceOfWorship'
        : kind === 'basilica' && input.preciseCatholic
          ? ['Church', 'CatholicChurch', 'PlaceOfWorship']
          : ['Church', 'PlaceOfWorship'];

  const additionalProperty: Json[] = [];
  if (kind === 'cathedral') {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'role',
      value: 'cathedral',
      ...(input.seatOf ? { description: `Seat of ${input.seatOf}` } : {}),
    });
  }
  if (input.denomination !== undefined && kind !== 'other') {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'denomination',
      value: input.denomination,
    });
  }

  return {
    '@context': CONTEXT,
    '@type': type,
    name: input.name,
    url: input.url,
    // Native-script name surfaces as alternateName (row 9: Cyrillic source of
    // truth + per-locale transliteration); display strings pass through UTF-8
    // untouched — LT diacritics and Cyrillic preserved by construction.
    ...(input.nativeName && input.nativeName !== input.name
      ? { alternateName: input.nativeName }
      : {}),
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    address: postalAddressEntity(input.address),
    ...(input.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: input.geo.latitude, longitude: input.geo.longitude } }
      : {}),
    ...(input.telephone ? { telephone: input.telephone } : {}),
    ...(input.openingHours && input.openingHours.length > 0
      ? { openingHoursSpecification: input.openingHours }
      : {}),
    ...(input.parent
      ? {
          parentOrganization: {
            '@type': 'ReligiousOrganization',
            name: input.parent.name,
            ...(input.parent.url ? { url: input.parent.url } : {}),
          },
        }
      : {}),
    ...(additionalProperty.length > 0 ? { additionalProperty } : {}),
  };
}

/**
 * Slug/transliteration policy (DS-I18N): URL slugs are ASCII-folded from the
 * display name — Cyrillic transliterated (ru→Latin per ISO-ish common map),
 * LT/LV/EE diacritics folded (ą→a, ž→z, ū→u, š→s, …), lowercase, hyphenated.
 * Display names are NEVER folded (locale strings stay UTF-8 intact).
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

const DIACRITIC_FOLD: Record<string, string> = {
  // LT
  ą: 'a', č: 'c', ę: 'e', ė: 'e', į: 'i', š: 's', ų: 'u', ū: 'u', ž: 'z',
  // LV
  ā: 'a', ē: 'e', ģ: 'g', ī: 'i', ķ: 'k', ļ: 'l', ņ: 'n',
  // EE
  ä: 'a', ö: 'o', õ: 'o', ü: 'u',
};

export function churchSlug(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? DIACRITIC_FOLD[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
