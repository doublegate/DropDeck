import type { DeliveryStatus } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * Status mapping configuration for each platform
 */
type StatusMap = Record<string, DeliveryStatus>;

/**
 * DoorDash status mappings
 */
export const doordashStatusMap: StatusMap = {
  // Order states
  created: 'preparing',
  confirmed: 'preparing',
  being_prepared: 'preparing',
  ready_for_pickup: 'ready_for_pickup',

  // Dasher states
  dasher_confirmed: 'driver_assigned',
  dasher_confirmed_store_arrived: 'driver_at_store',
  picking_up: 'driver_at_store',
  picked_up: 'out_for_delivery',
  en_route_to_consumer: 'out_for_delivery',
  arriving: 'arriving',
  arrived: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
  delayed: 'delayed',
};

/**
 * Uber Eats status mappings
 */
export const ubereatsStatusMap: StatusMap = {
  // Order processing
  pending: 'preparing',
  accepted: 'preparing',
  preparing: 'preparing',
  ready_for_pickup: 'ready_for_pickup',

  // Courier states
  courier_assigned: 'driver_assigned',
  courier_heading_to_store: 'driver_heading_to_store',
  courier_at_store: 'driver_at_store',
  in_transit: 'out_for_delivery',
  arriving: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Instacart status mappings
 */
export const instacartStatusMap: StatusMap = {
  // Order states
  order_placed: 'preparing',
  order_acknowledged: 'preparing',
  shopping: 'preparing',
  checkout: 'preparing',
  ready: 'ready_for_pickup',

  // Shopper states
  shopper_assigned: 'driver_assigned',
  on_the_way: 'driver_heading_to_store',
  at_store: 'driver_at_store',
  delivering: 'out_for_delivery',
  almost_there: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
  delayed: 'delayed',
};

/**
 * Amazon status mappings
 */
export const amazonStatusMap: StatusMap = {
  // Order processing
  pending: 'preparing',
  processing: 'preparing',
  shipped: 'out_for_delivery',
  out_for_delivery: 'out_for_delivery',
  arriving_today: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
  delayed: 'delayed',
};

/**
 * Walmart status mappings
 */
export const walmartStatusMap: StatusMap = {
  // Order processing
  order_placed: 'preparing',
  order_received: 'preparing',
  preparing: 'preparing',
  ready_for_pickup: 'ready_for_pickup',

  // Delivery states
  driver_assigned: 'driver_assigned',
  driver_heading_to_store: 'driver_heading_to_store',
  driver_at_store: 'driver_at_store',
  on_the_way: 'out_for_delivery',
  arriving: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Shipt status mappings
 */
export const shiptStatusMap: StatusMap = {
  // Order states
  submitted: 'preparing',
  processing: 'preparing',
  shopping: 'preparing',

  // Shopper states
  shopper_assigned: 'driver_assigned',
  on_the_way_to_store: 'driver_heading_to_store',
  at_store: 'driver_at_store',
  on_the_way: 'out_for_delivery',
  almost_there: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Costco (via Instacart) status mappings
 */
export const costcoStatusMap = instacartStatusMap;

/**
 * Sam's Club status mappings
 */
export const samsclubStatusMap: StatusMap = {
  // Order states
  order_placed: 'preparing',
  processing: 'preparing',
  preparing: 'preparing',

  // Delivery states
  driver_assigned: 'driver_assigned',
  out_for_delivery: 'out_for_delivery',
  arriving: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Drizly status mappings
 */
export const drizlyStatusMap: StatusMap = {
  // Order states
  submitted: 'preparing',
  accepted: 'preparing',
  preparing: 'preparing',

  // Delivery states
  ready_for_pickup: 'ready_for_pickup',
  out_for_delivery: 'out_for_delivery',
  arriving: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Total Wine status mappings
 */
export const totalwineStatusMap: StatusMap = {
  // Order states
  submitted: 'preparing',
  processing: 'preparing',
  ready: 'ready_for_pickup',

  // Delivery states
  out_for_delivery: 'out_for_delivery',
  arriving: 'arriving',

  // Final states
  delivered: 'delivered',
  cancelled: 'cancelled',
};

/**
 * Get status map for a platform
 */
export function getStatusMap(platform: Platform): StatusMap {
  const maps: Record<Platform, StatusMap> = {
    doordash: doordashStatusMap,
    ubereats: ubereatsStatusMap,
    instacart: instacartStatusMap,
    amazon: amazonStatusMap,
    amazon_fresh: amazonStatusMap,
    walmart: walmartStatusMap,
    shipt: shiptStatusMap,
    costco: costcoStatusMap,
    samsclub: samsclubStatusMap,
    drizly: drizlyStatusMap,
    totalwine: totalwineStatusMap,
  };

  return maps[platform] ?? {};
}

/**
 * Map a platform status to unified status
 */
export function mapPlatformStatus(platform: Platform, platformStatus: string): DeliveryStatus {
  const map = getStatusMap(platform);
  const normalizedStatus = platformStatus.toLowerCase().replace(/[- ]/g, '_');
  return map[normalizedStatus] ?? 'preparing';
}
