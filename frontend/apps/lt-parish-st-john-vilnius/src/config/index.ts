export { entityConfig, type EntityConfig } from './entity';
export type { MassTime, SacramentInfo, StaffMember, HallInfo } from './entity';

import { entityConfig } from './entity';

// Compliance Configuration for Parish Level
export const complianceConfig = {
  level: 'parish' as const,
  
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
      parishionerData: 10, // years after last activity
      sacramentalRecords: 'permanent', // Canon Law requirement
      financialRecords: 7, // years for tax purposes
      consentRecords: 7,
    },
  },

  sacramentalRecords: {
    protection: true,
    canonicalRequirement: 'CIC 535',
    access: ['pastor', 'delegates'],
    retention: 'permanent',
    encryption: true,
    backupFrequency: 'daily',
  },

  consent: {
    required: true,
    defaultLanguage: 'lt',
    versioning: true,
    auditLog: true,
    types: {
      newsletter: { required: false, defaultOptIn: false },
      donations: { required: false, defaultOptIn: false },
      parishDirectory: { required: false, defaultOptIn: false },
      volunteer: { required: false, defaultOptIn: false },
    },
  },

  audit: {
    enabled: true,
    logLevel: 'standard',
    tamperEvident: true,
    retention: 7, // years
    events: [
      'login',
      'logout',
      'data_access',
      'data_modification',
      'consent_change',
      'export_request',
      'deletion_request',
      'sacramental_record_access',
    ],
  },

  dataProcessing: {
    legitimateInterests: [
      'parish_administration',
      'religious_services',
      'community_building',
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
    mfaRequired: ['pastor', 'admin'],
    sessionTimeout: 30, // minutes
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecial: true,
    },
  },
};

// Navigation Configuration
export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/sacraments', label: { lt: 'Sakramentai', en: 'Sacraments' } },
    { href: '/news', label: { lt: 'Naujienos', en: 'News' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],

  footerNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/sacraments', label: { lt: 'Sakramentai', en: 'Sacraments' } },
    { href: '/news', label: { lt: 'Naujienos', en: 'News' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],

  quickLinks: [
    { href: '#mass-schedule', label: { lt: 'Mišių laikas', en: 'Mass Times' } },
    { href: '#contact', label: { lt: 'Kontaktai', en: 'Contact' } },
    { href: '#donate', label: { lt: 'Aukoti', en: 'Donate' } },
  ],

  socialLinks: [
    { platform: 'facebook', url: 'https://facebook.com/svjonai' },
  ],
};

export type ComplianceConfig = typeof complianceConfig;
export type NavigationConfig = typeof navigationConfig;
