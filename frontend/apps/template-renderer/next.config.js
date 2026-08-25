/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@jol-hub/ui',
    '@jol-hub/i18n',
    '@jol-hub/seed-data',
    '@jol-hub/tenant-resolver',
    '@jol-hub/commerce',
    '@jol-hub/bitrix-sdk',
    '@jol-hub/auth',
    '@jol-hub/seo',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
