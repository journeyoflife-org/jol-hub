/**
 * Vilnius Cathedral Basilica - Entity Configuration
 * Example 1 of JOL-HUB Lithuania Website Framework
 */

export const entityConfig = {
  id: 'lt-catholic-basilica-001',
  name: {
    lt: 'Vilniaus Šv. Stanislovo ir Šv. Vladislovo arkikatedra bazilika',
    en: 'Vilnius Cathedral Basilica of St. Stanislaus and St. Ladislaus',
  },
  type: 'basilica',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Vilnius Archdiocese',
    dedication: 'St. Stanislaus and St. Ladislaus',
    consecrationDate: '1783',
    basilicaStatus: 'minor_basilica',
    basilicaDesignationDate: '1922-03-04',
  },

  address: {
    street: 'Katedros a. 1',
    city: 'Vilnius',
    postalCode: '01143',
    country: 'Lithuania',
    coordinates: {
      latitude: 54.6859,
      longitude: 25.2878,
    },
  },

  contact: {
    email: 'info@katedra.lt',
    phone: '+370 5 261 0731',
    website: 'https://katedra.lt',
  },

  hierarchy: {
    parentDiocese: 'lt-diocese-vilnius-arch',
    parentDeanery: 'lt-deanery-vilnius-city',
  },

  bitrix24: {
    portalDomain: 'vilniaus-arkivyskupija.bitrix24.eu',
    contactGroupId: 1,
    dealCategoryId: 1,
  },

  compliance: {
    level: 'canonical' as const, // Canon Law + GDPR
    canonicalRecords: true,
    sacramentalDataProcessing: true,
    legalBasis: 'GDPR Art. 9(2)(d)',
    auditLogging: true,
    dataRetention: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
    },
  },

  website: {
    domain: 'katedra.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'pl'],
    theme: 'basilica-classic',
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'mass_intentions', nameLt: 'Šv. Mišių užsakymas', nameEn: 'Mass Intention Booking' },
      { category: 'candles', nameLt: 'Žvakės', nameEn: 'Candles' },
      { category: 'pilgrimage', nameLt: 'Piligrimystės', nameEn: 'Pilgrimages' },
      { category: 'books', nameLt: 'Knygos', nameEn: 'Books' },
    ],
    paymentMethods: ['stripe', 'paypal', 'bank_link'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
