/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jol-hub/ui', '@jol-hub/auth'],
  images: {
    domains: ['localhost', 'cdn.jol-hub.eu'],
  },
  i18n: {
    locales: ['lt', 'ru', 'en'],
    defaultLocale: 'lt',
  },
};

module.exports = nextConfig;
