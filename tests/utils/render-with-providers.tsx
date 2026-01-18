/**
 * Custom render function that wraps components with all necessary providers
 */

import * as React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial theme ('light' | 'dark' | 'system') */
  theme?: string;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Mock user data */
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * All providers wrapper for testing
 */
function AllProviders({
  children,
  theme = 'light',
}: {
  children: React.ReactNode;
  theme?: string;
}) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme={theme} enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/**
 * Custom render function with all providers
 */
function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { theme = 'light', ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders theme={theme}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

// Export createTestQueryClient for advanced use cases
export { createTestQueryClient };
