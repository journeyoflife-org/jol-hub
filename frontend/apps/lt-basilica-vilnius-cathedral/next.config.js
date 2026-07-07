/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/auth', '@jol-hub/bitrix-sdk'],
  images: {
    domains: ['localhost', 'katedra.lt', 'vilnius.archyvai.lt'],
  },
  env: {
    NEXT_PUBLIC_ENTITY_ID: 'lt-catholic-basilica-001',
    NEXT_PUBLIC_ORG_TYPE: 'basilica',
    NEXT_PUBLIC_COUNTRY: 'lt',
    NEXT_PUBLIC_BITRIX24_PORTAL: 'vilniaus-arkivyskupija.bitrix24.eu',
  },
};

module.exports = nextConfig;
