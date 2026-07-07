/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/auth', '@jol-hub/bitrix-sdk'],
  images: {
    domains: ['localhost', 'api.jol-hub.local'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.bitrix24.eu',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ENTITY_ID: 'lt-greek-catholic-vilnius-001',
    NEXT_PUBLIC_ENTITY_TYPE: 'church_other',
    NEXT_PUBLIC_COUNTRY: 'lt',
  },
};

module.exports = nextConfig;
