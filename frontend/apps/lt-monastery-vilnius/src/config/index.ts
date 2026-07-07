export { entityConfig, type EntityConfig } from './entity';
export type { MassTime, SacramentInfo, MonkInfo } from './entity';

import { entityConfig } from './entity';

// Compliance Configuration for Monastery Level
export const complianceConfig = {
  level: 'monastery' as const,
  
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
      'vital_interests',
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
      oblationRecords: 'permanent',
      sacramentalRecords: 'permanent',
      guestRecords: 7,
      financialRecords: 7,
      consentRecords: 7,
    },
  },

  sacramentalRecords: {
    protection: true,
    canonicalRequirement: 'CIC 535',
    access: ['abbot', 'prior'],
    retention: 'permanent',
    encryption: true,
    backupFrequency: 'daily',
  },

  monasticRecords: {
    oblationRecords: {
      retention: 'permanent',
      canonicalStatus: true,
      access: ['abbot', 'oblation_director'],
    },
    professionRecords: {
      retention: 'permanent',
      vaticanNotification: true,
    },
  },

  consent: {
    required: true,
    defaultLanguage: 'lt',
    versioning: true,
    auditLog: true,
    types: {
      newsletter: { required: false, defaultOptIn: false },
      donations: { required: false, defaultOptIn: false },
      retreatRegistration: { required: true, defaultOptIn: false },
      guestHouse: { required: true, defaultOptIn: false },
      oblationProgram: { required: true, defaultOptIn: false },
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
      'data_modification',
      'consent_change',
      'oblation_record_access',
      'guest_registration',
      'donation_processing',
    ],
  },

  dataProcessing: {
    legitimateInterests: [
      'monastic_community',
      'spiritual_services',
      'hospitality_ministry',
      'contemplative_prayer',
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
    mfaRequired: ['abbot', 'prior', 'admin'],
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

// Navigation Configuration for Monastery
export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/schedule', label: { lt: 'Tvarkaraštis', en: 'Schedule' } },
    { href: '/retreats', label: { lt: 'Rekolekcijos', en: 'Retreats' } },
    { href: '/guest-house', label: { lt: 'Svečių namai', en: 'Guest House' } },
    { href: '/oblation', label: { lt: 'Oblacija', en: 'Oblation' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],

  footerNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/schedule', label: { lt: 'Tvarkaraštis', en: 'Schedule' } },
    { href: '/retreats', label: { lt: 'Rekolekcijos', en: 'Retreats' } },
    { href: '/privacy', label: { lt: 'Privatumas', en: 'Privacy' } },
  ],

  quickLinks: [
    { href: '#mass-schedule', label: { lt: 'Mišių laikas', en: 'Mass Times' } },
    { href: '#contact', label: { lt: 'Kontaktai', en: 'Contact' } },
    { href: '#donate', label: { lt: 'Aukoti', en: 'Donate' } },
  ],

  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/vilniusmonastery' },
  ],
};

export type ComplianceConfig = typeof complianceConfig;
export type NavigationConfig = typeof navigationConfig;
