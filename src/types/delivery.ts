import type { Platform } from './platform';

/**
 * Delivery status types
 */
export type DeliveryStatus =
  | 'preparing'
  | 'ready_for_pickup'
  | 'driver_assigned'
  | 'driver_heading_to_store'
  | 'driver_at_store'
  | 'out_for_delivery'
  | 'arriving'
  | 'delivered'
  | 'cancelled'
  | 'delayed';

/**
 * Driver location data
 */
export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number; // Degrees (0-360)
  speed?: number; // km/h
  accuracy?: number; // Meters
  timestamp: Date;
}

/**
 * Order item in a delivery
 */
export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice?: number; // In cents
  imageUrl?: string;
  substituted?: boolean;
  substitutedWith?: string;
}

/**
 * Timeline event for delivery tracking
 */
export interface TimelineEvent {
  status: DeliveryStatus;
  timestamp: Date;
  message?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Unified delivery data model
 * Normalizes data from all platforms into a common structure
 */
export interface UnifiedDelivery {
  // Identifiers
  id: string; // DropDeck internal ID
  platform: Platform;
  externalOrderId: string; // Platform's order ID

  // Status
  status: DeliveryStatus;
  statusLabel: string; // Human-readable: "Out for delivery"
  statusUpdatedAt: Date;

  // Driver information (when available)
  driver?: {
    name?: string; // First name only
    photo?: string; // URL to driver photo
    phone?: string; // Masked: "***-***-1234"
    rating?: number; // Driver rating if available
    vehicle?: {
      make?: string;
      model?: string;
      color?: string;
      licensePlate?: string; // Partial: "***ABC"
    };
    location?: DriverLocation;
  };

  // Destination
  destination: {
    address: string; // Full address
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    lat: number;
    lng: number;
    instructions?: string; // Delivery instructions
  };

  // ETA information
  eta: {
    estimatedArrival: Date; // Absolute time
    minutesRemaining: number; // Minutes until arrival
    distanceRemaining?: {
      value: number;
      unit: 'miles' | 'km';
    };
    stopsRemaining?: number; // For Amazon multi-stop routes
    trafficConditions?: 'light' | 'moderate' | 'heavy';
    confidence: 'high' | 'medium' | 'low';
  };

  // Order summary
  order: {
    itemCount: number;
    totalAmount?: number; // In cents
    currency?: string; // "USD"
    items?: OrderItem[];
    specialInstructions?: string;
  };

  // Tracking metadata
  tracking: {
    url?: string; // Platform tracking page URL
    mapAvailable: boolean; // Can show live map
    liveUpdates: boolean; // Real-time location available
    contactDriverAvailable: boolean; // Can contact driver
  };

  // Event timestamps
  timestamps: {
    ordered: Date;
    confirmed?: Date;
    preparing?: Date;
    readyForPickup?: Date;
    driverAssigned?: Date;
    pickedUp?: Date;
    outForDelivery?: Date;
    arriving?: Date;
    delivered?: Date;
    cancelled?: Date;
  };

  // DropDeck metadata
  meta: {
    lastFetchedAt: Date;
    nextFetchAt?: Date;
    fetchMethod: 'api' | 'webhook' | 'polling' | 'embedded';
    adapterId: string; // Which adapter provided this
    rawData?: unknown; // Original platform response (debug)
  };
}

/**
 * Status display configuration
 */
export interface StatusConfig {
  status: DeliveryStatus;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * Status display configurations
 */
export const STATUS_CONFIGS: Record<DeliveryStatus, StatusConfig> = {
  preparing: {
    status: 'preparing',
    label: 'Preparing',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    icon: 'package',
  },
  ready_for_pickup: {
    status: 'ready_for_pickup',
    label: 'Ready for Pickup',
    color: '#64748B',
    bgColor: 'rgba(100, 116, 139, 0.15)',
    icon: 'clipboard-check',
  },
  driver_assigned: {
    status: 'driver_assigned',
    label: 'Driver Assigned',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    icon: 'user-check',
  },
  driver_heading_to_store: {
    status: 'driver_heading_to_store',
    label: 'Driver Heading to Store',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    icon: 'car',
  },
  driver_at_store: {
    status: 'driver_at_store',
    label: 'Driver at Store',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    icon: 'store',
  },
  out_for_delivery: {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    icon: 'truck',
  },
  arriving: {
    status: 'arriving',
    label: 'Arriving',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
    icon: 'map-pin',
  },
  delivered: {
    status: 'delivered',
    label: 'Delivered',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    icon: 'package-check',
  },
  cancelled: {
    status: 'cancelled',
    label: 'Cancelled',
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    icon: 'x-circle',
  },
  delayed: {
    status: 'delayed',
    label: 'Delayed',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    icon: 'alert-triangle',
  },
};
