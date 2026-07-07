/**
 * Vilnius Greek Catholic Church - Entity Configuration
 * Example 8 of JOL-HUB Lithuania Website Framework
 * Greek Catholic (Byzantine Rite) church in full communion with Rome
 * 
 * Features:
 * - Byzantine calendar (Gregorian for fixed feasts)
 * - Divine Liturgy schedules
 * - Eastern Christian online store
 * - Bitrix24 CRM congregation management
 * - GDPR + Eastern Catholic governance compliance
 */

export interface ByzantineService {
  type: 'divine-liturgy' | 'vespers' | 'matins' | 'all-night-vigil' | 'moleben' | 'parastas';
  nameLt: string;
  nameEn: string;
  description?: string;
}

export interface ByzantineFeast {
  id: string;
  date: string;
  nameLt: string;
  nameEn: string;
  nameUk?: string;
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
  rank: 'bishop' | 'protosyncellus' | 'hegumen' | 'priest' | 'deacon';
  email?: string;
}

export const entityConfig = {
  id: 'lt-greek-catholic-vilnius-001',
  name: {
    lt: 'Vilniaus Šv. Apaštalų Petro ir Povilo Graikų Katalikų Bažnyčia',
    en: 'Vilnius Greek Catholic Church of Sts. Peter and Paul',
    uk: 'Вільнюська Греко-Католицька Церква Свв. Апостолів Петра і Павла',
  },
  type: 'church_other',
  tradition: 'greek-catholic',
  status: 'active',
  country: 'lt',

  ecclesiastical: {
    church: 'Ukrainian Greek Catholic Church',
    churchLt: 'Ukrainos Graikų Katalikų Bažnyčia',
    eparchy: 'Kyiv-Halych Eparchy',
    eparchyLt: 'Kijevo-Haličo Eparchija',
    rite: 'Byzantine Rite',
    riteLt: 'Bizantijos apeigos',
    calendar: 'Gregorian Calendar (New Style)',
    calendarNote: 'Fixed feasts follow Gregorian; Pascha calculated separately',
    jurisdiction: 'Ukrainian Greek Catholic Church in communion with Rome',
    suiJuris: true, // Self-governing church
    founded: '1991',
    consecrated: '1997',
  },

  address: {
    street: 'M. Valančiaus g. 5',
    city: 'Vilnius',
    postalCode: '03102',
    country: 'Lithuania',
  },

  contact: {
    email: 'info@greekcatholic.lt',
    phone: '+370 5 234 5678',
    website: 'https://greekcatholic.lt',
    office: 'Parapijos raštinė',
    officeHours: {
      weekdays: '10:00 - 18:00',
      weekends: 'By appointment',
    },
  },

  bitrix24: {
    portalDomain: 'greekcatholic-lt.bitrix24.eu',
    crmScope: 'congregation',
    contactPrefix: 'greek_catholic_vilnius_',
    dealCategories: {
      donation: 'offerings',
      candleOrder: 'candles',
      iconPurchase: 'icons',
      eventTickets: 'events',
    },
  },

  compliance: {
    level: 'congregation' as const,
    gdpr: true,
    easternCatholicGovernance: {
      enabled: true,
      reportingFrequency: 'annual',
      reportingTo: 'Kyiv-Halych Eparchy',
      dataSharing: ['baptismal_records', 'marriage_records', 'statistical_reports'],
      canonLaw: 'Eastern Canon Law (CCEO)',
    },
    audit: {
      enabled: true,
      logLevel: 'standard',
      retention: 7,
    },
    dataRetention: {
      parishionerData: 10,
      sacramentalRecords: 'permanent', // Canon 535 equivalent for Eastern Churches
      financialRecords: 7,
      eparchyReports: 'permanent',
    },
  },

  website: {
    domain: 'greekcatholic.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'uk'],
    theme: 'byzantine-catholic',
  },

  rector: {
    id: 'clergy-001',
    name: 'Tėvas Mykolas Petraitis',
    title: 'Klebonas',
    titleEn: 'Pastor',
    rank: 'priest',
    email: 'fr.mykolas@greekcatholic.lt',
  } as ClergyMember,

  clergy: [
    {
      id: 'clergy-001',
      name: 'Tėvas Mykolas Petraitis',
      title: 'Klebonas',
      titleEn: 'Pastor',
      rank: 'priest',
      email: 'fr.mykolas@greekcatholic.lt',
    },
    {
      id: 'clergy-002',
      name: 'Tėvas Andrijus Kovalčuk',
      title: 'Vikaras',
      titleEn: 'Vicar',
      rank: 'priest',
      email: 'fr.andrijus@greekcatholic.lt',
    },
    {
      id: 'clergy-003',
      name: 'Djakonas Taras Shevchenko',
      title: 'Djakonas',
      titleEn: 'Deacon',
      rank: 'deacon',
    },
  ] as ClergyMember[],

  serviceTypes: {
    'divine-liturgy': {
      type: 'divine-liturgy',
      nameLt: 'Šv. Liturgija',
      nameEn: 'Divine Liturgy',
      description: 'The main Byzantine worship service - Liturgy of St. John Chrysostom or St. Basil',
    },
    vespers: {
      type: 'vespers',
      nameLt: 'Vakarinės',
      nameEn: 'Great Vespers',
    },
    matins: {
      type: 'matins',
      nameLt: 'Rytmetinės',
      nameEn: 'Matins (Orthros)',
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
    parastas: {
      type: 'parastas',
      nameLt: 'Parastasas',
      nameEn: 'Parastas (Memorial Service)',
    },
  },

  serviceSchedule: [
    {
      day: 'Sekmadienis / Sunday / Неділя',
      dayEn: 'Sunday',
      services: [
        { time: '09:00', type: 'matins', nameLt: 'Rytmetinės' },
        { time: '10:00', type: 'divine-liturgy', nameLt: 'Šv. Liturgija (Ukrainiečių k.)' },
        { time: '12:00', type: 'divine-liturgy', nameLt: 'Šv. Liturgija (Lietuvių k.)' },
        { time: '17:00', type: 'vespers', nameLt: 'Vakarinės' },
      ],
    },
    {
      day: 'Šeštadienis / Saturday / Субота',
      dayEn: 'Saturday',
      services: [
        { time: '09:00', type: 'divine-liturgy', nameLt: 'Šv. Liturgija' },
        { time: '17:00', type: 'all-night-vigil', nameLt: 'Visanaktinė budynė' },
      ],
    },
    {
      day: 'Darbo dienos / Weekdays / Будні',
      dayEn: 'Weekdays',
      services: [
        { time: '08:00', type: 'divine-liturgy', nameLt: 'Šv. Liturgija' },
        { time: '17:00', type: 'vespers', nameLt: 'Vakarinės' },
      ],
    },
  ],

  // Byzantine Great Feasts (Gregorian calendar)
  greatFeasts: [
    { id: 'feast-1', date: '09-08', nameLt: 'Dievo Motinos Gimimas', nameEn: 'Nativity of the Theotokos', type: 'twelve', isMoveable: false },
    { id: 'feast-2', date: '09-14', nameLt: 'Kryžiaus Išaukštinimas', nameEn: 'Exaltation of the Cross', type: 'twelve', isMoveable: false },
    { id: 'feast-3', date: '11-21', nameLt: 'Dievo Motinos Įėjimas į Šventyklą', nameEn: 'Entry of the Theotokos', type: 'twelve', isMoveable: false },
    { id: 'feast-4', date: '12-25', nameLt: 'Kristaus Gimimas (Kalėdos)', nameEn: 'Nativity of Christ', type: 'great', isMoveable: false },
    { id: 'feast-5', date: '01-06', nameLt: 'Dievo Apvaizda (Epifanija)', nameEn: 'Theophany', type: 'great', isMoveable: false },
    { id: 'feast-6', date: '02-02', nameLt: 'Viešpaties Susitikimas', nameEn: 'Meeting of the Lord', type: 'twelve', isMoveable: false },
    { id: 'feast-7', date: '03-25', nameLt: 'Viešpaties Apreiškimas', nameEn: 'Annunciation', type: 'twelve', isMoveable: false },
    { id: 'feast-8', date: 'moveable', nameLt: 'Velykos (Prisikėlimas)', nameEn: 'Pascha (Resurrection)', type: 'great', isMoveable: true },
    { id: 'feast-9', date: 'moveable+40', nameLt: 'Dangun Žengimas', nameEn: 'Ascension', type: 'twelve', isMoveable: true },
    { id: 'feast-10', date: 'moveable+50', nameLt: 'Sekminės', nameEn: 'Pentecost', type: 'great', isMoveable: true },
    { id: 'feast-11', date: '08-06', nameLt: 'Viešpaties Permainymas', nameEn: 'Transfiguration', type: 'twelve', isMoveable: false },
    { id: 'feast-12', date: '08-15', nameLt: 'Dievo Motinos Dormicija', nameEn: 'Dormition of the Theotokos', type: 'great', isMoveable: false },
  ] as ByzantineFeast[],

  notableIcons: [
    {
      id: 'icon-1',
      nameLt: 'Vilniaus Dievo Motinos Ikona',
      nameEn: 'Vilnius Icon of the Mother of God',
      origin: 'Kyiv',
      century: 'XVIII',
      description: 'Miracle-working icon of the Theotokos, patron of the community',
      location: 'Iconostasis',
    },
    {
      id: 'icon-2',
      nameLt: 'Šv. Apaštalai Petras ir Paulius',
      nameEn: 'Holy Apostles Peter and Paul',
      origin: 'Lviv',
      century: 'XIX',
      description: 'Patron saints icon of the church',
      location: 'Main iconostasis',
    },
    {
      id: 'icon-3',
      nameLt: 'Šv. Josafatas Kuncevičius',
      nameEn: 'St. Josaphat Kuntsevych',
      origin: 'Polotsk',
      century: 'XVII',
      description: 'Patron of church unity, martyr for unity between Rome and Constantinople',
      location: 'Side chapel',
    },
  ] as IconInfo[],

  sacraments: {
    baptism: {
      nameLt: 'Krikštas',
      nameEn: 'Holy Baptism',
      nameUk: 'Хрещення',
      preparation: 'Catechism required for adults; godparents instruction for infants',
      note: 'Triple immersion in Byzantine tradition',
    },
    chrismation: {
      nameLt: 'Sutvirtinimas (Krizma)',
      nameEn: 'Holy Chrismation (Confirmation)',
      nameUk: 'Миропомазання',
      note: 'Administered immediately after baptism by priest (not bishop)',
    },
    communion: {
      nameLt: 'Šv. Komunija',
      nameEn: 'Holy Communion',
      nameUk: 'Причастя',
      frequency: 'Every Divine Liturgy for prepared faithful',
      note: 'Both species: Body and Blood of Christ',
    },
    confession: {
      nameLt: 'Išpažintis',
      nameEn: 'Holy Confession',
      nameUk: 'Сповідь',
      schedule: 'Before each Liturgy or by appointment',
      note: 'Mystery of Repentance',
    },
    marriage: {
      nameLt: 'Vestuvės (Karūnavimas)',
      nameEn: 'Holy Matrimony (Crowning)',
      nameUk: 'Вінчання',
      requirements: 'Crowning ceremony after civil marriage; preparation classes required',
    },
    unction: {
      nameLt: 'Patepimas',
      nameEn: 'Holy Unction',
      nameUk: 'Єлеопомазання',
      schedule: 'During Great Lent or by request for the sick',
    },
    ordination: {
      nameLt: 'Įšventinimas',
      nameEn: 'Holy Orders',
      nameUk: 'Священство',
      note: 'By episcopal consecration only; married men may be ordained to priesthood',
    },
  },

  statistics: {
    parishioners: 1200,
    ukrainianCommunity: 800,
    lithuanianCommunity: 400,
    averageSundayAttendance: 350,
    clergyCount: 3,
    feastAttendance: 600,
  },

  onlineStore: {
    enabled: true,
    categories: [
      { id: 'icons', nameLt: 'Ikonos', nameEn: 'Icons', nameUk: 'Ікони' },
      { id: 'candles', nameLt: 'Žvakės', nameEn: 'Candles', nameUk: 'Свічки' },
      { id: 'books', nameLt: 'Knygos', nameEn: 'Books', nameUk: 'Книги' },
      { id: 'vestments', nameLt: 'Apeiginiai drabužiai', nameEn: 'Vestments', nameUk: 'Вбрання' },
      { id: 'music', nameLt: 'Muzika', nameEn: 'Music', nameUk: 'Музика' },
      { id: 'other', nameLt: 'Kita', nameEn: 'Other', nameUk: 'Інше' },
    ],
    paymentMethods: ['cash', 'bank_transfer', 'stripe'],
  },

  candleTypes: [
    { id: 'candle-1', nameLt: 'Maža žvakė', nameEn: 'Small candle', price: 0.50, burnTime: '2h' },
    { id: 'candle-2', nameLt: 'Vidutinė žvakė', nameEn: 'Medium candle', price: 1.00, burnTime: '4h' },
    { id: 'candle-3', nameLt: 'Didelė žvakė', nameEn: 'Large candle', price: 2.00, burnTime: '8h' },
    { id: 'candle-4', nameLt: 'Votyvinė žvakė', nameEn: 'Votive candle', price: 3.00, burnTime: '24h' },
    { id: 'candle-5', nameLt: 'Paschalio žvakė', nameEn: 'Paschal candle', price: 10.00, burnTime: '48h' },
  ],

  events: [
    {
      id: 'event-1',
      name: 'Byzantine Chant Workshop',
      nameLt: 'Bizantinio giedojimo dirbtuvės',
      nameUk: 'Майстерня візантійського співу',
      date: '2024-03-15',
      location: 'Church Hall',
      ticketPrice: 15,
    },
    {
      id: 'event-2',
      name: 'Icon Painting Course',
      nameLt: 'Ikonų tapybos kursai',
      nameUk: 'Курси іконопису',
      date: '2024-04-20',
      location: 'Parish Center',
      ticketPrice: 50,
    },
  ],
} as const;

export type EntityConfig = typeof entityConfig;
