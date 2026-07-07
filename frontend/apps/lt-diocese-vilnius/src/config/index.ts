export { entityConfig } from './entity';
export type { EntityConfig, ParishInfo, DeaneryInfo, PriestInfo } from './entity';

export const complianceConfig = {
  level: 'diocesan',
  canonicalRecords: true,
  diocesanGovernance: true,
  vaticanReporting: true,
  
  rbac: {
    tiers: 4,
    levels: ['diocese', 'deanery', 'parish', 'parishioner'],
    permissions: {
      diocese: {
        read: ['all'],
        write: ['all'],
        admin: ['all'],
      },
      deanery: {
        read: ['own_deanery'],
        write: ['own_deanery'],
        admin: [],
      },
      parish: {
        read: ['own_parish'],
        write: ['own_parish'],
        admin: [],
      },
      parishioner: {
        read: ['own_data'],
        write: ['own_data'],
        admin: [],
      },
    },
  },
  
  audit: {
    enabled: true,
    logLevel: 'comprehensive',
    tamperEvident: true,
    retention: 7,
    vaticanReportSchedule: 'annual',
    reportTypes: [
      'Annuario Pontificio',
      'Statistical Yearbook',
      'Sacramental Records Summary',
      'Priest Assignment Changes',
    ],
  },
  
  gdpr: {
    dataController: 'Vilniaus arkivyskupija',
    dataControllerEn: 'Vilnius Archdiocese',
    dataProtectionOfficer: 'dpo@vilniusarkivyskupija.lt',
    retentionPeriod: {
      sacramentalRecords: 'permanent',
      parishionerData: 10,
      priestRecords: 'permanent',
      financialRecords: 7,
    },
  },
  
  canonical: {
    canonLaw: 'CIC 1983',
    diocesanStatutes: 'Vilniaus arkivyskupijos statute',
    bishopAuthority: 'Vilniaus arkivyskupas metropolitas',
  },
};

export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pagrindinis', en: 'Home' } },
    { href: '/directory', label: { lt: 'Parapijų sąrašas', en: 'Parish Directory' } },
    { href: '/news', label: { lt: 'Naujienos', en: 'News' } },
    { href: '/vocations', label: { lt: 'Pašaukimai', en: 'Vocations' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop' } },
  ],
  adminNav: [
    { href: '/admin/priests', label: { lt: 'Kunigai', en: 'Priests' } },
    { href: '/admin/parishes', label: { lt: 'Parapijos', en: 'Parishes' } },
    { href: '/admin/reports', label: { lt: 'Ataskaitos', en: 'Reports' } },
  ],
};
