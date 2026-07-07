/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/auth', '@jol-hub/bitrix-sdk'],
  images: {
    domains: ['localhost', 'kaunoarkikatedra.lt', 'kauno-arkivyskupija.lt'],
  },
  env: {
    NEXT_PUBLIC_ENTITY_ID: 'lt-catholic-cathedral-001',
    NEXT_PUBLIC_ORG_TYPE: 'cathedral',
    NEXT_PUBLIC_COUNTRY: 'lt',
    NEXT_PUBLIC_BITRIX24_PORTAL: 'kauno-arkivyskupija.bitrix24.eu',
  },
};

module.exports = nextConfig;
