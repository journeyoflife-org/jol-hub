/**
 * St. John Vilnius Parish - Entity Configuration
 * Example 5 of JOL-HUB Lithuania Website Framework
 * Parish-level entity with standard GDPR compliance
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

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  titleEn: string;
  email: string;
  phone?: string;
  role: 'pastor' | 'associate' | 'deacon' | 'staff';
}

export interface HallInfo {
  id: string;
  name: string;
  nameEn: string;
  capacity: number;
  amenities: string[];
  hourlyRate: number;
  available: boolean;
}

export const entityConfig = {
  id: 'lt-parish-st-john-vilnius-001',
  name: {
    lt: 'Vilniaus Šv. Jonų bažnyčia',
    en: 'St. Johns Church Vilnius',
  },
  type: 'parish',
  status: 'active',
  country: 'lt',

  canonical: {
    rite: 'roman',
    jurisdiction: 'Vilnius Archdiocese',
    parentDiocese: 'lt-diocese-vilnius-001',
    parentDeanery: 'lt-deanery-vilnius-city-001',
    patronSaint: 'St. John the Baptist and St. John the Evangelist',
    established: '1387',
  },

  address: {
    street: 'Šv. Jono g. 12',
    city: 'Vilnius',
    postalCode: '01141',
    country: 'Lithuania',
  },

  contact: {
    email: 'jonai@vilnius.lt',
    phone: '+370 5 261 5454',
    website: 'https://svjonai.lt',
    office: 'Parapijos biuras (prie bažnyčios)',
    officeHours: {
      weekdays: '09:00 - 17:00',
      weekends: '10:00 - 12:00',
    },
  },

  hierarchy: {
    parentDiocese: 'lt-diocese-vilnius-001',
    parentDeanery: 'lt-deanery-vilnius-city-001',
    parishId: 'p-2',
  },

  bitrix24: {
    portalDomain: 'vilnius-arkivyskupija.bitrix24.eu',
    crmScope: 'parish',
    contactPrefix: 'st_john_',
    dealCategories: {
      donation: 'donations',
      massIntention: 'mass_intentions',
      hallRental: 'hall_rentals',
      eventRegistration: 'events',
    },
  },

  compliance: {
    level: 'parish' as const,
    standardGDPR: true,
    sacramentalRecordProtection: true,
    canonicalRecords: true,
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
    consentManagement: {
      enabled: true,
      defaultLanguage: 'lt',
      versioning: true,
    },
  },

  website: {
    domain: 'svjonai.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en'],
    theme: 'parish-traditional',
  },

  pastor: {
    id: 'priest-001',
    name: 'Kun. Dr. Jonas Ivanauskas',
    title: 'Klebonas',
    titleEn: 'Pastor',
    email: 'klebonas@svjonai.lt',
    phone: '+370 5 261 5454',
    role: 'pastor',
    appointmentDate: '2018-09-01',
    biography: {
      lt: 'Vilniaus arkivyskupijos kunigas, teologijos daktaras',
      en: 'Priest of Vilnius Archdiocese, Doctor of Theology',
    },
  } as StaffMember,

  staff: [
    {
      id: 'priest-002',
      name: 'Kun. Marius Petrauskas',
      title: 'Vikaras',
      titleEn: 'Associate Pastor',
      email: 'vikaras@svjonai.lt',
      role: 'associate',
    },
    {
      id: 'deacon-001',
      name: 'Djak. Antanas Kazlauskas',
      title: 'Djakonas',
      titleEn: 'Deacon',
      email: 'diakonas@svjonai.lt',
      role: 'deacon',
    },
    {
      id: 'staff-001',
      name: 'Ona Matulionė',
      title: 'Parapijos administratorė',
      titleEn: 'Parish Administrator',
      email: 'biuras@svjonai.lt',
      phone: '+370 5 261 5454',
      role: 'staff',
    },
    {
      id: 'staff-002',
      name: 'Vaclovas Kavaliauskas',
      title: 'Vargonininkas',
      titleEn: 'Organist',
      email: 'muzika@svjonai.lt',
      role: 'staff',
    },
  ] as StaffMember[],

  massSchedule: [
    {
      day: 'Pirmadienis - Penktadienis',
      dayEn: 'Monday - Friday',
      times: ['07:30', '18:30'],
    },
    {
      day: 'Šeštadienis',
      dayEn: 'Saturday',
      times: ['09:00', '18:00'],
    },
    {
      day: 'Sekmadienis',
      dayEn: 'Sunday',
      times: ['09:00', '11:00', '18:00'],
      notes: '11:00 - pagrindinės Šv. Mišios',
    },
    {
      day: 'Šventinės dienos',
      dayEn: 'Holy Days',
      times: ['07:30', '09:00', '11:00', '18:00'],
      notes: 'Patikslinkite tvarkaraštį šventėms',
    },
  ] as MassTime[],

  confessionSchedule: {
    weekdays: {
      times: '16:00 - 18:00',
      location: 'Klauskite zakristijoje',
    },
    weekends: {
      times: '08:00 - 08:45, 17:00 - 17:45',
      location: 'Išpažinties klausykla',
    },
    byAppointment: true,
  },

  adorationSchedule: {
    thursday: {
      time: '17:00 - 18:00',
      location: 'Šv. Sakramento koplyčia',
    },
    firstFriday: {
      time: '17:00 - 19:00',
      location: 'Pagrindinė bažnyčia',
    },
  },

  sacraments: [
    {
      id: 'baptism',
      name: 'Krikštas',
      nameEn: 'Baptism',
      description: 'Krikšto sakramentas - įėjimas į Bažnyčią',
      descriptionEn: 'Sacrament of Baptism - entry into the Church',
      requirements: [
        'Gyvenimas pagal krikščioniškus principus',
        'Tėvų ir krikštatėvių katechezė',
        'Parapijos teritorijoje gyvenate arba registruotas parapijai',
      ],
      contact: 'Parapijos biuras',
      preparationRequired: true,
      preparationDuration: '2-3 savaitės',
    },
    {
      id: 'first-communion',
      name: 'Pirmoji Komunija',
      nameEn: 'First Communion',
      description: 'Eucharistijos sakramentas pirmą kartą',
      descriptionEn: 'First reception of the Eucharist',
      requirements: [
        'Krikšto liudijimas',
        'Katechezės kursas (2 metai)',
        'Pirmosios išpažinties pasiruošimas',
      ],
      contact: 'Katechezės vadovas',
      preparationRequired: true,
      preparationDuration: '2 metai',
    },
    {
      id: 'confirmation',
      name: 'Sutvirtinimas',
      nameEn: 'Confirmation',
      description: 'Sutvirtinimo sakramentas',
      descriptionEn: 'Sacrament of Confirmation',
      requirements: [
        'Krikšto ir Pirmosios Komunijos liudijimas',
        'Katechezės kursas',
        'Krikštatėvių dalyvavimas',
      ],
      contact: 'Parapijos kunigas',
      preparationRequired: true,
      preparationDuration: '1-2 metai',
    },
    {
      id: 'marriage',
      name: 'Santuoka',
      nameEn: 'Marriage',
      description: 'Santuokos sakramentas',
      descriptionEn: 'Sacrament of Holy Matrimony',
      requirements: [
        'Krikšto liudijimas (ne senesnis kaip 6 mėn.)',
        'Santuokos paruošimo kursas',
        'Laisvos būsenos įrodymas',
        'Susitikimas su kunigu (6 mėn. prieš vestuves)',
      ],
      contact: 'Klebonas',
      preparationRequired: true,
      preparationDuration: '6 mėnesiai',
    },
    {
      id: 'confession',
      name: 'Išpažintis',
      nameEn: 'Confession',
      description: 'Atgailos sakramentas',
      descriptionEn: 'Sacrament of Reconciliation',
      requirements: [
        'Sąžinės apsvarstymas',
        'Atgailos ketinimas',
      ],
      contact: 'Bet kuris kunigas',
      preparationRequired: false,
    },
    {
      id: 'anointing',
      name: 'Ligonių patepimas',
      nameEn: 'Anointing of the Sick',
      description: 'Ligonių patepimo sakramentas',
      descriptionEn: 'Sacrament of the Anointing of the Sick',
      requirements: [
        'Sunkiai sergantis arba pavojingose operacijose',
      ],
      contact: 'Parapijos biuras arba bet kuris kunigas',
      preparationRequired: false,
    },
  ] as SacramentInfo[],

  halls: [
    {
      id: 'hall-main',
      name: 'Šv. Jono salė',
      nameEn: 'St. John Hall',
      capacity: 150,
      amenities: ['Virtuvė', 'Stalai ir kėdės', 'Garsinė sistema', 'Projektorius', 'Įėjimas neįgaliesiems'],
      hourlyRate: 25,
      available: true,
    },
    {
      id: 'hall-small',
      name: 'Mažoji salė',
      nameEn: 'Small Hall',
      capacity: 40,
      amenities: ['Virtuvė', 'Stalai ir kėdės'],
      hourlyRate: 15,
      available: true,
    },
  ] as HallInfo[],

  statistics: {
    registeredParishioners: 4200,
    averageSundayAttendance: 850,
    annualBaptisms: 65,
    annualMarriages: 32,
    annualFunerals: 48,
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'mass-intentions', nameLt: 'Šv. Mišių intencijos', nameEn: 'Mass Intentions' },
      { category: 'religious-items', nameLt: 'Religiniai daiktai', nameEn: 'Religious Items' },
      { category: 'hall-rental', nameLt: 'Salės nuoma', nameEn: 'Hall Rental' },
    ],
    paymentMethods: ['stripe', 'cash', 'bank_transfer'],
  },
} as const;

export type EntityConfig = typeof entityConfig;
