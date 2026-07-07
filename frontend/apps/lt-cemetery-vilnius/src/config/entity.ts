/**
 * Vilnius Cemetery Services - Entity Configuration
 * Examples 11-12 of JOL-HUB Lithuania Website Framework
 * Cemetery services with GDPR + PCI-DSS compliance for deceased person data handling
 */

export interface CemeteryService {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  price: number;
  category: 'burial' | 'cremation' | 'maintenance' | 'memorial';
}

export interface GravePlot {
  id: string;
  section: string;
  row: number;
  plot: number;
  type: 'single' | 'double' | 'family';
  status: 'available' | 'occupied' | 'reserved';
  coordinates: { lat: number; lng: number };
  owner?: string;
  deceased?: DeceasedPerson[];
}

export interface DeceasedPerson {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  epitaph?: string;
  photoUrl?: string;
}

export interface Monument {
  id: string;
  name: string;
  material: 'granite' | 'marble' | 'bronze' | 'stone';
  style: 'classic' | 'modern' | 'orthodox' | 'cross';
  dimensions: { height: number; width: number };
  price: number;
  customizationAvailable: boolean;
}

export interface MaintenancePlan {
  id: string;
  name: string;
  nameEn: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  services: string[];
  pricePerVisit: number;
  annualPrice: number;
}

export interface FlowerDelivery {
  id: string;
  name: string;
  flowers: string[];
  price: number;
  seasonal: boolean;
}

export const entityConfig = {
  id: 'lt-cemetery-vilnius-001',
  name: {
    lt: 'Vilniaus Kapinių Tarnyba',
    en: 'Vilnius Cemetery Services',
  },
  type: 'cemetery',
  status: 'active',
  country: 'lt',

  business: {
    established: '1900',
    license: 'CEM-2024-VIL-001',
    director: 'Vytas Petrauskas',
    employees: 45,
    totalPlots: 45000,
    activePlots: 38000,
  },

  address: {
    street: 'Kapinių g. 1',
    city: 'Vilnius',
    postalCode: '01140',
    country: 'Lithuania',
  },

  contact: {
    email: 'info@vilniuscemetery.lt',
    phone: '+370 5 210 6000',
    emergency: '+370 699 00600',
    website: 'https://vilniuscemetery.lt',
    hours: {
      summer: '08:00 - 20:00',
      winter: '08:00 - 17:00',
      office: '09:00 - 17:00',
    },
  },

  bitrix24: {
    portalDomain: 'vilnius-cemetery.bitrix24.eu',
    crmScope: 'cemetery',
    contactPrefix: 'cemetery_vilnius_',
    dealCategories: {
      plotSales: 'plot_sales',
      services: 'cemetery_services',
      maintenance: 'maintenance_contracts',
      monuments: 'monument_sales',
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
    deceasedDataHandling: {
      enabled: true,
      retentionPeriod: 'permanent',
      accessControls: 'strict',
      familyConsent: 'required',
      publicAccess: 'limited',
    },
    longTermContractManagement: {
      enabled: true,
      perpetualCare: true,
      renewalCycles: [10, 20, 50],
      priceProtection: true,
    },
    audit: {
      enabled: true,
      logLevel: 'detailed',
      retention: 10,
      tamperEvident: true,
    },
    dataRetention: {
      plotRecords: 'permanent',
      deceasedRecords: 'permanent',
      maintenanceContracts: 50,
      paymentRecords: 10,
    },
  },

  website: {
    domain: 'vilniuscemetery.lt',
    sslEnabled: true,
    defaultLanguage: 'lt',
    supportedLanguages: ['lt', 'en', 'ru', 'pl'],
    theme: 'cemetery-serene',
  },

  // Service Catalog
  services: [
    {
      id: 'svc-burial',
      name: 'Laidojimo paslauga',
      nameEn: 'Burial Service',
      description: 'Pilna laidojimo paslauga su kapo paruošimu',
      price: 500,
      category: 'burial',
    },
    {
      id: 'svc-cremation-plot',
      name: 'Kremavimo kapas',
      nameEn: 'Cremation Plot',
      description: 'Kapas kremuotiems palaikams',
      price: 300,
      category: 'cremation',
    },
    {
      id: 'svc-exhumation',
      name: 'Ekshumacija',
      nameEn: 'Exhumation',
      description: 'Palaikų ekshumavimo paslauga',
      price: 800,
      category: 'burial',
    },
    {
      id: 'svc-memorial-install',
      name: 'Paminklo įrengimas',
      nameEn: 'Memorial Installation',
      description: 'Paminklo montavimas ir įrengimas',
      price: 200,
      category: 'memorial',
    },
    {
      id: 'svc-grave-digging',
      name: 'Kapo kasimas',
      nameEn: 'Grave Digging',
      description: 'Kapo paruošimas laidojimui',
      price: 250,
      category: 'burial',
    },
    {
      id: 'svc-restoration',
      name: 'Kapo restauravimas',
      nameEn: 'Grave Restoration',
      description: 'Senų kapų atnaujinimo darbai',
      price: 400,
      category: 'maintenance',
    },
  ] as CemeteryService[],

  // Cemetery Sections
  sections: [
    { id: 'sec-a', name: 'A sekcija', type: 'historic', yearEstablished: 1900 },
    { id: 'sec-b', name: 'B sekcija', type: 'orthodox', yearEstablished: 1920 },
    { id: 'sec-c', name: 'C sekcija', type: 'catholic', yearEstablished: 1950 },
    { id: 'sec-d', name: 'D sekcija', type: 'new', yearEstablished: 1990 },
    { id: 'sec-e', name: 'E sekcija', type: 'cremation', yearEstablished: 2010 },
  ],

  // Sample Grave Plots
  gravePlots: [
    {
      id: 'plot-a1-1',
      section: 'A',
      row: 1,
      plot: 1,
      type: 'single',
      status: 'occupied',
      coordinates: { lat: 54.6872, lng: 25.2797 },
      owner: 'Petraitis Family',
      deceased: [
        { id: 'dec-1', firstName: 'Jonas', lastName: 'Petraitis', birthDate: '1940-05-10', deathDate: '2020-03-15' },
      ],
    },
    {
      id: 'plot-a1-2',
      section: 'A',
      row: 1,
      plot: 2,
      type: 'double',
      status: 'occupied',
      coordinates: { lat: 54.6873, lng: 25.2798 },
      owner: 'Kazlauskas Family',
      deceased: [
        { id: 'dec-2', firstName: 'Marija', lastName: 'Kazlauskienė', birthDate: '1945-07-22', deathDate: '2018-12-01' },
        { id: 'dec-3', firstName: 'Antanas', lastName: 'Kazlauskas', birthDate: '1942-03-05', deathDate: '2022-06-20' },
      ],
    },
    {
      id: 'plot-d5-10',
      section: 'D',
      row: 5,
      plot: 10,
      type: 'family',
      status: 'available',
      coordinates: { lat: 54.6885, lng: 25.2810 },
    },
  ] as GravePlot[],

  // Monument Catalog
  monuments: [
    {
      id: 'mon-1',
      name: 'Klasikinis granitinis paminklas',
      material: 'granite',
      style: 'classic',
      dimensions: { height: 120, width: 60 },
      price: 1500,
      customizationAvailable: true,
    },
    {
      id: 'mon-2',
      name: 'Stačiatikių kryžius',
      material: 'stone',
      style: 'orthodox',
      dimensions: { height: 150, width: 40 },
      price: 1200,
      customizationAvailable: true,
    },
    {
      id: 'mon-3',
      name: 'Modernus marmuro paminklas',
      material: 'marble',
      style: 'modern',
      dimensions: { height: 100, width: 80 },
      price: 2500,
      customizationAvailable: true,
    },
    {
      id: 'mon-4',
      name: 'Bronzinė skulptūra',
      material: 'bronze',
      style: 'modern',
      dimensions: { height: 80, width: 50 },
      price: 5000,
      customizationAvailable: true,
    },
    {
      id: 'mon-5',
      name: 'Krikščioniškas kryžius',
      material: 'granite',
      style: 'cross',
      dimensions: { height: 180, width: 60 },
      price: 800,
      customizationAvailable: true,
    },
  ] as Monument[],

  // Maintenance Plans
  maintenancePlans: [
    {
      id: 'plan-basic',
      name: 'Pagrindinė priežiūra',
      nameEn: 'Basic Maintenance',
      frequency: 'quarterly',
      services: [
        'Žolės pjovimas',
        'Lapų šalinimas',
        'Paminklo valymas',
      ],
      pricePerVisit: 25,
      annualPrice: 100,
    },
    {
      id: 'plan-standard',
      name: 'Standartinė priežiūra',
      nameEn: 'Standard Maintenance',
      frequency: 'monthly',
      services: [
        'Žolės pjovimas',
        'Lapų šalinimas',
        'Paminklo valymas',
        'Gėlių priežiūra',
        'Žvakės uždegimas',
      ],
      pricePerVisit: 35,
      annualPrice: 420,
    },
    {
      id: 'plan-premium',
      name: 'Premium priežiūra',
      nameEn: 'Premium Maintenance',
      frequency: 'weekly',
      services: [
        'Pilna kapo priežiūra',
        'Gėlių sodinimas sezoninis',
        'Paminklo priežiūra',
        'Vakariniai žiburiai',
        'Skaitmeninė prieiga',
      ],
      pricePerVisit: 50,
      annualPrice: 2600,
    },
  ] as MaintenancePlan[],

  // Flower Delivery Options
  flowerDeliveries: [
    {
      id: 'flower-1',
      name: 'Klasikinis vainikas',
      flowers: ['rožės', 'chrizantemos', 'bugieniai'],
      price: 80,
      seasonal: false,
    },
    {
      id: 'flower-2',
      name: 'Gėlių puokštė',
      flowers: ['lelijos', 'gvazdikai', 'ežiuolės'],
      price: 35,
      seasonal: false,
    },
    {
      id: 'flower-3',
      name: 'Sezoninis vainikas',
      flowers: ['tulpės', 'nakvišos'],
      price: 60,
      seasonal: true,
    },
    {
      id: 'flower-4',
      name: 'Vėjinė žvakė su gėlėmis',
      flowers: ['levandos', 'mirtos'],
      price: 25,
      seasonal: false,
    },
  ] as FlowerDelivery[],

  statistics: {
    totalInterments: 120000,
    activeMaintenanceContracts: 8500,
    monumentsInstalled: 35000,
    annualVisitors: 150000,
  },
} as const;

export type EntityConfig = typeof entityConfig;
