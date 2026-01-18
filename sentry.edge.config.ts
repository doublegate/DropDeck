/**
 * Sentry edge runtime configuration
 * This file configures Sentry for Edge functions (middleware, edge API routes)
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Lower sample rate for edge functions (high volume)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

    // Filter out expected errors
    ignoreErrors: ['NEXT_NOT_FOUND', 'NEXT_REDIRECT'],

    // Scrub sensitive data
    beforeSend(event) {
      // Scrub headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      return event;
    },
  });
}
