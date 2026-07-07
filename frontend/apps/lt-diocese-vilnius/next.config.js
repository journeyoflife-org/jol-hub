/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/auth', '@jol-hub/bitrix-sdk'],
  images: {
    domains: ['localhost', 'vilkaviskio-vyskupija.lt', 'vilniusarkivyskupija.lt'],
  },
  env: {
    NEXT_PUBLIC_ENTITY_ID: 'lt-diocese-vilnius-001',
    NEXT_PUBLIC_ORG_TYPE: 'diocese',
    NEXT_PUBLIC_COUNTRY: 'lt',
    NEXT_PUBLIC_BITRIX24_PORTAL: 'vilnius-arkivyskupija.bitrix24.eu',
  },
};

module.exports = nextConfig;
