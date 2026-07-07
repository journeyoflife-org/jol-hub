export { entityConfig, type EntityConfig } from './entity';
export type { OrthodoxFeast, IconInfo, ClergyMember, OrthodoxService } from './entity';

import { entityConfig } from './entity';

// Compliance Configuration for Orthodox Church
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
      parishionerData: 10,
      sacramentalRecords: 'permanent',
      financialRecords: 7,
      patriarchateReports: 'permanent',
    },
  },

  patriarchateRequirements: {
    enabled: true,
    authority: entityConfig.ecclesiastical.patriarchate,
    diocese: entityConfig.ecclesiastical.diocese,
    reporting: {
      frequency: entityConfig.compliance.patriarchateRequirements.reportingFrequency,
      recipient: entityConfig.compliance.patriarchateRequirements.reportingTo,
      dataSharing: entityConfig.compliance.patriarchateRequirements.dataSharing,
    },
    canonicalLaw: {
      baptismalRecords: 'Permanent, stored in metrical books',
      marriageRecords: 'Permanent, stored in metrical books',
      patriarchateOversight: true,
    },
  },

  audit: {
    enabled: true,
    logLevel: 'standard',
    retention: 7,
    events: [
      'sacrament_record',
      'patriarchate_report',
      'candle_order',
      'donation',
      'data_access',
      'consent_change',
    ],
  },

  consent: {
    required: true,
    defaultLanguage: 'lt',
    versioning: true,
    types: {
      newsletter: { required: false, defaultOptIn: false },
      patriarchateDataSharing: { required: false, defaultOptIn: false },
    },
  },

  securityMeasures: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    accessControl: 'role_based',
    mfaRequired: ['bishop', 'admin', 'treasurer'],
    sessionTimeout: 30,
  },
};

// Navigation Configuration
export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home', ru: 'Главная' } },
    { href: '/gallery', label: { lt: 'Ikonos', en: 'Icons', ru: 'Иконы' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop', ru: 'Магазин' } },
  ],

  footerNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home', ru: 'Главная' } },
    { href: '/gallery', label: { lt: 'Ikonos', en: 'Icons', ru: 'Иконы' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop', ru: 'Магазин' } },
  ],

  quickLinks: [
    { href: '#services', label: { lt: 'Tarnybos', en: 'Services', ru: 'Службы' } },
    { href: '#calendar', label: { lt: 'Kalendorius', en: 'Calendar', ru: 'Календарь' } },
    { href: '#contact', label: { lt: 'Kontaktai', en: 'Contact', ru: 'Контакты' } },
  ],
};

export type ComplianceConfig = typeof complianceConfig;
export type NavigationConfig = typeof navigationConfig;
