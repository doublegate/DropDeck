import { createTRPCClient, httpBatchLink, loggerLink, type TRPCLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers';

/**
 * Get the base URL for API calls
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser: use relative URL
    return '';
  }

  // Server: use environment variable or localhost
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Custom link for handling rate limiting
 */
const rateLimitLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return next(op);
  };
};

/**
 * Vanilla tRPC client for server-side usage
 * Use this in Server Components and Server Actions
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    // Logger in development
    loggerLink({
      enabled: (opts) =>
        process.env.NODE_ENV === 'development' ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    // Rate limit handling
    rateLimitLink,
    // HTTP batch link for efficient requests
    httpBatchLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      headers() {
        return {
          'x-trpc-source': 'server',
        };
      },
    }),
  ],
});

/**
 * Export types for external usage
 */
export type { AppRouter };
