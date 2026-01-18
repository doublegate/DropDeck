/**
 * Test fixtures and factory functions for generating mock data
 */

import { faker } from '@faker-js/faker';
import type { UnifiedDelivery, DeliveryStatus, DriverLocation, OrderItem } from '@/types/delivery';
import type { Platform, PlatformConfig } from '@/types/platform';

/**
 * All available platforms
 */
export const ALL_PLATFORMS: Platform[] = [
  'instacart',
  'doordash',
  'ubereats',
  'amazon',
  'amazon_fresh',
  'walmart',
  'shipt',
  'drizly',
  'totalwine',
  'costco',
  'samsclub',
];

/**
 * All delivery statuses
 */
export const ALL_STATUSES: DeliveryStatus[] = [
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'driver_heading_to_store',
  'driver_at_store',
  'out_for_delivery',
  'arriving',
  'delivered',
  'cancelled',
  'delayed',
];

/**
 * Status labels for display
 */
export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for Pickup',
  driver_assigned: 'Driver Assigned',
  driver_heading_to_store: 'Driver Heading to Store',
  driver_at_store: 'Driver at Store',
  out_for_delivery: 'Out for Delivery',
  arriving: 'Arriving',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  delayed: 'Delayed',
};

/**
 * Create a mock driver location
 */
export function createMockDriverLocation(overrides: Partial<DriverLocation> = {}): DriverLocation {
  return {
    lat: faker.location.latitude({ min: 37.7, max: 37.85 }),
    lng: faker.location.longitude({ min: -122.5, max: -122.35 }),
    heading: faker.number.int({ min: 0, max: 360 }),
    speed: faker.number.int({ min: 0, max: 65 }),
    accuracy: faker.number.int({ min: 5, max: 50 }),
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Create a mock order item
 */
export function createMockOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 5 }),
    unitPrice: faker.number.int({ min: 199, max: 4999 }),
    imageUrl: faker.image.url(),
    substituted: false,
    ...overrides,
  };
}

/**
 * Create a mock delivery
 */
export function createMockDelivery(overrides: Partial<UnifiedDelivery> = {}): UnifiedDelivery {
  const platform = overrides.platform ?? faker.helpers.arrayElement(ALL_PLATFORMS);
  const status = overrides.status ?? faker.helpers.arrayElement(ALL_STATUSES);
  const isActive = !['delivered', 'cancelled'].includes(status);
  const minutesRemaining = isActive ? faker.number.int({ min: 5, max: 60 }) : 0;

  const baseDelivery: UnifiedDelivery = {
    id: faker.string.uuid(),
    platform,
    externalOrderId: faker.string.alphanumeric(12).toUpperCase(),

    status,
    statusLabel: STATUS_LABELS[status],
    statusUpdatedAt: faker.date.recent({ days: 1 }),

    driver: isActive && ['out_for_delivery', 'arriving', 'driver_assigned'].includes(status)
      ? {
          name: faker.person.firstName(),
          photo: faker.image.avatar(),
          phone: '***-***-' + faker.string.numeric(4),
          rating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
          vehicle: {
            make: faker.vehicle.manufacturer(),
            model: faker.vehicle.model(),
            color: faker.vehicle.color(),
            licensePlate: '***' + faker.string.alpha(3).toUpperCase(),
          },
          location: createMockDriverLocation(),
        }
      : undefined,

    destination: {
      address: faker.location.streetAddress(true),
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state({ abbreviated: true }),
      zipCode: faker.location.zipCode(),
      lat: faker.location.latitude({ min: 37.7, max: 37.85 }),
      lng: faker.location.longitude({ min: -122.5, max: -122.35 }),
      instructions: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    },

    eta: {
      estimatedArrival: new Date(Date.now() + minutesRemaining * 60 * 1000),
      minutesRemaining,
      distanceRemaining: isActive
        ? {
            value: faker.number.float({ min: 0.5, max: 10, fractionDigits: 1 }),
            unit: 'miles',
          }
        : undefined,
      stopsRemaining: platform === 'amazon' ? faker.number.int({ min: 0, max: 5 }) : undefined,
      trafficConditions: faker.helpers.arrayElement(['light', 'moderate', 'heavy']),
      confidence: faker.helpers.arrayElement(['high', 'medium', 'low']),
    },

    order: {
      itemCount: faker.number.int({ min: 1, max: 20 }),
      totalAmount: faker.number.int({ min: 1500, max: 15000 }),
      currency: 'USD',
      items: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
        createMockOrderItem()
      ),
      specialInstructions: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
    },

    tracking: {
      url: faker.internet.url(),
      mapAvailable: isActive,
      liveUpdates: isActive && ['out_for_delivery', 'arriving'].includes(status),
      contactDriverAvailable: isActive && !!overrides.driver,
    },

    timestamps: {
      ordered: faker.date.recent({ days: 1 }),
      confirmed: faker.date.recent({ days: 1 }),
      preparing: faker.helpers.maybe(() => faker.date.recent({ days: 1 }), { probability: 0.8 }),
      readyForPickup: ['ready_for_pickup', 'out_for_delivery', 'arriving', 'delivered'].includes(status)
        ? faker.date.recent({ days: 1 })
        : undefined,
      driverAssigned: ['driver_assigned', 'out_for_delivery', 'arriving', 'delivered'].includes(status)
        ? faker.date.recent({ days: 1 })
        : undefined,
      pickedUp: ['out_for_delivery', 'arriving', 'delivered'].includes(status)
        ? faker.date.recent({ days: 1 })
        : undefined,
      outForDelivery: ['out_for_delivery', 'arriving', 'delivered'].includes(status)
        ? faker.date.recent({ days: 1 })
        : undefined,
      arriving: ['arriving', 'delivered'].includes(status)
        ? faker.date.recent({ days: 1 })
        : undefined,
      delivered: status === 'delivered' ? faker.date.recent({ days: 1 }) : undefined,
      cancelled: status === 'cancelled' ? faker.date.recent({ days: 1 }) : undefined,
    },

    meta: {
      lastFetchedAt: new Date(),
      nextFetchAt: new Date(Date.now() + 30000),
      fetchMethod: faker.helpers.arrayElement(['api', 'webhook', 'polling']),
      adapterId: `${platform}-adapter`,
    },
  };

  return { ...baseDelivery, ...overrides };
}

/**
 * Create multiple mock deliveries
 */
export function createMockDeliveries(count: number, overrides: Partial<UnifiedDelivery> = {}): UnifiedDelivery[] {
  return Array.from({ length: count }, () => createMockDelivery(overrides));
}

/**
 * Create mock platform config
 */
export function createMockPlatformConfig(platform: Platform): PlatformConfig {
  const configs: Record<Platform, PlatformConfig> = {
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
    amazon: {
      id: 'amazon',
      name: 'Amazon',
      color: '#FF9900',
      supportsOAuth: false,
      supportsWebhooks: false,
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
  };

  return configs[platform];
}

/**
 * Create mock user
 */
export function createMockUser(overrides: Partial<{
  id: string;
  name: string;
  email: string;
  image: string;
}> = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    image: faker.image.avatar(),
    ...overrides,
  };
}

/**
 * Create mock notification
 */
export function createMockNotification(overrides: Partial<{
  id: string;
  type: string;
  title: string;
  body: string;
  data: {
    deliveryId?: string;
    platform?: string;
    status?: string;
    actionUrl?: string;
  };
  read: boolean;
  createdAt: Date;
}> = {}) {
  const delivery = createMockDelivery();

  return {
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['status_update', 'driver_assigned', 'arriving_soon', 'delivered']),
    title: `${delivery.platform} Order Update`,
    body: `Your order is ${delivery.statusLabel.toLowerCase()}`,
    data: {
      deliveryId: delivery.id,
      platform: delivery.platform,
      status: delivery.status,
      actionUrl: `/delivery/${delivery.id}`,
    },
    read: false,
    createdAt: faker.date.recent({ days: 1 }),
    ...overrides,
  };
}
