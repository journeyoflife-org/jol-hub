/**
 * Kaunas Lutheran Church - Entity Configuration
 * Example 6 of JOL-HUB Lithuania Website Framework
 * Protestant Church entity with Lutheran governance
 */

export interface ServiceTime {
  day: string;
  dayEn: string;
  times: string[];
  type: 'main' | 'vespers' | 'special' | 'bible-study';
  language?: string;
  notes?: string;
}

export interface LeadershipRole {
  id: string;
  name: string;
  title: string;
  titleEn: string;
  role: 'pastor' | 'deacon' | 'elder' | 'council';
  email: string;
  phone?: string;
  termStart?: string;
}

export interface GovernanceStructure {
  churchCouncil: {
    members: number;
    electionCycle: string;
    nextElection: string;
  };
  synodAffiliation: {
    name: string;
    nameEn: string;
    region: string;
  };
  constitution: {
    lastRevised: string;
    documentUrl?: string;
  };
}

export const entityConfig = {
  id: 'lt-lutheran-kaunas-001',
  name: {
    lt: 'Kauno evangelikų liuteronų bažnyčia',
    en: 'Kaunas Evangelical Lutheran Church',
  },
  type: 'protestant-church',
  denomination: 'lutheran',
  status: 'active',
  country: 'lt',

  ecclesiastical: {
    tradition: 'lutheran',
    synod: 'Evangelikų Liuteronų Bažnyčia Lietuvoje',
    synodEn: 'Evangelical Lutheran Church in Lithuania',
    founded: '1795',
    reformationHeritage: 'Lutheran Reformation',
    confession: 'Augsburg Confession',
  },

  address: {
    street: 'M. Valančiaus g. 9',
    city: 'Kaunas',
    postalCode: '44275',
    country: 'Lithuania',
  },

  contact: {
    email: 'info@kaunaslutheran.lt',
    phone: '+370 37 331 234',
    website: 'https://kaunaslutheran.lt',
    office: 'Parapijos biuras',
    officeHours: {
      weekdays: '10:00 - 16:00',
      byAppointment: true,
    },
  },

  bitrix24: {
    portalDomain: 'lutheran-lt.bitrix24.eu',
    crmScope: 'congregation',
    contactPrefix: 'kaunas_lutheran_',
    dealCategories: {
      donation: 'offerings',
      eventTicket: 'events',
      merchandise: 'merchandise',
    },
  },

  compliance: {
    level: 'congregation' as const,
    gdpr: true,
    churchGovernance: {
      type: 'lutheran',
      authority: 'Evangelikų Liuteronų Bažnyčia Lietuvoje',
      constitution: true,
      councilOversight: true,
    },
    audit: {
      enabled: true,
      logLevel: 'standard',
      retention: 7,
    },
    dataRetention: {
      memberData: 10,
      financialRecords: 7,
      historicalRecords: 'permanent',
    },
  },

  website: {
    domain: 'kaunaslutheran.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'de'],
    theme: 'lutheran-traditional',
  },

  pastor: {
    id: 'pastor-001',
    name: 'Vikaras Tomas Šernas',
    title: 'Kunigas',
    titleEn: 'Pastor',
    email: 'pastor@kaunaslutheran.lt',
    phone: '+370 37 331 234',
    role: 'pastor',
    termStart: '2015-08-01',
  } as LeadershipRole,

  leadership: [
    {
      id: 'leader-001',
      name: 'Vikaras Tomas Šernas',
      title: 'Kunigas',
      titleEn: 'Pastor',
      role: 'pastor',
      email: 'pastor@kaunaslutheran.lt',
      phone: '+370 37 331 234',
      termStart: '2015-08-01',
    },
    {
      id: 'leader-002',
      name: 'Asta Petronienė',
      title: 'Vyresnioji',
      titleEn: 'Elder',
      role: 'elder',
      email: 'vyresnioji@kaunaslutheran.lt',
    },
    {
      id: 'leader-003',
      name: 'Jonas Kavaliauskas',
      title: 'Diakonas',
      titleEn: 'Deacon',
      role: 'deacon',
      email: 'diakonas@kaunaslutheran.lt',
    },
  ] as LeadershipRole[],

  governance: {
    churchCouncil: {
      members: 7,
      electionCycle: '3 years',
      nextElection: '2027-03',
    },
    synodAffiliation: {
      name: 'Evangelikų Liuteronų Bažnyčia Lietuvoje',
      nameEn: 'Evangelical Lutheran Church in Lithuania',
      region: 'Lithuania',
    },
    constitution: {
      lastRevised: '2020-05-15',
    },
  } as GovernanceStructure,

  serviceSchedule: [
    {
      day: 'Sekmadienis',
      dayEn: 'Sunday',
      times: ['10:00'],
      type: 'main',
      language: 'lt',
      notes: 'Pagrindinės pamaldos su Šv. Vakariene',
    },
    {
      day: 'Sekmadienis',
      dayEn: 'Sunday',
      times: ['18:00'],
      type: 'vespers',
      language: 'lt',
      notes: 'Vakarinės pamaldos',
    },
    {
      day: 'Trečiadienis',
      dayEn: 'Wednesday',
      times: ['18:30'],
      type: 'bible-study',
      language: 'lt',
      notes: 'Biblijos studijos',
    },
    {
      day: 'Pirmasis mėnesio sekmadienis',
      dayEn: 'First Sunday of month',
      times: ['10:00'],
      type: 'special',
      language: 'lt',
      notes: 'Šv. Vakarienė / Holy Communion',
    },
  ] as ServiceTime[],

  sacraments: {
    baptism: {
      description: 'Krikštas Šventajame vandenyje',
      preparationRequired: true,
      contact: 'Kunigas',
    },
    communion: {
      description: 'Šv. Vakarienė pirmąjį mėnesio sekmadienį',
      frequency: 'monthly',
      openTo: 'all baptized believers',
    },
    confirmation: {
      description: 'Konfirmacija jaunimui',
      preparationYears: 2,
      age: '14-16',
    },
    marriage: {
      description: 'Vestuvių palaiminimas',
      preparationRequired: true,
      contact: 'Kunigas',
    },
  },

  statistics: {
    congregationMembers: 450,
    averageSundayAttendance: 120,
    sundaySchoolChildren: 35,
    bibleStudyGroups: 3,
  },

  onlineStore: {
    enabled: true,
    products: [
      { category: 'merchandise', nameLt: 'Bendruomenės prekės', nameEn: 'Community Merchandise' },
      { category: 'tickets', nameLt: 'Renginių bilietai', nameEn: 'Event Tickets' },
    ],
    paymentMethods: ['stripe', 'cash', 'bank_transfer'],
  },

  communityPrograms: [
    {
      id: 'prog-1',
      name: 'Sekmadienio mokykla',
      nameEn: 'Sunday School',
      schedule: 'Sundays 11:30',
      ages: '5-14',
    },
    {
      id: 'prog-2',
      name: 'Jaunimo grupė',
      nameEn: 'Youth Group',
      schedule: 'Fridays 18:00',
      ages: '15-25',
    },
    {
      id: 'prog-3',
      name: 'Moterų draugija',
      nameEn: "Women's Fellowship",
      schedule: '2nd Tuesday monthly',
    },
    {
      id: 'prog-4',
      name: 'Vyrų draugija',
      nameEn: "Men's Fellowship",
      schedule: '3rd Saturday monthly',
    },
  ],
} as const;

export type EntityConfig = typeof entityConfig;
