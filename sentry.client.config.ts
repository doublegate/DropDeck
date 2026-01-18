/**
 * Sentry client-side configuration
 * This file configures Sentry for the browser
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay for error debugging
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

    // Integrations
    integrations: [
      Sentry.replayIntegration({
        // Mask sensitive data
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: false,
      }),
      Sentry.browserTracingIntegration({
        // Trace navigation and page loads
        enableInp: true,
      }),
    ],

    // Filter out noisy errors
    ignoreErrors: [
      // Browser-specific errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',

      // Network errors that are expected
      'Failed to fetch',
      'NetworkError',
      'Network request failed',

      // User-initiated navigation
      'AbortError',

      // Extension-related
      /^chrome-extension:/,
      /^moz-extension:/,
    ],

    // Don't send PII
    beforeSend(event) {
      // Scrub authorization headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Scrub sensitive query params
      if (event.request?.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        if (params.has('token')) params.set('token', '[REDACTED]');
        if (params.has('code')) params.set('code', '[REDACTED]');
        if (params.has('state')) params.set('state', '[REDACTED]');
        event.request.query_string = params.toString();
      }

      return event;
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }

      // Redact sensitive URLs
      if (breadcrumb.data?.url) {
        const url = new URL(breadcrumb.data.url, window.location.origin);
        if (url.searchParams.has('token')) {
          url.searchParams.set('token', '[REDACTED]');
          breadcrumb.data.url = url.toString();
        }
      }

      return breadcrumb;
    },
  });
}
