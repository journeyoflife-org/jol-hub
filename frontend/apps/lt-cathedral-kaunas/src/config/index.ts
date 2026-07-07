export { entityConfig } from './entity';
export type { EntityConfig } from './entity';

export const complianceConfig = {
  level: 'canonical',
  canonicalRecords: true,
  diocesanGovernance: true,
  gdpr: {
    dataController: 'Kauno arkivyskupija',
    dataControllerEn: 'Kaunas Archdiocese',
    dataProtectionOfficer: 'dpo@kauno-arkivyskupija.lt',
    retentionPeriod: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
      donationRecords: 7,
      eventRegistrations: 3,
    },
  },
  canonical: {
    canonLaw: 'CIC 1983',
    diocesanStatutes: 'Kauno arkivyskupijos statute',
    bishopAuthority: 'Kauno arkivyskupas metropolitas',
  },
  audit: {
    enabled: true,
    logLevel: 'comprehensive',
    tamperEvident: true,
    retention: 7,
  },
};

export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pagrindinis', en: 'Home' } },
    { href: '/events', label: { lt: 'Renginiai', en: 'Events' } },
    { href: '/bishops-messages', label: { lt: 'Vyskupo laiškai', en: "Bishop's Messages" } },
    { href: '/heritage', label: { lt: 'Paveldas', en: 'Heritage' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
    { href: '/donate', label: { lt: 'Aukos', en: 'Donate' } },
  ],
};
