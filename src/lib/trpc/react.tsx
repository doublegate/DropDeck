'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers';

/**
 * Create typed React hooks for tRPC
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Get the base URL for API calls
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * Create query client with sensible defaults
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // to avoid refetching immediately on the client
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on auth errors
          if (error instanceof Error && error.message.includes('UNAUTHORIZED')) {
            return false;
          }
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * tRPC + TanStack Query Provider
 * Wrap your app with this to enable tRPC hooks
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        // Logger in development
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        // HTTP batch link for efficient requests
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            return {
              'x-trpc-source': 'react',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

/**
 * Query keys for cache management
 */
export const queryKeys = {
  deliveries: {
    all: ['deliveries'] as const,
    active: () => [...queryKeys.deliveries.all, 'active'] as const,
    byPlatform: (platform: string) => [...queryKeys.deliveries.all, 'platform', platform] as const,
    detail: (id: string) => [...queryKeys.deliveries.all, 'detail', id] as const,
    history: (filters: Record<string, unknown>) =>
      [...queryKeys.deliveries.all, 'history', filters] as const,
  },
  platforms: {
    all: ['platforms'] as const,
    connections: () => [...queryKeys.platforms.all, 'connections'] as const,
    connection: (platform: string) => [...queryKeys.platforms.connections(), platform] as const,
  },
  preferences: {
    all: ['preferences'] as const,
    user: () => [...queryKeys.preferences.all, 'user'] as const,
  },
} as const;
