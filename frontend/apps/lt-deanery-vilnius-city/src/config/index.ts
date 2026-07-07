export { entityConfig } from './entity';
export type { EntityConfig, ParishInDeanery, DeanInfo } from './entity';

export const complianceConfig = {
  level: 'deanery',
  canonicalRecords: true,
  aggregatedPII: true,
  
  reporting: {
    frequency: 'quarterly',
    recipients: ['diocese', 'dean'],
    reportTypes: [
      'Parishioner Statistics',
      'Consent Tracking',
      'Financial Summary',
    ],
  },
  
  audit: {
    enabled: true,
    logLevel: 'standard',
    tamperEvident: true,
    retention: 7,
  },
  
  gdpr: {
    dataController: 'Vilniaus arkivyskupija',
    dataControllerEn: 'Vilnius Archdiocese',
    aggregatedDataHandling: true,
    retentionPeriod: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
      financialRecords: 7,
    },
  },
};

export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pagrindinis', en: 'Home' } },
    { href: '/directory', label: { lt: 'Parapijos', en: 'Parishes' } },
    { href: '/events', label: { lt: 'Renginiai', en: 'Events' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],
};
