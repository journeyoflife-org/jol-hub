/**
 * Vilnius City Deanery - Entity Configuration
 * Example 4 of JOL-HUB Lithuania Website Framework
 * Deanery-level entity with shared services across parishes
 */

export interface ParishInDeanery {
  id: string;
  name: string;
  nameEn: string;
  type: 'parish' | 'chapel' | 'shrine';
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  pastor: string;
  contact: {
    email: string;
    phone: string;
  };
  massSchedule: {
    weekdays: string[];
    weekends: string[];
  };
  website?: string;
}

export interface DeanInfo {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  appointmentDate: string;
  homeParish: string;
}

export const entityConfig = {
  id: 'lt-deanery-vilnius-city-001',
  name: {
    lt: 'Vilniaus miesto dekanatas',
    en: 'Vilnius City Deanery',
  },
  type: 'deanery',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Vilnius Archdiocese',
    parentDiocese: 'lt-diocese-vilnius-001',
    established: '1926',
  },

  address: {
    street: 'Šv. Jono g. 3',
    city: 'Vilnius',
    postalCode: '01141',
    country: 'Lithuania',
  },

  contact: {
    email: 'dekanatas@vilniusarkivyskupija.lt',
    phone: '+370 5 261 0744',
    website: 'https://vilniusdekanatas.lt',
  },

  hierarchy: {
    parentDiocese: 'lt-diocese-vilnius-001',
    deaneryId: 'd-1',
  },

  bitrix24: {
    portalDomain: 'vilnius-arkivyskupija.bitrix24.eu',
    sharedCRM: true,
    crmScope: 'deanery',
    contactGroupPrefix: 'vilnius_city_',
    dealCategories: {
      donation: 'donations',
      event: 'events',
    },
  },

  compliance: {
    level: 'deanery' as const,
    canonicalRecords: true,
    aggregatedPII: true,
    reporting: {
      frequency: 'quarterly',
      recipients: ['diocese', 'dean'],
    },
    audit: {
      enabled: true,
      logLevel: 'standard',
      tamperEvident: true,
      retention: 7,
    },
    dataRetention: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
      financialRecords: 7,
    },
  },

  website: {
    domain: 'vilniusdekanatas.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en'],
    theme: 'deanery-blue',
  },

  dean: {
    id: 'priest-dean-001',
    name: 'Kun. Dr. Jonas Ivanauskas',
    title: 'Vilniaus miesto dekanas',
    email: 'dekanas@vilniusarkivyskupija.lt',
    phone: '+370 5 261 5454',
    appointmentDate: '2020-06-15',
    homeParish: 'Vilniaus Šv. Jonų bažnyčia',
  } as DeanInfo,

  parishes: [
    {
      id: 'p-1',
      name: 'Vilniaus Šv. apaštalų Petro ir Pauliaus bažnyčia',
      nameEn: 'St. Peter and Paul Church',
      type: 'parish',
      address: { street: 'Antakalnio g. 27', city: 'Vilnius', postalCode: '10312' },
      pastor: 'Kun. Artūras Ligenbergas',
      contact: { email: 'petropaulas@vilnius.lt', phone: '+370 5 234 0111' },
      massSchedule: { weekdays: ['07:00', '18:00'], weekends: ['08:00', '10:00', '12:00', '18:00'] },
    },
    {
      id: 'p-2',
      name: 'Vilniaus Šv. Jonų bažnyčia',
      nameEn: 'St. Johns Church',
      type: 'parish',
      address: { street: 'Šv. Jono g. 12', city: 'Vilnius', postalCode: '01141' },
      pastor: 'Kun. Dr. Jonas Ivanauskas',
      contact: { email: 'jonai@vilnius.lt', phone: '+370 5 261 5454' },
      massSchedule: { weekdays: ['07:30', '18:30'], weekends: ['09:00', '11:00', '18:00'] },
    },
    {
      id: 'p-3',
      name: 'Vilniaus Šv. Kazimiero bažnyčia',
      nameEn: 'St. Casimir Church',
      type: 'parish',
      address: { street: 'Didžioji g. 34', city: 'Vilnius', postalCode: '01141' },
      pastor: 'Kun. Ričardas Doveika',
      contact: { email: 'kazimieras@vilnius.lt', phone: '+370 5 262 3456' },
      massSchedule: { weekdays: ['07:00', '18:00'], weekends: ['08:30', '10:30', '12:00', '18:00'] },
    },
    {
      id: 'p-4',
      name: 'Aušros Vartų Dievo Motinos koplyčia',
      nameEn: 'Gate of Dawn Chapel',
      type: 'shrine',
      address: { street: 'Aušros Vartų g. 12', city: 'Vilnius', postalCode: '01141' },
      pastor: 'Kun. Paulius Spurga',
      contact: { email: 'ausros@vilnius.lt', phone: '+370 5 261 1234' },
      massSchedule: { weekdays: ['07:00', '17:30'], weekends: ['07:00', '08:30', '10:00', '11:30', '17:30'] },
    },
    {
      id: 'p-5',
      name: 'Vilniaus Šv. Onos bažnyčia',
      nameEn: 'St. Anne Church',
      type: 'parish',
      address: { street: 'M. Daukšos g. 1', city: 'Vilnius', postalCode: '01141' },
      pastor: 'Kun. Gintaras Vitkūnas',
      contact: { email: 'onuliukas@vilnius.lt', phone: '+370 5 262 1234' },
      massSchedule: { weekdays: ['18:00'], weekends: ['09:00', '11:00', '18:00'] },
    },
  ] as ParishInDeanery[],

  statistics: {
    totalParishes: 12,
    totalPriests: 18,
    totalParishioners: 85000,
    totalCatholics: 120000,
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'merchandise', nameLt: 'Dekanato suvenyrai', nameEn: 'Deanery Merchandise' },
      { category: 'tickets', nameLt: 'Renginių bilietai', nameEn: 'Event Tickets' },
    ],
    paymentMethods: ['stripe', 'bank_link'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
