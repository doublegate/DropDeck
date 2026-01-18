/**
 * Feature flags barrel export
 */

// Client utilities (re-exported for convenience, but should use 'use client' directive)
export {
  Feature,
  FeatureFlagsProvider,
  useFeatureFlag,
  useFeatureFlags,
  useFeatureFlagsMap,
  withFeature,
} from './client';
// Config and types
export {
  type FeatureFlag,
  type FeatureFlagType,
  featureFlags,
  getAllFeatureFlags,
  getFeatureFlagValue,
} from './config';
// Server utilities
export {
  getAllFlags,
  getEnabledFeatures,
  isFeatureEnabled,
  requireFeature,
  withFeatureFlag,
} from './server';
