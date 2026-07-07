/**
 * Vilnius Orthodox Cathedral - Entity Configuration
 * Example 7 of JOL-HUB Lithuania Website Framework
 * Orthodox Church entity with Moscow Patriarchate governance
 */

export interface OrthodoxService {
  type: 'liturgy' | 'vespers' | 'matins' | 'all-night-vigil' | 'moleben' | 'panikhida';
  nameLt: string;
  nameEn: string;
  description?: string;
}

export interface OrthodoxFeast {
  id: string;
  date: string; // Can be fixed or movable
  nameLt: string;
  nameEn: string;
  type: 'great' | 'twelve' | 'minor';
  isMoveable: boolean;
}

export interface IconInfo {
  id: string;
  nameLt: string;
  nameEn: string;
  origin: string;
  century: string;
  description: string;
  location: string;
}

export interface ClergyMember {
  id: string;
  name: string;
  title: string;
  titleEn: string;
  rank: 'patriarch' | 'metropolitan' | 'archbishop' | 'bishop' | 'archpriest' | 'priest' | 'deacon';
  email?: string;
}

export const entityConfig = {
  id: 'lt-orthodox-vilnius-cathedral-001',
  name: {
    lt: 'Vilniaus Šv. Dvasios stačiatikių katedra',
    en: 'Vilnius Orthodox Cathedral of the Holy Spirit',
    ru: 'Свято-Духов Кафедральный собор в Вильнюсе',
  },
  type: 'orthodox-church',
  tradition: 'eastern-orthodox',
  status: 'active',
  country: 'lt',

  ecclesiastical: {
    patriarchate: 'Moscow Patriarchate',
    patriarchateLt: 'Maskvos Patriarchatas',
    diocese: 'Vilnius and Lithuania Diocese',
    dioceseLt: 'Vilniaus ir Lietuvos vyskupija',
    rite: 'Byzantine Rite',
    calendar: 'Julian Calendar (Old Style)',
    jurisdiction: 'Russian Orthodox Church',
    founded: '1347',
    consecrated: '1749',
  },

  address: {
    street: 'Aušros Vartų g. 10',
    city: 'Vilnius',
    postalCode: '01129',
    country: 'Lithuania',
  },

  contact: {
    email: 'sobor@orthodox.lt',
    phone: '+370 5 212 3547',
    website: 'https://orthodox.lt',
    office: 'Katedros administracija',
    officeHours: {
      weekdays: '09:00 - 17:00',
      weekends: 'By appointment',
    },
  },

  bitrix24: {
    portalDomain: 'orthodox-lt.bitrix24.eu',
    crmScope: 'congregation',
    contactPrefix: 'orthodox_vilnius_',
    dealCategories: {
      donation: 'offerings',
      candleOrder: 'candles',
      iconPurchase: 'icons',
    },
  },

  compliance: {
    level: 'congregation' as const,
    gdpr: true,
    patriarchateRequirements: {
      enabled: true,
      reportingFrequency: 'annual',
      reportingTo: 'Moscow Patriarchate Department for External Church Relations',
      dataSharing: ['baptismal_records', 'marriage_records', 'statistical_reports'],
    },
    audit: {
      enabled: true,
      logLevel: 'standard',
      retention: 7,
    },
    dataRetention: {
      parishionerData: 10,
      sacramentalRecords: 'permanent',
      financialRecords: 7,
      patriarchateReports: 'permanent',
    },
  },

  website: {
    domain: 'orthodox.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'ru'],
    theme: 'orthodox-traditional',
  },

  rector: {
    id: 'clergy-001',
    name: 'Arkivyskupas Inokentijus',
    title: 'Vyskupas',
    titleEn: 'Bishop',
    rank: 'archbishop',
    email: 'bishop@orthodox.lt',
  } as ClergyMember,

  clergy: [
    {
      id: 'clergy-001',
      name: 'Arkivyskupas Inokentijus',
      title: 'Vyskupas',
      titleEn: 'Bishop',
      rank: 'archbishop',
      email: 'bishop@orthodox.lt',
    },
    {
      id: 'clergy-002',
      name: 'Prot. Vitalijus Mockus',
      title: 'Vyriausiasis kunigas',
      titleEn: 'Archpriest',
      rank: 'archpriest',
      email: 'fr.vitalij@orthodox.lt',
    },
    {
      id: 'clergy-003',
      name: 'Kun. Gintaras Sungaila',
      title: 'Kunigas',
      titleEn: 'Priest',
      rank: 'priest',
      email: 'fr.gintaras@orthodox.lt',
    },
    {
      id: 'clergy-004',
      name: 'Djak. Andrejus Petuchov',
      title: 'Djakonas',
      titleEn: 'Deacon',
      rank: 'deacon',
    },
  ] as ClergyMember[],

  serviceTypes: {
    liturgy: {
      type: 'liturgy',
      nameLt: 'Šv. Liturgija',
      nameEn: 'Divine Liturgy',
      description: 'The main Orthodox worship service',
    },
    vespers: {
      type: 'vespers',
      nameLt: 'Vakarinės',
      nameEn: 'Vespers',
    },
    matins: {
      type: 'matins',
      nameLt: 'Rytmetinės',
      nameEn: 'Matins',
    },
    'all-night-vigil': {
      type: 'all-night-vigil',
      nameLt: 'Visanaktinė budynė',
      nameEn: 'All-Night Vigil',
    },
    moleben: {
      type: 'moleben',
      nameLt: 'Molebas',
      nameEn: 'Moleben (Prayer Service)',
    },
    panikhida: {
      type: 'panikhida',
      nameLt: 'Panichida',
      nameEn: 'Memorial Service',
    },
  },

  serviceSchedule: [
    {
      day: 'Sekmadienis / Sunday',
      dayEn: 'Sunday',
      services: [
        { time: '06:30', type: 'matins', nameLt: 'Rytmetinės' },
        { time: '09:00', type: 'liturgy', nameLt: 'Šv. Liturgija (ankstyvoji)' },
        { time: '10:30', type: 'liturgy', nameLt: 'Šv. Liturgija (vėlyvoji)' },
        { time: '17:00', type: 'vespers', nameLt: 'Vakarinės' },
      ],
    },
    {
      day: 'Šeštadienis / Saturday',
      dayEn: 'Saturday',
      services: [
        { time: '09:00', type: 'liturgy', nameLt: 'Šv. Liturgija' },
        { time: '17:00', type: 'all-night-vigil', nameLt: 'Visanaktinė budynė' },
      ],
    },
    {
      day: 'Darbo dienos / Weekdays',
      dayEn: 'Weekdays',
      services: [
        { time: '08:00', type: 'liturgy', nameLt: 'Šv. Liturgija' },
        { time: '17:00', type: 'vespers', nameLt: 'Vakarinės' },
      ],
    },
  ],

  greatFeasts: [
    { id: 'feast-1', date: '01-07', nameLt: 'Gimimas (Kalėdos)', nameEn: 'Nativity of Christ', type: 'twelve', isMoveable: false },
    { id: 'feast-2', date: '01-19', nameLt: 'Krikštas (Epifanija)', nameEn: 'Theophany', type: 'twelve', isMoveable: false },
    { id: 'feast-3', date: 'moveable', nameLt: 'Velykos (Prisikėlimas)', nameEn: 'Pascha (Resurrection)', type: 'great', isMoveable: true },
    { id: 'feast-4', date: 'moveable+40', nameLt: 'Dangun Žengimas', nameEn: 'Ascension', type: 'twelve', isMoveable: true },
    { id: 'feast-5', date: 'moveable+50', nameLt: 'Sekminės', nameEn: 'Pentecost', type: 'twelve', isMoveable: true },
    { id: 'feast-6', date: '08-19', nameLt: 'Permainimas', nameEn: 'Transfiguration', type: 'twelve', isMoveable: false },
    { id: 'feast-7', date: '08-28', nameLt: 'Dievu Gimimo užmigimas', nameEn: 'Dormition', type: 'twelve', isMoveable: false },
  ] as OrthodoxFeast[],

  notableIcons: [
    {
      id: 'icon-1',
      nameLt: 'Vilniaus Dievo Motinos ikona',
      nameEn: 'Vilnius Icon of the Mother of God',
      origin: 'Vilnius',
      century: 'XVI',
      description: 'Miracle-working icon, patron of Vilnius Orthodox Christians',
      location: 'Main iconostasis',
    },
    {
      id: 'icon-2',
      nameLt: 'Šv. Nikolajus Stebukladarys',
      nameEn: 'St. Nicholas the Wonderworker',
      origin: 'Russia',
      century: 'XVII',
      description: 'Highly venerated icon of St. Nicholas',
      location: 'Side chapel',
    },
    {
      id: 'icon-3',
      nameLt: 'Šv. Jurgis Pergalėtojas',
      nameEn: 'St. George the Victorious',
      origin: 'Greece',
      century: 'XVIII',
      description: 'Icon of the patron saint of the cathedral',
      location: 'Main iconostasis',
    },
  ] as IconInfo[],

  sacraments: {
    baptism: {
      nameLt: 'Krikštas',
      nameEn: 'Holy Baptism',
      preparation: 'Catechism required for adults, godparents instruction for infants',
    },
    chrismation: {
      nameLt: 'Sutvirtinimas',
      nameEn: 'Holy Chrismation',
      note: 'Administered immediately after baptism',
    },
    communion: {
      nameLt: 'Šv. Komunija',
      nameEn: 'Holy Communion',
      frequency: 'Every Divine Liturgy for prepared faithful',
    },
    confession: {
      nameLt: 'Išpažintis',
      nameEn: 'Holy Confession',
      schedule: 'Before each Liturgy or by appointment',
    },
    marriage: {
      nameLt: 'Vestuvės',
      nameEn: 'Holy Matrimony',
      requirements: 'Church Blessing (Crowning) after civil marriage',
    },
    unction: {
      nameLt: 'Patepimas',
      nameEn: 'Holy Unction',
      schedule: 'During Great Lent or by request for the sick',
    },
    ordination: {
      nameLt: 'Įšventinimas',
      nameEn: 'Holy Orders',
      note: 'By episcopal consecration only',
    },
  },

  statistics: {
    parishioners: 3500,
    averageSundayAttendance: 600,
    clergyCount: 4,
    feastAttendance: 1500,
  },

  onlineStore: {
    enabled: true,
    categories: [
      { id: 'icons', nameLt: 'Ikonos', nameEn: 'Icons' },
      { id: 'candles', nameLt: 'Žvakės', nameEn: 'Candles' },
      { id: 'books', nameLt: 'Knygos', nameEn: 'Books' },
      { id: 'other', nameLt: 'Kita', nameEn: 'Other' },
    ],
    paymentMethods: ['cash', 'bank_transfer'],
  },

  candleTypes: [
    { id: 'candle-1', nameLt: 'Maža žvakė', nameEn: 'Small candle', price: 0.50, burnTime: '2h' },
    { id: 'candle-2', nameLt: 'Vidutinė žvakė', nameEn: 'Medium candle', price: 1.00, burnTime: '4h' },
    { id: 'candle-3', nameLt: 'Didelė žvakė', nameEn: 'Large candle', price: 2.00, burnTime: '8h' },
    { id: 'candle-4', nameLt: 'Votyvinė žvakė', nameEn: 'Votive candle', price: 3.00, burnTime: '24h' },
  ],
} as const;

export type EntityConfig = typeof entityConfig;
