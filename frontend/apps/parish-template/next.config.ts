import type { NextConfig } from 'next';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' https://api.bitrix24.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.bitrix24.com https://*.bitrix24.com",
  "frame-ancestors 'self' https://*.bitrix24.com",
  "frame-src 'self' https://*.bitrix24.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: cspDirectives,
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Multi-tenant configuration for parish subdomains
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // Dynamic OG images for each parish
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.bitrix24.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
    unoptimized: false,
  },

  // Enable static optimization where possible
  output: 'standalone',

  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
