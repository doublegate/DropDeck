'use client';

/**
 * Client-side feature flag utilities
 */

import { createContext, type ReactNode, useContext, useMemo } from 'react';

/**
 * Feature flags context type
 */
interface FeatureFlagsContextType {
  flags: Record<string, boolean>;
  isEnabled: (flagKey: string) => boolean;
}

/**
 * Feature flags context
 */
const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

/**
 * Feature flags provider props
 */
interface FeatureFlagsProviderProps {
  children: ReactNode;
  flags: Record<string, boolean>;
}

/**
 * Feature flags provider component
 * Wrap your app with this to provide feature flags to all components
 */
export function FeatureFlagsProvider({ children, flags }: FeatureFlagsProviderProps) {
  const value = useMemo(
    () => ({
      flags,
      isEnabled: (flagKey: string) => flags[flagKey] ?? false,
    }),
    [flags]
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

/**
 * Hook to access feature flags
 */
export function useFeatureFlags(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagsContext);

  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }

  return context;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(flagKey: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagKey);
}

/**
 * Hook to get multiple feature flags at once
 */
export function useFeatureFlagsMap(flagKeys: string[]): Record<string, boolean> {
  const { flags } = useFeatureFlags();

  return useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const key of flagKeys) {
      result[key] = flags[key] ?? false;
    }
    return result;
  }, [flags, flagKeys]);
}

/**
 * Component that renders children only if feature is enabled
 */
interface FeatureProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Feature({ flag, children, fallback = null }: FeatureProps) {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? children : fallback;
}

/**
 * Higher-order component to wrap components with feature flag check
 */
export function withFeature<P extends object>(
  flagKey: string,
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(flagKey);

    if (isEnabled) {
      return <WrappedComponent {...props} />;
    }

    if (FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return null;
  };
}
