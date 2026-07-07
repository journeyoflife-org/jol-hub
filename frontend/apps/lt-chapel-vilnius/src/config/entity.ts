/**
 * Vilnius Chapel - Entity Configuration
 * Chapel-level entity with limited services
 * Smaller worship site within parish structure
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

export const entityConfig = {
  id: 'lt-chapel-vilnius-001',
  name: {
    lt: 'Vilniaus Aušros Vartų koplyčia',
    en: 'Vilnius Gate of Dawn Chapel',
  },
  type: 'chapel',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Vilnius Archdiocese',
    parentDiocese: 'lt-diocese-vilnius-001',
    parentParish: 'lt-parish-st-john-vilnius-001',
    patronSaint: 'Blessed Virgin Mary, Mother of Mercy',
    established: '1671',
    shrineStatus: true,
    pilgrimageSite: true,
  },

  address: {
    street: 'Aušros Vartų g. 12',
    city: 'Vilnius',
    postalCode: '01129',
    country: 'Lithuania',
  },

  contact: {
    email: 'ausrosvartai@vilnius.lt',
    phone: '+370 5 262 3333',
    website: 'https://ausrosvartai.lt',
    office: 'Koplyčios prižiūrėtojas',
    officeHours: {
      weekdays: '07:00 - 19:00',
      weekends: '07:00 - 19:00',
    },
  },

  hierarchy: {
    parentDiocese: 'lt-diocese-vilnius-001',
    parentParish: 'lt-parish-st-john-vilnius-001',
    chapelId: 'c-1',
  },

  bitrix24: {
    portalDomain: 'vilnius-arkivyskupija.bitrix24.eu',
    crmScope: 'chapel',
    contactPrefix: 'chapel_gate_',
    dealCategories: {
      donation: 'chapel_donations',
      massIntention: 'chapel_mass_intentions',
      candlePurchase: 'candles',
      pilgrimage: 'pilgrimages',
    },
  },

  compliance: {
    level: 'chapel' as const,
    standardGDPR: true,
    sacramentalRecordProtection: true,
    canonicalRecords: false, // Chapel doesn't maintain separate registers
    shrineStatus: true,
    pilgrimageData: true, // Visitor data management
    audit: {
      enabled: true,
      logLevel: 'standard',
      tamperEvident: true,
      retention: 7,
    },
    dataRetention: {
      visitorRecords: 3,
      donationRecords: 7,
      candleSalesRecords: 3,
    },
    consentManagement: {
      enabled: true,
      defaultLanguage: 'lt',
      versioning: true,
    },
  },

  website: {
    domain: 'ausrosvartai.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'pl', 'ru'],
    theme: 'chapel-shrine',
  },

  shrineInfo: {
    pilgrimageStatus: true,
    annualPilgrims: 50000,
    famousFor: {
      lt: 'Švč. Mergelės Marijos Atsivertimo paveikslas',
      en: 'Icon of the Blessed Virgin Mary, Mother of Mercy',
    },
    grantedIndulgences: true,
    pilgrimageSeason: 'Year-round, peak: May-October',
  },

  chaplain: {
    id: 'chaplain-001',
    name: 'Kun. Artūras Stankevičius',
    title: 'Koplyčios rektorius',
    titleEn: 'Chapel Rector',
    email: 'rektorius@ausrosvartai.lt',
    phone: '+370 5 262 3333',
  },

  massSchedule: [
    {
      day: 'Darbo dienomis',
      dayEn: 'Weekdays',
      times: ['07:00', '17:30'],
      notes: 'Visos Mišios lenkiškai po lietuviškų',
    },
    {
      day: 'Šeštadienis',
      dayEn: 'Saturday',
      times: ['07:00', '08:00', '17:30'],
      notes: '08:00 - lenkų k.',
    },
    {
      day: 'Sekmadienis',
      dayEn: 'Sunday',
      times: ['07:00', '08:00', '09:00', '11:00', '17:30'],
      notes: '08:00 - lenkų k., 09:00 - rusų k., 11:00 - pagrindinės lietuvių k.',
    },
    {
      day: 'Šventinės dienos',
      dayEn: 'Holy Days',
      times: ['07:00', '09:00', '11:00', '17:30'],
      notes: 'Daugiau Mišių per didžiąsias šventes',
    },
  ] as MassTime[],

  confessionSchedule: {
    weekdays: {
      times: '07:30 - 10:00, 16:00 - 18:00',
      location: 'Išpažinties klausyklos',
    },
    weekends: {
      times: '07:30 - 12:00, 16:00 - 18:00',
      location: 'Išpažinties klausyklos',
    },
    byAppointment: false,
    languagesAvailable: ['lt', 'pl', 'ru', 'en'],
  },

  sacraments: [
    {
      id: 'confession',
      name: 'Išpažintis',
      nameEn: 'Confession',
      description: 'Atgailos sakramentas',
      descriptionEn: 'Sacrament of Reconciliation',
      requirements: [],
      contact: 'Tarnaujantis kunigas',
      preparationRequired: false,
    },
    {
      id: 'eucharist',
      name: 'Šv. Komunija',
      nameEn: 'Holy Communion',
      description: 'Eucharistija',
      descriptionEn: 'Holy Eucharist',
      requirements: ['Katalikų tikėjimas', 'Būklės malonė'],
      contact: 'Mišių metu',
      preparationRequired: false,
    },
  ] as SacramentInfo[],

  candleServices: {
    enabled: true,
    types: [
      { type: 'votive', nameLt: 'Votyvinė žvakė', nameEn: 'Votive Candle', price: 1 },
      { type: 'large', nameLt: 'Didelė žvakė', nameEn: 'Large Candle', price: 5 },
      { type: 'vigil', nameLt: 'Vigilijos žvakė', nameEn: 'Vigil Candle', price: 10 },
    ],
    intentionsAccepted: true,
  },

  visitingHours: {
    weekdays: '06:30 - 19:00',
    weekends: '06:30 - 19:00',
    holidays: '06:30 - 19:00',
    exceptions: 'Per didžiąsias šventes gali būti ilgesnis',
  },

  statistics: {
    dailyVisitors: 200,
    annualPilgrims: 50000,
    sundayMassAttendance: 400,
    annualCandlesSold: 150000,
    annualDonations: 150000,
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'mass-intentions', nameLt: 'Mišių intencijos', nameEn: 'Mass Intentions' },
      { category: 'candles', nameLt: 'Žvakės', nameEn: 'Candles' },
      { category: 'religious-items', nameLt: 'Religiniai daiktai', nameEn: 'Religious Items' },
      { category: 'donations', nameLt: 'Aukos', nameEn: 'Donations' },
    ],
    paymentMethods: ['stripe', 'cash'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
