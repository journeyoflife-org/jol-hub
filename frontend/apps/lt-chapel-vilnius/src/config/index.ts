export { entityConfig, type EntityConfig } from './entity';
export type { MassTime, SacramentInfo } from './entity';

import { entityConfig } from './entity';

// Compliance Configuration for Chapel/Shrine Level
export const complianceConfig = {
  level: 'chapel' as const,
  
  gdpr: {
    enabled: true,
    dataController: {
      name: entityConfig.name.lt,
      contact: entityConfig.contact.email,
      address: `${entityConfig.address.street}, ${entityConfig.address.postalCode} ${entityConfig.address.city}`,
    },
    lawfulBasis: [
      'consent',
      'contract',
      'legal_obligation',
      'public_task',
    ],
    dataSubjectRights: [
      'access',
      'rectification',
      'erasure',
      'restriction',
      'portability',
      'objection',
    ],
    retentionPeriods: {
      visitorRecords: 3,
      donationRecords: 7,
      candleSalesRecords: 3,
    },
  },

  shrineSpecific: {
    pilgrimageData: true,
    annualPilgrimTracking: true,
    internationalVisitors: true,
    multiLanguageSupport: ['lt', 'en', 'pl', 'ru'],
  },

  consent: {
    required: true,
    defaultLanguage: 'lt',
    versioning: true,
    auditLog: true,
    types: {
      newsletter: { required: false, defaultOptIn: false },
      donations: { required: false, defaultOptIn: false },
      pilgrimageRegistration: { required: true, defaultOptIn: false },
      candleIntentions: { required: false, defaultOptIn: false },
    },
  },

  audit: {
    enabled: true,
    logLevel: 'standard',
    tamperEvident: true,
    retention: 7,
    events: [
      'login',
      'logout',
      'data_access',
      'donation_processing',
      'candle_sale',
      'pilgrimage_registration',
      'mass_intention',
    ],
  },

  dataProcessing: {
    legitimateInterests: [
      'shrine_administration',
      'pilgrimage_services',
      'religious_services',
      'charitable_activities',
    ],
    thirdPartySharing: [
      {
        party: 'Bitrix24',
        purpose: 'CRM_services',
        location: 'EU',
        safeguards: 'SCCs',
      },
    ],
    crossBorderTransfers: [],
  },

  securityMeasures: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    accessControl: 'role_based',
    mfaRequired: ['chaplain', 'admin'],
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: true,
    },
  },
};

// Navigation Configuration for Chapel
export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/schedule', label: { lt: 'Tvarkaraštis', en: 'Schedule' } },
    { href: '/pilgrimage', label: { lt: 'Piligrimystė', en: 'Pilgrimage' } },
    { href: '/candles', label: { lt: 'Žvakės', en: 'Candles' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],

  footerNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/schedule', label: { lt: 'Tvarkaraštis', en: 'Schedule' } },
    { href: '/pilgrimage', label: { lt: 'Piligrimystė', en: 'Pilgrimage' } },
    { href: '/privacy', label: { lt: 'Privatumas', en: 'Privacy' } },
  ],

  quickLinks: [
    { href: '#mass-schedule', label: { lt: 'Mišių laikas', en: 'Mass Times' } },
    { href: '#confession', label: { lt: 'Išpažintis', en: 'Confession' } },
    { href: '#candles', label: { lt: 'Žvakės', en: 'Candles' } },
    { href: '#donate', label: { lt: 'Aukoti', en: 'Donate' } },
  ],

  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/ausrosvartai' },
  ],
};

export type ComplianceConfig = typeof complianceConfig;
export type NavigationConfig = typeof navigationConfig;
