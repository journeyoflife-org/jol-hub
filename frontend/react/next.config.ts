import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The Django API origin — overridden per environment via NEXT_PUBLIC_API_URL
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.journeyoflife.org',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Strict mode highlights potential issues in development
  reactStrictMode: true,

  // Output standalone bundle for Docker deployments
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
}

export default nextConfig
