/**
 * Sentry server-side configuration
 * This file configures Sentry for Node.js server environments
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling for performance insights
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    // Filter out noisy errors
    ignoreErrors: [
      // Expected errors
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',

      // Rate limiting is expected behavior
      'TooManyRequests',
      'Rate limit exceeded',
    ],

    // Scrub sensitive data before sending
    beforeSend(event) {
      // Scrub request headers
      if (event.request?.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token', 'x-api-key'];
        for (const header of sensitiveHeaders) {
          delete event.request.headers[header];
        }
      }

      // Scrub request data
      if (event.request?.data && typeof event.request.data === 'object') {
        const data = event.request.data as Record<string, unknown>;
        const sensitiveFields = [
          'password',
          'token',
          'secret',
          'apiKey',
          'accessToken',
          'refreshToken',
        ];
        for (const field of sensitiveFields) {
          if (field in data) {
            data[field] = '[REDACTED]';
          }
        }
      }

      // Scrub environment variables from extra context
      if (event.extra) {
        const extra = event.extra as Record<string, unknown>;
        for (const key of Object.keys(extra)) {
          if (
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('password') ||
            key.toLowerCase().includes('key')
          ) {
            extra[key] = '[REDACTED]';
          }
        }
      }

      return event;
    },

    // Tag transactions for better filtering
    beforeSendTransaction(event) {
      // Add custom tags
      if (event.transaction) {
        // Tag API routes
        if (event.transaction.startsWith('/api/')) {
          event.tags = {
            ...event.tags,
            route_type: 'api',
          };
        }

        // Tag tRPC routes
        if (event.transaction.includes('/api/trpc/')) {
          event.tags = {
            ...event.tags,
            route_type: 'trpc',
          };
        }

        // Tag webhook routes
        if (event.transaction.includes('/api/webhook/')) {
          event.tags = {
            ...event.tags,
            route_type: 'webhook',
          };
        }
      }

      return event;
    },
  });
}
