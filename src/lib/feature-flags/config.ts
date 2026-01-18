/**
 * Feature flags configuration for DropDeck
 * Controls feature rollout and A/B testing
 */

/**
 * Feature flag types
 */
export type FeatureFlagType = 'boolean' | 'percentage' | 'userList';

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  /** Unique identifier for the flag */
  key: string;
  /** Human-readable name */
  name: string;
  /** Description of what the flag controls */
  description: string;
  /** Type of flag */
  type: FeatureFlagType;
  /** Default value if not configured */
  defaultValue: boolean;
  /** For percentage rollouts: 0-100 */
  percentage?: number;
  /** For user list: array of user IDs */
  userIds?: string[];
  /** Environment-specific overrides */
  environments?: {
    development?: boolean;
    staging?: boolean;
    production?: boolean;
  };
}

/**
 * Feature flags registry
 * Add new feature flags here
 */
export const featureFlags: Record<string, FeatureFlag> = {
  // Beta access control
  betaInviteRequired: {
    key: 'betaInviteRequired',
    name: 'Beta Invite Required',
    description: 'Require invite code for new signups',
    type: 'boolean',
    defaultValue: true,
    environments: {
      development: false,
      staging: false,
      production: true,
    },
  },

  // Public signup
  publicSignup: {
    key: 'publicSignup',
    name: 'Public Signup',
    description: 'Allow anyone to sign up without invite',
    type: 'boolean',
    defaultValue: false,
    environments: {
      development: true,
      staging: true,
      production: false,
    },
  },

  // Platform features
  allPlatformsEnabled: {
    key: 'allPlatformsEnabled',
    name: 'All Platforms Enabled',
    description: 'Enable all delivery platform integrations',
    type: 'boolean',
    defaultValue: true,
  },

  // Real-time tracking
  liveTrackingEnabled: {
    key: 'liveTrackingEnabled',
    name: 'Live Tracking',
    description: 'Enable real-time driver location tracking',
    type: 'boolean',
    defaultValue: true,
  },

  // Push notifications
  pushNotificationsEnabled: {
    key: 'pushNotificationsEnabled',
    name: 'Push Notifications',
    description: 'Enable browser push notifications',
    type: 'boolean',
    defaultValue: true,
  },

  // New dashboard (example gradual rollout)
  newDashboard: {
    key: 'newDashboard',
    name: 'New Dashboard',
    description: 'New redesigned dashboard experience',
    type: 'percentage',
    defaultValue: false,
    percentage: 0,
    environments: {
      development: true,
      staging: true,
      production: false,
    },
  },

  // Advanced filters
  advancedFilters: {
    key: 'advancedFilters',
    name: 'Advanced Filters',
    description: 'Advanced delivery filtering options',
    type: 'percentage',
    defaultValue: false,
    percentage: 100,
  },

  // Delivery analytics
  deliveryAnalytics: {
    key: 'deliveryAnalytics',
    name: 'Delivery Analytics',
    description: 'Personal delivery analytics and insights',
    type: 'boolean',
    defaultValue: false,
    environments: {
      development: true,
      staging: true,
      production: false,
    },
  },

  // Feedback widget
  feedbackWidget: {
    key: 'feedbackWidget',
    name: 'Feedback Widget',
    description: 'Show floating feedback widget',
    type: 'boolean',
    defaultValue: true,
    environments: {
      development: true,
      staging: true,
      production: true,
    },
  },

  // Status page
  statusPage: {
    key: 'statusPage',
    name: 'Status Page',
    description: 'Public system status page',
    type: 'boolean',
    defaultValue: true,
  },

  // Debug mode
  debugMode: {
    key: 'debugMode',
    name: 'Debug Mode',
    description: 'Enable debug information in UI',
    type: 'boolean',
    defaultValue: false,
    environments: {
      development: true,
      staging: false,
      production: false,
    },
  },
};

/**
 * Get feature flag value with environment override
 */
export function getFeatureFlagValue(
  flag: FeatureFlag,
  environment: 'development' | 'staging' | 'production' = 'production'
): boolean {
  // Check environment override first
  if (flag.environments?.[environment] !== undefined) {
    return flag.environments[environment];
  }

  return flag.defaultValue;
}

/**
 * Get all feature flags with their current values
 */
export function getAllFeatureFlags(
  environment: 'development' | 'staging' | 'production' = 'production'
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const [key, flag] of Object.entries(featureFlags)) {
    result[key] = getFeatureFlagValue(flag, environment);
  }

  return result;
}
