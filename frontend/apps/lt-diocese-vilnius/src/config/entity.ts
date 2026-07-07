/**
 * Vilnius Archdiocese - Entity Configuration
 * Example 3 of JOL-HUB Lithuania Website Framework
 * Diocese-level entity with multi-tenant capabilities
 */

export interface ParishInfo {
  id: string;
  name: string;
  nameEn: string;
  type: 'parish' | 'chapel' | 'shrine' | 'cathedral';
  deanery: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  pastorId?: string;
  contact: {
    email: string;
    phone: string;
  };
  massSchedule?: {
    weekdays: string[];
    weekends: string[];
    holyDays: string[];
  };
}

export interface DeaneryInfo {
  id: string;
  name: string;
  nameEn: string;
  deanId?: string;
  parishCount: number;
}

export interface PriestInfo {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  assignment: string;
  assignmentType: 'pastor' | 'administrator' | 'assistant' | 'dean' | 'bishop';
  ordinationDate: string;
  status: 'active' | 'retired' | 'on_leave';
}

export const entityConfig = {
  id: 'lt-diocese-vilnius-001',
  name: {
    lt: 'Vilniaus arkivyskupija',
    en: 'Vilnius Archdiocese',
  },
  type: 'diocese',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Vilnius Archdiocese',
    metropolitanSee: 'Vilnius Cathedral',
    established: '1387',
    patron: 'St. Casimir',
  },

  address: {
    street: 'Šv. Jono g. 3',
    city: 'Vilnius',
    postalCode: '01141',
    country: 'Lithuania',
    coordinates: {
      latitude: 54.6833,
      longitude: 25.2833,
    },
  },

  contact: {
    email: 'info@vilniusarkivyskupija.lt',
    phone: '+370 5 261 0744',
    website: 'https://vilniusarkivyskupija.lt',
  },

  hierarchy: {
    parentProvince: 'lt-province-lithuania',
    subordinateEntities: [] as string[],
  },

  bitrix24: {
    portalDomain: 'vilnius-arkivyskupija.bitrix24.eu',
    multiTenant: true,
    tenantPrefix: 'vilmgr_',
    contactGroupPrefix: 'parish_',
    dealCategories: {
      donation: 'donations',
      event: 'events',
      retreat: 'retreats',
      publication: 'publications',
    },
  },

  compliance: {
    level: 'diocesan' as const,
    canonicalRecords: true,
    diocesanGovernance: true,
    vaticanReporting: true,
    rbac: {
      tiers: 4,
      levels: ['diocese', 'deanery', 'parish', 'parishioner'],
    },
    audit: {
      enabled: true,
      logLevel: 'comprehensive',
      tamperEvident: true,
      retention: 7,
      vaticanReportSchedule: 'annual',
    },
    dataRetention: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
      priestRecords: 'permanent',
      financialRecords: 7,
    },
  },

  website: {
    domain: 'vilniusarkivyskupija.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'pl', 'be'],
    theme: 'diocese-classic',
  },

  deaneries: [
    { id: 'd-1', name: 'Vilniaus I dekanatas', nameEn: 'Vilnius I Deanery', parishCount: 12 },
    { id: 'd-2', name: 'Vilniaus II dekanatas', nameEn: 'Vilnius II Deanery', parishCount: 15 },
    { id: 'd-3', name: 'Trakų dekanatas', nameEn: 'Trakai Deanery', parishCount: 10 },
    { id: 'd-4', name: 'Šalčininkų dekanatas', nameEn: 'Šalčininkai Deanery', parishCount: 8 },
    { id: 'd-5', name: 'Švenčionių dekanatas', nameEn: 'Švenčionys Deanery', parishCount: 9 },
  ] as DeaneryInfo[],

  statistics: {
    totalParishes: 54,
    totalPriests: 78,
    totalDeacons: 5,
    totalParishioners: 320000,
    catholics: 580000,
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'publications', nameLt: 'Vyskupijos leidiniai', nameEn: 'Diocesan Publications' },
      { category: 'tickets', nameLt: 'Renginių bilietai', nameEn: 'Event Tickets' },
      { category: 'retreats', nameLt: 'Rekolekcijos', nameEn: 'Retreat Bookings' },
    ],
    paymentMethods: ['stripe', 'bank_link'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
