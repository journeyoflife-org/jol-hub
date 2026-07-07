/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/i18n', '@jol-hub/auth', '@jol-hub/bitrix-sdk'],
};

module.exports = nextConfig;
