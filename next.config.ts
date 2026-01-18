import { withSentryConfig } from '@sentry/nextjs';
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

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Disable Sentry SDK logger
  disableLogger: true,

  // Automatically annotate React components
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route handlers and middleware instrumentation
  tunnelRoute: '/monitoring',

  // Disable Vercel Cron instrumentation
  automaticVercelMonitors: false,
};

// Only wrap with Sentry if DSN is configured
const config = process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;

export default config;
