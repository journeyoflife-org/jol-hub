/**
 * JSON-LD structured data — STEP 6 (SEO).
 *
 * Emits schema.org entities as `<script type="application/ld+json">`.
 * `schema-dts` is intentionally NOT a dependency (offline builds); the
 * builders below produce schema.org-conformant objects through a narrow
 * local type (`JsonValue`). Output is validated by Google's Rich Results
 * test via the acceptance matrix.
 *
 * SECURITY: builders receive only PUBLIC tenant fields (never `schema`).
 */
import type { ReactElement } from 'react';

/** JSON-LD value space (schema.org compatible). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface JsonLdProps {
  /** One entity or an @graph of entities. */
  data: JsonValue | JsonValue[];
}

/** Serialize without dropping meaningful fields; escape for inline safety. */
function serialize(data: JsonValue | JsonValue[]): string {
  return JSON.stringify(Array.isArray(data) ? { '@graph': data } : data).replace(
    /</g,
    '\\u003c',
  );
}

/** Render a JSON-LD block. Server-safe (no client JS). */
export function JsonLd({ data }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Shared entity fragments                                             */
/* ------------------------------------------------------------------ */

export interface OrgInput {
  name: string;
  url: string;
  vertical: string;
  address?: string;
  phone?: string;
  email?: string;
}

/** schema.org type for an org based on the tenant vertical. */
export function organizationTypeFor(vertical: string): string {
  switch (vertical) {
    case 'funeral':
    case 'funeral-home':
      return 'FuneralHome';
    case 'cemetery-cleaning':
    case 'cemetery':
      return 'LocalBusiness';
    default:
      return 'ReligiousOrganization';
  }
}

/** Organization entity (ReligiousOrganization / LocalBusiness / FuneralHome). */
export function organizationEntity(org: OrgInput): JsonValue {
  const entity: { [key: string]: JsonValue } = {
    '@type': organizationTypeFor(org.vertical),
    name: org.name,
    url: org.url,
  };
  if (org.address || org.phone || org.email) {
    const contactPoint: { [key: string]: JsonValue } = {
      '@type': 'ContactPoint',
      contactType: 'customer service',
    };
    if (org.phone) contactPoint.telephone = org.phone;
    if (org.email) contactPoint.email = org.email;
    entity.contactPoint = contactPoint;
  }
  if (org.address) {
    entity.address = { '@type': 'PostalAddress', streetAddress: org.address };
  }
  return entity;
}

/** WebSite entity (sitelinks/search baseline). */
export function websiteEntity(name: string, url: string): JsonValue {
  return { '@type': 'WebSite', name, url };
}

export interface WebPageInput {
  /** schema.org WebPage subtype, e.g. `AboutPage` or `ContactPage`. */
  type: string;
  name: string;
  url: string;
  /** The entity the page is about (typically the Organization). */
  about?: JsonValue;
}

/** WebPage-subtype entity (AboutPage / ContactPage) for static pages. */
export function webPageEntity(input: WebPageInput): JsonValue {
  const entity: { [key: string]: JsonValue } = {
    '@type': input.type,
    name: input.name,
    url: input.url,
  };
  if (input.about) entity.about = input.about;
  return entity;
}

/* ------------------------------------------------------------------ */
/* Breadcrumbs                                                         */
/* ------------------------------------------------------------------ */

export interface Crumb {
  name: string;
  url: string;
}

/** BreadcrumbList from an ordered trail (root → current). */
export function breadcrumbEntity(crumbs: Crumb[]): JsonValue {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Collections                                                         */
/* ------------------------------------------------------------------ */

export interface ArticleInput {
  headline: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  description?: string;
  publisherName: string;
}

/** NewsArticle entity for news detail pages. */
export function articleEntity(article: ArticleInput): JsonValue {
  const entity: { [key: string]: JsonValue } = {
    '@type': 'NewsArticle',
    headline: article.headline,
    mainEntityOfPage: { '@type': 'WebPage', '@id': article.url },
    datePublished: article.datePublished,
    author: { '@type': 'Person', name: article.authorName ?? article.publisherName },
    publisher: { '@type': 'Organization', name: article.publisherName },
  };
  if (article.dateModified) entity.dateModified = article.dateModified;
  if (article.description) entity.description = article.description;
  return entity;
}

export interface EventInput {
  name: string;
  url: string;
  startDateTime: string;
  endDateTime?: string;
  location?: string;
  organizerName?: string;
  description?: string;
}

/** Event entity for event detail pages. */
export function eventEntity(event: EventInput): JsonValue {
  const entity: { [key: string]: JsonValue } = {
    '@type': 'Event',
    name: event.name,
    url: event.url,
    startDate: event.startDateTime,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
  if (event.endDateTime) entity.endDate = event.endDateTime;
  if (event.location) {
    entity.location = { '@type': 'Place', name: event.location };
  }
  if (event.organizerName) {
    entity.organizer = { '@type': 'Organization', name: event.organizerName };
  }
  if (event.description) entity.description = event.description;
  return entity;
}

export interface ServiceInput {
  name: string;
  url: string;
  providerName: string;
  description?: string;
  price?: number;
}

/** Service entity for service detail pages. */
export function serviceEntity(service: ServiceInput): JsonValue {
  const entity: { [key: string]: JsonValue } = {
    '@type': 'Service',
    name: service.name,
    url: service.url,
    provider: { '@type': 'Organization', name: service.providerName },
  };
  if (service.description) entity.description = service.description;
  if (typeof service.price === 'number') {
    entity.offers = {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'EUR',
    };
  }
  return entity;
}

/** ItemList of collection links (news/events/services list pages). */
export function itemListEntity(items: Array<{ name: string; url: string }>): JsonValue {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
