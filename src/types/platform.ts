/**
 * Supported delivery platforms
 */
export type Platform =
  | 'instacart'
  | 'doordash'
  | 'ubereats'
  | 'amazon_fresh'
  | 'walmart'
  | 'shipt'
  | 'drizly'
  | 'totalwine'
  | 'costco'
  | 'samsclub'
  | 'amazon';

/**
 * Platform connection status
 */
export type ConnectionStatus = 'connected' | 'expired' | 'error' | 'disconnected';

/**
 * Encrypted data structure for storing OAuth tokens
 */
export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
  algorithm: 'aes-256-gcm';
  version: number; // For migration support
}

/**
 * Platform-specific metadata
 */
export interface PlatformMetadata {
  accountEmail?: string;
  accountId?: string;
  retailerId?: string; // For Instacart/Costco
  storeId?: string; // For grocery platforms
  lastError?: string;
  errorCount?: number;
  capabilities?: {
    liveLocation: boolean;
    webhooks: boolean;
    driverContact: boolean;
  };
}

/**
 * Notification settings
 */
export interface NotificationSettings {
  driverAssigned: boolean;
  outForDelivery: boolean;
  arrivingSoon: boolean; // 5 minute warning
  delivered: boolean;
  delayed: boolean;
  quietHours?: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}

/**
 * Platform display configuration
 */
export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  iconUrl?: string;
  supportsOAuth: boolean;
  supportsWebhooks: boolean;
  supportsLiveLocation: boolean;
}

/**
 * All supported platforms with their configurations
 */
export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  instacart: {
    id: 'instacart',
    name: 'Instacart',
    color: '#43B02A',
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsLiveLocation: true,
  },
  doordash: {
    id: 'doordash',
    name: 'DoorDash',
    color: '#FF3008',
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsLiveLocation: true,
  },
  ubereats: {
    id: 'ubereats',
    name: 'Uber Eats',
    color: '#06C167',
    supportsOAuth: true,
    supportsWebhooks: true,
    supportsLiveLocation: true,
  },
  amazon_fresh: {
    id: 'amazon_fresh',
    name: 'Amazon Fresh',
    color: '#FF9900',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: true,
  },
  walmart: {
    id: 'walmart',
    name: 'Walmart+',
    color: '#0071DC',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: true,
  },
  shipt: {
    id: 'shipt',
    name: 'Shipt',
    color: '#00A859',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: true,
  },
  drizly: {
    id: 'drizly',
    name: 'Drizly',
    color: '#6B46C1',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: false,
  },
  totalwine: {
    id: 'totalwine',
    name: 'Total Wine',
    color: '#6D2C41',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: false,
  },
  costco: {
    id: 'costco',
    name: 'Costco',
    color: '#E31837',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: true,
  },
  samsclub: {
    id: 'samsclub',
    name: "Sam's Club",
    color: '#0067A0',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: true,
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    color: '#FF9900',
    supportsOAuth: false,
    supportsWebhooks: false,
    supportsLiveLocation: true,
  },
};
