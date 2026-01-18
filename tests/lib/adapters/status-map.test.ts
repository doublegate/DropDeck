/**
 * Status mapping tests
 */

import { describe, it, expect } from 'vitest';
import {
  getStatusMap,
  mapPlatformStatus,
  doordashStatusMap,
  ubereatsStatusMap,
  instacartStatusMap,
  amazonStatusMap,
  walmartStatusMap,
  shiptStatusMap,
  drizlyStatusMap,
  totalwineStatusMap,
  samsclubStatusMap,
} from '@/lib/adapters/status-map';
import type { Platform } from '@/types/platform';

describe('getStatusMap', () => {
  it('returns DoorDash status map', () => {
    const map = getStatusMap('doordash');
    expect(map).toBe(doordashStatusMap);
  });

  it('returns Uber Eats status map', () => {
    const map = getStatusMap('ubereats');
    expect(map).toBe(ubereatsStatusMap);
  });

  it('returns Instacart status map', () => {
    const map = getStatusMap('instacart');
    expect(map).toBe(instacartStatusMap);
  });

  it('returns Amazon status map', () => {
    const map = getStatusMap('amazon');
    expect(map).toBe(amazonStatusMap);
  });

  it('returns Walmart status map', () => {
    const map = getStatusMap('walmart');
    expect(map).toBe(walmartStatusMap);
  });

  it('returns Shipt status map', () => {
    const map = getStatusMap('shipt');
    expect(map).toBe(shiptStatusMap);
  });

  it('returns Drizly status map', () => {
    const map = getStatusMap('drizly');
    expect(map).toBe(drizlyStatusMap);
  });

  it('returns Total Wine status map', () => {
    const map = getStatusMap('totalwine');
    expect(map).toBe(totalwineStatusMap);
  });

  it('returns Sams Club status map', () => {
    const map = getStatusMap('samsclub');
    expect(map).toBe(samsclubStatusMap);
  });

  it('returns Costco status map (same as Instacart)', () => {
    const map = getStatusMap('costco');
    expect(map).toBe(instacartStatusMap);
  });

  it('returns empty object for unknown platform', () => {
    const map = getStatusMap('unknown' as Platform);
    expect(map).toEqual({});
  });
});

describe('mapPlatformStatus', () => {
  describe('DoorDash', () => {
    it('maps preparing statuses', () => {
      expect(mapPlatformStatus('doordash', 'created')).toBe('preparing');
      expect(mapPlatformStatus('doordash', 'confirmed')).toBe('preparing');
      expect(mapPlatformStatus('doordash', 'being_prepared')).toBe('preparing');
    });

    it('maps driver statuses', () => {
      expect(mapPlatformStatus('doordash', 'dasher_confirmed')).toBe('driver_assigned');
      expect(mapPlatformStatus('doordash', 'dasher_confirmed_store_arrived')).toBe('driver_at_store');
      expect(mapPlatformStatus('doordash', 'picking_up')).toBe('driver_at_store');
    });

    it('maps delivery statuses', () => {
      expect(mapPlatformStatus('doordash', 'picked_up')).toBe('out_for_delivery');
      expect(mapPlatformStatus('doordash', 'en_route_to_consumer')).toBe('out_for_delivery');
      expect(mapPlatformStatus('doordash', 'arriving')).toBe('arriving');
      expect(mapPlatformStatus('doordash', 'arrived')).toBe('arriving');
    });

    it('maps final statuses', () => {
      expect(mapPlatformStatus('doordash', 'delivered')).toBe('delivered');
      expect(mapPlatformStatus('doordash', 'cancelled')).toBe('cancelled');
      expect(mapPlatformStatus('doordash', 'delayed')).toBe('delayed');
    });
  });

  describe('Uber Eats', () => {
    it('maps preparing statuses', () => {
      expect(mapPlatformStatus('ubereats', 'pending')).toBe('preparing');
      expect(mapPlatformStatus('ubereats', 'accepted')).toBe('preparing');
      expect(mapPlatformStatus('ubereats', 'preparing')).toBe('preparing');
    });

    it('maps courier statuses', () => {
      expect(mapPlatformStatus('ubereats', 'courier_assigned')).toBe('driver_assigned');
      expect(mapPlatformStatus('ubereats', 'courier_heading_to_store')).toBe('driver_heading_to_store');
      expect(mapPlatformStatus('ubereats', 'courier_at_store')).toBe('driver_at_store');
      expect(mapPlatformStatus('ubereats', 'in_transit')).toBe('out_for_delivery');
    });

    it('maps final statuses', () => {
      expect(mapPlatformStatus('ubereats', 'arriving')).toBe('arriving');
      expect(mapPlatformStatus('ubereats', 'delivered')).toBe('delivered');
      expect(mapPlatformStatus('ubereats', 'cancelled')).toBe('cancelled');
    });
  });

  describe('Instacart', () => {
    it('maps order statuses', () => {
      expect(mapPlatformStatus('instacart', 'order_placed')).toBe('preparing');
      expect(mapPlatformStatus('instacart', 'order_acknowledged')).toBe('preparing');
      expect(mapPlatformStatus('instacart', 'shopping')).toBe('preparing');
      expect(mapPlatformStatus('instacart', 'checkout')).toBe('preparing');
      expect(mapPlatformStatus('instacart', 'ready')).toBe('ready_for_pickup');
    });

    it('maps shopper statuses', () => {
      expect(mapPlatformStatus('instacart', 'shopper_assigned')).toBe('driver_assigned');
      expect(mapPlatformStatus('instacart', 'on_the_way')).toBe('driver_heading_to_store');
      expect(mapPlatformStatus('instacart', 'at_store')).toBe('driver_at_store');
      expect(mapPlatformStatus('instacart', 'delivering')).toBe('out_for_delivery');
      expect(mapPlatformStatus('instacart', 'almost_there')).toBe('arriving');
    });
  });

  describe('Amazon', () => {
    it('maps order statuses', () => {
      expect(mapPlatformStatus('amazon', 'pending')).toBe('preparing');
      expect(mapPlatformStatus('amazon', 'processing')).toBe('preparing');
      expect(mapPlatformStatus('amazon', 'shipped')).toBe('out_for_delivery');
      expect(mapPlatformStatus('amazon', 'out_for_delivery')).toBe('out_for_delivery');
      expect(mapPlatformStatus('amazon', 'arriving_today')).toBe('arriving');
    });

    it('maps final statuses', () => {
      expect(mapPlatformStatus('amazon', 'delivered')).toBe('delivered');
      expect(mapPlatformStatus('amazon', 'cancelled')).toBe('cancelled');
      expect(mapPlatformStatus('amazon', 'delayed')).toBe('delayed');
    });
  });

  describe('Status Normalization', () => {
    it('normalizes case', () => {
      expect(mapPlatformStatus('doordash', 'DELIVERED')).toBe('delivered');
      expect(mapPlatformStatus('doordash', 'Delivered')).toBe('delivered');
    });

    it('normalizes hyphens to underscores', () => {
      expect(mapPlatformStatus('doordash', 'being-prepared')).toBe('preparing');
      expect(mapPlatformStatus('ubereats', 'courier-assigned')).toBe('driver_assigned');
    });

    it('normalizes spaces to underscores', () => {
      expect(mapPlatformStatus('doordash', 'being prepared')).toBe('preparing');
    });

    it('returns preparing for unknown status', () => {
      expect(mapPlatformStatus('doordash', 'unknown_status')).toBe('preparing');
      expect(mapPlatformStatus('ubereats', 'some_random_status')).toBe('preparing');
    });
  });
});

describe('Status Map Coverage', () => {
  it('DoorDash map covers all essential statuses', () => {
    const essentialStatuses = [
      'preparing',
      'ready_for_pickup',
      'driver_assigned',
      'out_for_delivery',
      'arriving',
      'delivered',
      'cancelled',
    ];

    const mappedStatuses = Object.values(doordashStatusMap);
    for (const status of essentialStatuses) {
      expect(mappedStatuses).toContain(status);
    }
  });

  it('Uber Eats map covers all essential statuses', () => {
    const essentialStatuses = [
      'preparing',
      'driver_assigned',
      'out_for_delivery',
      'arriving',
      'delivered',
      'cancelled',
    ];

    const mappedStatuses = Object.values(ubereatsStatusMap);
    for (const status of essentialStatuses) {
      expect(mappedStatuses).toContain(status);
    }
  });

  it('Instacart map covers all essential statuses', () => {
    const essentialStatuses = [
      'preparing',
      'driver_assigned',
      'out_for_delivery',
      'arriving',
      'delivered',
      'cancelled',
    ];

    const mappedStatuses = Object.values(instacartStatusMap);
    for (const status of essentialStatuses) {
      expect(mappedStatuses).toContain(status);
    }
  });
});
