/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/seed-data', '@jol-hub/tenant-resolver'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
