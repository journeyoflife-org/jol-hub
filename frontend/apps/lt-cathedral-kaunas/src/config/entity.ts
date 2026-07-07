/**
 * Kaunas Cathedral - Entity Configuration
 * Example 2 of JOL-HUB Lithuania Website Framework
 */

export const entityConfig = {
  id: 'lt-catholic-cathedral-001',
  name: {
    lt: 'Kauno Šv. apaštalų Petro ir Pauliaus arkikatedra bazilija',
    en: 'Kaunas Cathedral Basilica of St. Peter and St. Paul',
  },
  type: 'cathedral',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Kaunas Archdiocese',
    dedication: 'St. Peter and St. Paul',
    consecrationDate: '1650',
    basilicaStatus: 'minor_basilica',
    seatOf: 'Archbishop of Kaunas',
  },

  address: {
    street: 'Vilniaus g. 1',
    city: 'Kaunas',
    postalCode: '44287',
    country: 'Lithuania',
    coordinates: {
      latitude: 54.8976,
      longitude: 23.8827,
    },
  },

  contact: {
    email: 'info@kaunoarkikatedra.lt',
    phone: '+370 37 32 26 08',
    website: 'https://kaunoarkikatedra.lt',
  },

  hierarchy: {
    parentDiocese: 'lt-diocese-kaunas-arch',
    parentDeanery: 'lt-deanery-kaunas-city',
  },

  bitrix24: {
    portalDomain: 'kauno-arkivyskupija.bitrix24.eu',
    contactGroupId: 1,
    dealCategoryId: 1,
  },

  compliance: {
    level: 'canonical' as const,
    canonicalRecords: true,
    diocesanGovernance: true,
    auditLogging: true,
    dataRetention: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
    },
  },

  website: {
    domain: 'kaunoarkikatedra.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en'],
    theme: 'cathedral-classic',
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'mass_cards', nameLt: 'Mišių kortelės', nameEn: 'Mass Cards' },
      { category: 'merchandise', nameLt: 'Katedros suvenyrai', nameEn: 'Cathedral Merchandise' },
      { category: 'concerts', nameLt: 'Koncertų bilietai', nameEn: 'Concert Tickets' },
      { category: 'tours', nameLt: 'Ekskursijos', nameEn: 'Guided Tours' },
    ],
    paymentMethods: ['stripe', 'bank_link'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
