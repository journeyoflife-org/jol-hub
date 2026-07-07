/**
 * Vilnius Monastery - Entity Configuration
 * Monastery-level entity with contemplative community focus
 * Special Category Data: Religious affiliation (GDPR Art. 9)
 */

export interface MassTime {
  day: string;
  dayEn: string;
  times: string[];
  language?: string;
  notes?: string;
}

export interface SacramentInfo {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  requirements: string[];
  contact: string;
  preparationRequired: boolean;
  preparationDuration?: string;
}

export interface MonkInfo {
  id: string;
  name: string;
  title: string;
  titleEn: string;
  role: 'abbot' | 'prior' | 'monk' | 'novice' | 'oblate';
  appointmentDate?: string;
}

export const entityConfig = {
  id: 'lt-monastery-vilnius-001',
  name: {
    lt: 'Vilniaus Šv. Rašto vienuolynas',
    en: 'Vilnius Holy Scripture Monastery',
  },
  type: 'monastery',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Vilnius Archdiocese',
    parentDiocese: 'lt-diocese-vilnius-001',
    patronSaint: 'St. Benedict',
    established: '1600',
    order: 'Benedictine',
    rule: 'Rule of St. Benedict',
  },

  address: {
    street: 'Aušros Vartų g. 8',
    city: 'Vilnius',
    postalCode: '01129',
    country: 'Lithuania',
  },

  contact: {
    email: 'monasteris@vienuolynas.lt',
    phone: '+370 5 262 1234',
    website: 'https://vienuolynas.lt',
    office: 'Vienuolyno gavėja (porter)',
    officeHours: {
      weekdays: '08:00 - 11:00, 14:00 - 17:00',
      weekends: '09:00 - 11:00',
    },
  },

  hierarchy: {
    parentDiocese: 'lt-diocese-vilnius-001',
    monasteryId: 'm-1',
  },

  bitrix24: {
    portalDomain: 'vilnius-arkivyskupija.bitrix24.eu',
    crmScope: 'monastery',
    contactPrefix: 'monastery_',
    dealCategories: {
      donation: 'monastery_donations',
      massIntention: 'monastery_mass_intentions',
      retreat: 'retreats',
      guestHouse: 'guest_house',
    },
  },

  compliance: {
    level: 'monastery' as const,
    standardGDPR: true,
    sacramentalRecordProtection: true,
    canonicalRecords: true,
    contemplativeCommunity: true,
    specialCategoryData: true, // GDPR Art. 9 - Religious data
    audit: {
      enabled: true,
      logLevel: 'standard',
      tamperEvident: true,
      retention: 7,
    },
    dataRetention: {
      sacramentalRecords: 'permanent',
      oblationRecords: 'permanent',
      guestRecords: 7,
      donationRecords: 7,
    },
    consentManagement: {
      enabled: true,
      defaultLanguage: 'lt',
      versioning: true,
    },
  },

  website: {
    domain: 'vienuolynas.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'la'],
    theme: 'monastery-contemplative',
  },

  abbot: {
    id: 'abbot-001',
    name: 'Abatas Tadas Kazlauskas',
    title: 'Abatas',
    titleEn: 'Abbot',
    role: 'abbot',
    appointmentDate: '2015-06-01',
  } as MonkInfo,

  community: [
    {
      id: 'monk-001',
      name: 'Tėvas Benediktas Petrauskas',
      title: 'Prioras',
      titleEn: 'Prior',
      role: 'prior',
    },
    {
      id: 'monk-002',
      name: 'Tėvas Jonas Matulis',
      title: 'Vienuolis',
      titleEn: 'Monk',
      role: 'monk',
    },
    {
      id: 'monk-003',
      name: 'Brolis Petras Antanaitis',
      title: 'Novicijus',
      titleEn: 'Novice',
      role: 'novice',
    },
  ] as MonkInfo[],

  monasticSchedule: {
    vigils: { time: '05:30', location: 'Chapel' },
    lauds: { time: '06:30', location: 'Chapel' },
    terce: { time: '09:00', location: 'Chapel' },
    sext: { time: '12:00', location: 'Chapel' },
    none: { time: '14:30', location: 'Chapel' },
    vespers: { time: '17:30', location: 'Chapel' },
    compline: { time: '19:30', location: 'Chapel' },
  },

  massSchedule: [
    {
      day: 'Kasdien',
      dayEn: 'Daily',
      times: ['07:00'],
      notes: 'Dalyvaujant visai bendruomenei',
    },
    {
      day: 'Sekmadienis',
      dayEn: 'Sunday',
      times: ['07:00', '10:00'],
      notes: '10:00 - už parapijiečius ir svečius',
    },
  ] as MassTime[],

  confessionSchedule: {
    weekdays: {
      times: 'Pagal susitarimą',
      location: 'Klauskite porteryje',
    },
    weekends: {
      times: '09:00 - 09:45',
      location: 'Išpažinties klausykla',
    },
    byAppointment: true,
  },

  sacraments: [
    {
      id: 'confession',
      name: 'Išpažintis',
      nameEn: 'Confession',
      description: 'Atgailos sakramentas',
      descriptionEn: 'Sacrament of Reconciliation',
      requirements: ['Sąžinės apsvarstymas'],
      contact: 'Bet kuris vienuolis kunigas',
      preparationRequired: false,
    },
    {
      id: 'spiritual-direction',
      name: 'Dvasinė pagalba',
      nameEn: 'Spiritual Direction',
      description: 'Dvasinė konsultacija',
      descriptionEn: 'Spiritual guidance and counseling',
      requirements: ['Susitarti iš anksto'],
      contact: 'Abatas arba prioras',
      preparationRequired: false,
    },
  ] as SacramentInfo[],

  guestHouse: {
    enabled: true,
    rooms: 8,
    amenities: [
      'Tyli aplinka',
      'Maldos galimybė',
      'Pusryčiai',
      'Biblioteka',
      'Sodas',
    ],
    rates: {
      perNight: 35,
      includesMeals: true,
      suggestedDonation: true,
    },
    reservationRequired: true,
    retreatPrograms: true,
  },

  oblationProgram: {
    enabled: true,
    description: {
      lt: 'Oblacijos programa pasauliečiams, norintiems gyventi pagal šv. Benedikto regulą pasaulyje',
      en: 'Oblation program for lay people wishing to live by the Rule of St. Benedict in the world',
    },
    contact: 'Oblacijos vadovas',
    formationPeriod: '1-2 metai',
  },

  statistics: {
    communityMembers: 8,
    oblates: 24,
    annualRetreats: 15,
    guestNightsPerYear: 350,
    averageSundayVisitors: 45,
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'mass-intentions', nameLt: 'Mišių intencijos', nameEn: 'Mass Intentions' },
      { category: 'retreats', nameLt: 'Rekolekcijos', nameEn: 'Retreats' },
      { category: 'guest-house', nameLt: 'Svečių namai', nameEn: 'Guest House' },
      { category: 'religious-items', nameLt: 'Religiniai daiktai', nameEn: 'Religious Items' },
    ],
    paymentMethods: ['stripe', 'cash', 'bank_transfer'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
