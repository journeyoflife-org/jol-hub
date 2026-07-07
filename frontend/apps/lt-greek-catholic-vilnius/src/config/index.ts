/**
 * Navigation and shared configuration for Vilnius Greek Catholic Church
 */

import { entityConfig } from './entity';

export const navigationConfig = {
  mainNav: [
    { href: '/', label: { lt: 'Pradžia', en: 'Home', uk: 'Головна' } },
    { href: '/schedule', label: { lt: 'Tvarkaraštis', en: 'Schedule', uk: 'Розклад' } },
    { href: '/sacraments', label: { lt: 'Sakramentai', en: 'Sacraments', uk: 'Тайнини' } },
    { href: '/gallery', label: { lt: 'Ikonos', en: 'Icons', uk: 'Ікони' } },
    { href: '/shop', label: { lt: 'Parduotuvė', en: 'Shop', uk: 'Магазин' } },
    { href: '/contact', label: { lt: 'Kontaktai', en: 'Contact', uk: 'Контакти' } },
  ],
  footerNav: [
    { href: '/privacy', label: { lt: 'Privatumas', en: 'Privacy', uk: 'Приватність' } },
    { href: '/consent', label: { lt: 'Sutikimas', en: 'Consent', uk: 'Згода' } },
    { href: '/dsr', label: { lt: 'Duomenų teisės', en: 'Data Rights', uk: 'Права на дані' } },
  ],
  languages: entityConfig.website.supportedLanguages,
};

export const defaultLanguage = entityConfig.website.defaultLanguage;

export type NavigationConfig = typeof navigationConfig;
