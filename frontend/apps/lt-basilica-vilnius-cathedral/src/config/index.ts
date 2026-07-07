export { entityConfig } from './entity';
export type { EntityConfig } from './entity';

export const complianceConfig = {
  level: 'canonical',
  canonicalRecords: true,
  diocesanGovernance: true,
  gdpr: {
    dataController: 'Vilniaus arkivyskupija',
    dataControllerEn: 'Vilnius Archdiocese',
    dataProtectionOfficer: 'dpo@vilnius-arkivyskupija.lt',
    retentionPeriod: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
      donationRecords: 7,
      eventRegistrations: 3,
    },
  },
  canonical: {
    canonLaw: 'CIC 1983',
    diocesanStatutes: 'Vilniaus arkivyskupijos statute',
    bishopAuthority: 'Vilniaus arkivyskupas metropolitas',
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
    { href: '/mass-schedule', label: { lt: 'Mišių tvarkaraštis', en: 'Mass Schedule' } },
    { href: '/sacraments', label: { lt: 'Sakramentai', en: 'Sacraments' } },
    { href: '/heritage', label: { lt: 'Paveldas', en: 'Heritage' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
    { href: '/donate', label: { lt: 'Aukos', en: 'Donate' } },
  ],
  footerNav: [
    { href: '/privacy', label: { lt: 'Privatumo politika', en: 'Privacy Policy' } },
    { href: '/consent', label: { lt: 'Sutikimas', en: 'Consent' } },
    { href: '/dsr', label: { lt: 'Duomenų teisės', en: 'Data Rights' } },
    { href: '/cookies', label: { lt: 'Slapukai', en: 'Cookies' } },
  ],
};
