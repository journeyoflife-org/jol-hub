/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/auth', '@jol-hub/bitrix-sdk'],
  images: {
    domains: ['localhost', 'vilniusdekanatas.lt'],
  },
  env: {
    NEXT_PUBLIC_ENTITY_ID: 'lt-deanery-vilnius-city-001',
    NEXT_PUBLIC_ORG_TYPE: 'deanery',
    NEXT_PUBLIC_COUNTRY: 'lt',
    NEXT_PUBLIC_BITRIX24_PORTAL: 'vilnius-arkivyskupija.bitrix24.eu',
  },
};

module.exports = nextConfig;
