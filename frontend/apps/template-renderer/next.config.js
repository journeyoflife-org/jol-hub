/** @type {import('next').NextConfig} */
let nextConfig = {
  reactStrictMode: true,
  // STEP 17 (Wave 0): self-contained production output for Docker/PM2 on
  // the Proxmox fleet — .next/standalone ships with a minimal server.js.
  output: 'standalone',
  transpilePackages: [
    '@jol-hub/ui',
    '@jol-hub/i18n',
    '@jol-hub/seed-data',
    '@jol-hub/tenant-resolver',
    '@jol-hub/commerce',
    '@jol-hub/bitrix-sdk',
    '@jol-hub/auth',
    '@jol-hub/seo',
    '@jol-hub/observability',
    '@jol-hub/a11y',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },

  // STEP 13 — performance (modest on-prem hardware; see PERFORMANCE.md):
  // gzip at the Next layer is the FALLBACK; nginx does brotli/gzip in front.
  compress: true,
  // Fingerprint header off (no tech disclosure, smaller responses).
  poweredByHeader: false,

  images: {
    // Modern formats first (AVIF ~30% smaller than WebP); both fall back to
    // the original for legacy agents. Tenant uploads are optimized by the
    // backend at ingest; next/image handles responsive srcset + lazy load.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days — immutable hashed URLs
  },

  experimental: {
    // Tree-shake barrel imports — keeps the shared chunk lean on modest
    // hardware. Without this, `import { formatEur } from '@jol-hub/commerce'`
    // drags the Stripe browser SDK and `import { Card } from '@jol-hub/ui'`
    // drags the ENTIRE ui surface (compliance pages, donation widgets, zod)
    // into every route's first-load JS (verified via `pnpm analyze`).
    optimizePackageImports: ['lucide-react', '@jol-hub/ui', '@jol-hub/commerce'],
  },

  async headers() {
    return [
      {
        // Hashed static assets are immutable — safe to cache aggressively
        // at browser AND nginx/proxy layers (no CDN in the pilot).
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Optimized images: long cache, revalidate weekly at the proxy.
        source: '/_next/image/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      {
        // SEO surfaces: short cache with SWR so crawlers see freshness
        // without hammering the R640.
        source: '/sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=600, stale-while-revalidate=3600' }],
      },
      {
        source: '/robots.txt',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },
};

// STEP 13 — bundle analysis: `pnpm analyze` (ANALYZE=true) renders the
// client/server composition view used to bisect budget-gate failures
// (see PERFORMANCE.md). Off by default — zero build overhead.
if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
  nextConfig = withBundleAnalyzer(nextConfig);
}

module.exports = nextConfig;
