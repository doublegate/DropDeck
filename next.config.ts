import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    remotePatterns: [
      { hostname: '*.instacart.com' },
      { hostname: '*.doordash.com' },
      { hostname: '*.ubereats.com' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'lh3.googleusercontent.com' },
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
    },
  ],
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Organization and project in Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'dropdeck',

  // Suppress logs during build
  silent: !process.env.CI,

  // Upload source maps for better error tracking
  widenClientFileUpload: true,

  // Client source maps are emitted hidden and deleted after upload by default
  // (SDK 9+), so the former hideSourceMaps option no longer exists.

  // Automatically annotate React components (webpack and Turbopack)
  reactComponentAnnotation: {
    enabled: true,
  },

  // Tunnel browser events through the app to avoid ad-blockers. The path is
  // excluded from the auth middleware matcher in src/middleware.ts.
  tunnelRoute: '/monitoring',

  webpack: {
    // Strip Sentry SDK debug logging from the bundle
    treeshake: {
      removeDebugLogging: true,
    },

    // Disable Vercel Cron instrumentation
    automaticVercelMonitors: false,
  },
};

// Only wrap with Sentry if DSN is configured
const config = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
