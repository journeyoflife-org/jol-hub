export { entityConfig, type EntityConfig } from './entity';
export type { ServiceTime, LeadershipRole, GovernanceStructure } from './entity';

import { entityConfig } from './entity';

// Compliance Configuration for Lutheran Church
export const complianceConfig = {
  level: 'congregation' as const,

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
      memberData: 10,
      financialRecords: 7,
      historicalRecords: 'permanent',
    },
  },

  churchGovernance: {
    type: 'lutheran',
    authority: entityConfig.governance.synodAffiliation.name,
    constitution: true,
    councilOversight: true,
    principles: [
      'Sola Scriptura',
      'Sola Gratia',
      'Sola Fide',
      'Solus Christus',
      'Soli Deo Gloria',
    ],
    confession: 'Augsburg Confession',
  },

  audit: {
    enabled: true,
    logLevel: 'standard',
    retention: 7,
    events: [
      'member_registration',
      'donation',
      'event_participation',
      'consent_change',
      'data_access',
      'data_export',
    ],
  },

  consent: {
    required: true,
    defaultLanguage: 'lt',
    versioning: true,
    types: {
      newsletter: { required: false, defaultOptIn: false },
      volunteer: { required: false, defaultOptIn: false },
      photos: { required: false, defaultOptIn: false },
    },
  },

  securityMeasures: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    accessControl: 'role_based',
    mfaRequired: ['pastor', 'admin', 'treasurer'],
    sessionTimeout: 30,
  },
};

// Navigation Configuration
export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/events', label: { lt: 'Renginiai', en: 'Events' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],

  footerNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home' } },
    { href: '/events', label: { lt: 'Renginiai', en: 'Events' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],

  quickLinks: [
    { href: '#services', label: { lt: 'Pamaldos', en: 'Services' } },
    { href: '#contact', label: { lt: 'Kontaktai', en: 'Contact' } },
    { href: '#donate', label: { lt: 'Paaukoti', en: 'Donate' } },
  ],
};

export type ComplianceConfig = typeof complianceConfig;
export type NavigationConfig = typeof navigationConfig;
