/**
 * Next.js instrumentation hook
 * Loads the Sentry server or edge configuration for the active runtime.
 * Each config only calls Sentry.init when SENTRY_DSN is set.
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Reports errors from Server Components, route handlers and middleware.
export const onRequestError = Sentry.captureRequestError;
