/**
 * Vilnius Funeral Home - Entity Configuration
 * Examples 9-10 of JOL-HUB Lithuania Website Framework
 * Funeral home entity with PCI-DSS compliance
 */

export interface ServicePackage {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  includes: string[];
  type: 'basic' | 'traditional' | 'premium' | 'cremation';
}

export interface Obituary {
  id: string;
  deceasedName: string;
  birthDate: string;
  deathDate: string;
  photo?: string;
  biography?: string;
  serviceDate?: string;
  serviceLocation?: string;
  published: boolean;
}

export interface Casket {
  id: string;
  name: string;
  material: string;
  finish: string;
  interior: string;
  price: number;
  inStock: boolean;
  image?: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'florist' | 'transport' | 'cemetery' | 'crematorium' | 'catering' | 'music';
  contact: string;
  phone: string;
  email: string;
}

export interface PreNeedPlan {
  id: string;
  planType: 'basic' | 'traditional' | 'premium';
  monthlyPayment: number;
  totalValue: number;
  includes: string[];
  contractDuration: number; // months
}

export const entityConfig = {
  id: 'lt-funeral-vilnius-001',
  name: {
    lt: 'Vilniaus Laidojimo Namai',
    en: 'Vilnius Funeral Home',
  },
  type: 'funeral-home',
  status: 'active',
  country: 'lt',

  business: {
    established: '1995',
    license: 'FUN-2024-VIL-001',
    director: 'Antanas Kavaliauskas',
    employees: 15,
  },

  address: {
    street: 'Laidojimo g. 15',
    city: 'Vilnius',
    postalCode: '01141',
    country: 'Lithuania',
  },

  contact: {
    email: 'info@vilniusfuneral.lt',
    phone: '+370 5 210 5555',
    emergency: '+370 699 12345',
    website: 'https://vilniusfuneral.lt',
    hours: {
      weekdays: '08:00 - 18:00',
      weekends: '09:00 - 15:00',
      emergency: '24/7',
    },
  },

  bitrix24: {
    portalDomain: 'vilnius-funeral.bitrix24.eu',
    crmScope: 'funeral',
    contactPrefix: 'funeral_vilnius_',
    dealCategories: {
      atNeed: 'at_need_services',
      preNeed: 'pre_need_contracts',
      merchandise: 'merchandise_sales',
    },
  },

  compliance: {
    level: 'commercial' as const,
    gdpr: true,
    pciDss: {
      enabled: true,
      level: 'Level 2',
      saq: 'SAQ D',
      assessmentDate: '2025-06-01',
    },
    financialTransactionLogging: true,
    preNeedContractManagement: true,
    audit: {
      enabled: true,
      logLevel: 'detailed',
      retention: 10,
      tamperEvident: true,
    },
    dataRetention: {
      clientRecords: 10,
      financialRecords: 10,
      preNeedContracts: 'permanent',
      obituaries: 'permanent',
    },
  },

  website: {
    domain: 'vilniusfuneral.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'ru'],
    theme: 'memorial-dignified',
  },

  servicePackages: [
    {
      id: 'pkg-basic',
      name: 'Pagrindinis paketas',
      nameEn: 'Basic Package',
      description: 'Paprastas, orus atsisveikinimas',
      price: 1500,
      type: 'basic',
      includes: [
        'Laidojimo kameros naudojimas',
        'Paprastas karstas',
        'Transportas iki kapinių',
        'Administraciniai dokumentai',
        'Konsultacija su šeima',
      ],
    },
    {
      id: 'pkg-traditional',
      name: 'Tradicinis paketas',
      nameEn: 'Traditional Package',
      description: 'Pilnas tradicinis atsisveikinimas',
      price: 3500,
      type: 'traditional',
      includes: [
        'Laidojimo namų patalpos (3 dienos)',
        'Tradicinis karstas su interjeru',
        'Gėlių kompozicija',
        'Transportas su eskortu',
        'Kapinių tarnyba',
        'Atminimo kortelės',
        'Kondolencijų knyga',
        'Administraciniai dokumentai',
      ],
    },
    {
      id: 'pkg-premium',
      name: 'Premium paketas',
      nameEn: 'Premium Package',
      description: 'Išskirtinė atsisveikinimo ceremonija',
      price: 6500,
      type: 'premium',
      includes: [
        'Laidojimo namų patalpos (5 dienos)',
        'Premium karstas rankų darbo',
        'Pramogos gėlių apipavidalinimas',
        'Limuzino transportas',
        'Muzikos tarnyba (vargonai/vokalas)',
        'Atminimo programa',
        'Vaizdo transliacija',
        'Kavos priėmimas po ceremonijos',
        'Visi administraciniai darbai',
      ],
    },
    {
      id: 'pkg-cremation',
      name: 'Kremavimo paketas',
      nameEn: 'Cremation Package',
      description: 'Orus kremavimo paslaugų paketas',
      price: 1200,
      type: 'cremation',
      includes: [
        'Kremavimo procedūra',
        'Paprasta urna',
        'Atminimo ceremonija',
        'Administraciniai dokumentai',
        'Pelenų perdavimas šeimai',
      ],
    },
  ] as ServicePackage[],

  caskets: [
    {
      id: 'casket-1',
      name: 'Klasikinis ąžuolinis karstas',
      material: 'Ąžuolas',
      finish: 'Natūralus',
      interior: 'Baltas atlasas',
      price: 1200,
      inStock: true,
    },
    {
      id: 'casket-2',
      name: 'Pušinis karstas',
      material: 'Pušis',
      finish: 'Lakuotas',
      interior: 'Kreminis atlasas',
      price: 600,
      inStock: true,
    },
    {
      id: 'casket-3',
      name: 'Premium riešutmedžio karstas',
      material: 'Riešutmedis',
      finish: 'Rankinis poliravimas',
      interior: 'Šilkinis atlasas',
      price: 2500,
      inStock: true,
    },
    {
      id: 'casket-4',
      name: 'Metalinis karstas',
      material: 'Plienas',
      finish: 'Bronzos spalva',
      interior: 'Aksomas',
      price: 1800,
      inStock: false,
    },
  ] as Casket[],

  memorialProducts: [
    { id: 'mem-1', name: 'Atminimo kortelės (50 vnt.)', price: 50, category: 'cards' },
    { id: 'mem-2', name: 'Kondolencijų knyga', price: 35, category: 'books' },
    { id: 'mem-3', name: 'Gėlių vainikas', price: 150, category: 'flowers' },
    { id: 'mem-4', name: 'Atminimo žvakidė', price: 45, category: 'candles' },
    { id: 'mem-5', name: 'Antkapio plokštė', price: 800, category: 'monuments' },
    { id: 'mem-6', name: 'Urna dekoratyvinė', price: 300, category: 'urns' },
  ],

  vendors: [
    { id: 'v-1', name: 'Vilniaus gėlės', type: 'florist', contact: 'Gėlių skyrius', phone: '+370 5 212 0001', email: 'geles@vilniusflowers.lt' },
    { id: 'v-2', name: 'Karstų transportas', type: 'transport', contact: 'Vairavimo tarnyba', phone: '+370 5 212 0002', email: 'transportas@vilniusfuneral.lt' },
    { id: 'v-3', name: 'Antakalnio kapinės', type: 'cemetery', contact: 'Administracija', phone: '+370 5 270 0001', email: 'info@antakalnio.lt' },
    { id: 'v-4', name: 'Vilniaus krematorija', type: 'crematorium', contact: 'Kremavimo centras', phone: '+370 5 270 0002', email: 'krematorija@vilnius.lt' },
  ] as Vendor[],

  preNeedPlans: [
    {
      id: 'preneed-basic',
      planType: 'basic',
      monthlyPayment: 25,
      totalValue: 2000,
      includes: ['Pagrindinis laidotuvių paketas', 'Paprastas karstas', 'Transportas'],
      contractDuration: 96,
    },
    {
      id: 'preneed-traditional',
      planType: 'traditional',
      monthlyPayment: 50,
      totalValue: 4500,
      includes: ['Tradicinis laidotuvių paketas', 'Kokybiškas karstas', 'Gėlės', 'Muzika'],
      contractDuration: 96,
    },
    {
      id: 'preneed-premium',
      planType: 'premium',
      monthlyPayment: 100,
      totalValue: 9000,
      includes: ['Premium laidotuvių paketas', 'Rankų darbo karstas', 'Visos paslaugos', 'Transliacija'],
      contractDuration: 96,
    },
  ] as PreNeedPlan[],

  griefResources: [
    {
      id: 'gr-1',
      title: 'Kaip kalbėti su vaikais apie mirtį',
      titleEn: 'How to talk to children about death',
      category: 'family',
    },
    {
      id: 'gr-2',
      title: 'Gedėjimo stadijos',
      titleEn: 'Stages of Grief',
      category: 'psychological',
    },
    {
      id: 'gr-3',
      title: 'Juridiniai klausimai po mirties',
      titleEn: 'Legal matters after death',
      category: 'legal',
    },
    {
      id: 'gr-4',
      title: 'Palaikymo grupių sąrašas',
      titleEn: 'Support groups list',
      category: 'support',
    },
  ],

  statistics: {
    yearsInService: 29,
    familiesServed: 8500,
    averageRating: 4.8,
    preNeedContracts: 450,
  },
} as const;

export type EntityConfig = typeof entityConfig;
