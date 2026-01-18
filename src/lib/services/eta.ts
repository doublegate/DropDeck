import { calculateDistance, calculateEtaFromDistance } from '@/lib/adapters/utils';
import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * ETA confidence levels
 */
export type ETAConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * ETA calculation result
 */
export interface ETAResult {
  /** Estimated arrival time (absolute) */
  estimatedArrival: Date;
  /** Minutes remaining until arrival */
  minutesRemaining: number;
  /** Confidence score (0-100) */
  confidence: number;
  /** Confidence level for display */
  confidenceLevel: ETAConfidenceLevel;
  /** ETA range for low-confidence estimates */
  range: {
    min: Date;
    max: Date;
    minMinutes: number;
    maxMinutes: number;
  } | null;
  /** Source of the ETA */
  source: 'platform' | 'calculated' | 'estimated';
  /** Factors that affected the confidence */
  factors: string[];
}

/**
 * Platform historical accuracy data (0-100)
 * Higher = more accurate ETA predictions
 */
const PLATFORM_ACCURACY: Record<Platform, number> = {
  doordash: 85,
  ubereats: 82,
  instacart: 75,
  amazon: 90,
  amazon_fresh: 88,
  walmart: 78,
  shipt: 80,
  drizly: 70,
  totalwine: 65,
  costco: 72,
  samsclub: 73,
};

/**
 * Order type ETA modifiers
 */
const ORDER_TYPE_MODIFIERS: Record<string, number> = {
  restaurant: 1.0, // Fast food/restaurant - generally accurate
  grocery: 1.15, // Grocery - more variability in shopping time
  alcohol: 1.1, // Alcohol - ID verification adds time
  retail: 1.2, // General retail - more variable
};

/**
 * Traffic condition multipliers for ETA calculation
 */
const TRAFFIC_MULTIPLIERS: Record<string, number> = {
  light: 1.0,
  moderate: 1.2,
  heavy: 1.5,
};

/**
 * Calculate confidence score for an ETA
 */
function calculateConfidenceScore(
  delivery: UnifiedDelivery,
  platformAccuracy: number,
  distanceToDestination: number | null
): { confidence: number; factors: string[] } {
  let confidence = 50; // Base confidence
  const factors: string[] = [];

  // Platform provides ETA
  if (delivery.eta.estimatedArrival) {
    confidence += 20;
    factors.push('Platform ETA available');
  }

  // Driver location available
  if (delivery.driver?.location) {
    confidence += 15;
    factors.push('Driver location tracked');
  }

  // Distance factor - closer = more confident
  if (distanceToDestination !== null) {
    if (distanceToDestination < 1) {
      confidence += 10;
      factors.push('Driver nearby (<1 mi)');
    } else if (distanceToDestination < 3) {
      confidence += 5;
      factors.push('Driver approaching (1-3 mi)');
    }
  }

  // Status-based confidence adjustment
  const highConfidenceStatuses: DeliveryStatus[] = ['out_for_delivery', 'arriving'];
  if (highConfidenceStatuses.includes(delivery.status)) {
    confidence += 10;
    factors.push('Active delivery status');
  }

  // Platform accuracy adjustment
  const accuracyFactor = platformAccuracy / 100;
  confidence = Math.round(confidence * accuracyFactor);

  // Traffic conditions adjustment
  const trafficMultiplier = delivery.eta.trafficConditions
    ? (TRAFFIC_MULTIPLIERS[delivery.eta.trafficConditions] ?? 1)
    : 1;
  if (trafficMultiplier > 1.3) {
    confidence -= 10;
    factors.push('Heavy traffic conditions');
  } else if (trafficMultiplier > 1.1) {
    confidence -= 5;
    factors.push('Moderate traffic');
  }

  // Clamp to valid range
  confidence = Math.min(Math.max(confidence, 0), 100);

  return { confidence, factors };
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(confidence: number): ETAConfidenceLevel {
  if (confidence >= 80) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
}

/**
 * Calculate ETA range based on confidence
 */
function calculateETARange(
  _baseETA: Date,
  baseMinutes: number,
  confidence: number
): { min: Date; max: Date; minMinutes: number; maxMinutes: number } | null {
  // Only show range for low/medium confidence
  if (confidence >= 80) return null;

  // Calculate variance based on confidence
  // Lower confidence = wider range
  const varianceFactor = (100 - confidence) / 100;
  const varianceMinutes = Math.round(baseMinutes * varianceFactor * 0.5);

  const minMinutes = Math.max(0, baseMinutes - varianceMinutes);
  const maxMinutes = baseMinutes + varianceMinutes;

  const now = new Date();
  return {
    min: new Date(now.getTime() + minMinutes * 60 * 1000),
    max: new Date(now.getTime() + maxMinutes * 60 * 1000),
    minMinutes,
    maxMinutes,
  };
}

/**
 * Calculate or refine ETA for a delivery
 */
export function calculateETA(delivery: UnifiedDelivery): ETAResult {
  const platform = delivery.platform;
  const platformAccuracy = PLATFORM_ACCURACY[platform] ?? 70;
  const factors: string[] = [];

  // Calculate distance if driver location available
  let distanceToDestination: number | null = null;
  if (delivery.driver?.location) {
    distanceToDestination = calculateDistance(
      delivery.driver.location.lat,
      delivery.driver.location.lng,
      delivery.destination.lat,
      delivery.destination.lng,
      'miles'
    );
  }

  // Start with platform-provided ETA
  let minutesRemaining = delivery.eta.minutesRemaining;
  let source: ETAResult['source'] = 'platform';

  // If no platform ETA but we have driver location, calculate our own
  if (!delivery.eta.estimatedArrival && distanceToDestination !== null) {
    minutesRemaining = calculateEtaFromDistance(distanceToDestination);
    source = 'calculated';
    factors.push('ETA calculated from distance');
  }

  // If still no ETA, make a rough estimate based on status
  if (minutesRemaining <= 0) {
    const statusEstimates: Partial<Record<DeliveryStatus, number>> = {
      preparing: 35,
      ready_for_pickup: 25,
      driver_assigned: 20,
      driver_heading_to_store: 18,
      driver_at_store: 15,
      out_for_delivery: 12,
      arriving: 3,
      delivered: 0,
    };
    minutesRemaining = statusEstimates[delivery.status] ?? 30;
    source = 'estimated';
    factors.push('ETA estimated from status');
  }

  // Apply order type modifier
  const orderType = getOrderType(delivery.platform);
  const orderModifier = ORDER_TYPE_MODIFIERS[orderType] ?? 1.0;
  if (orderModifier > 1) {
    minutesRemaining = Math.round(minutesRemaining * orderModifier);
    factors.push(`Order type adjustment: ${orderType}`);
  }

  // Calculate confidence
  const { confidence, factors: confidenceFactors } = calculateConfidenceScore(
    delivery,
    platformAccuracy,
    distanceToDestination
  );

  // Calculate arrival time
  const now = new Date();
  const estimatedArrival = new Date(now.getTime() + minutesRemaining * 60 * 1000);

  // Calculate range for lower confidence
  const range = calculateETARange(estimatedArrival, minutesRemaining, confidence);

  return {
    estimatedArrival,
    minutesRemaining,
    confidence,
    confidenceLevel: getConfidenceLevel(confidence),
    range,
    source,
    factors: [...factors, ...confidenceFactors],
  };
}

/**
 * Determine order type from platform
 */
function getOrderType(platform: Platform): string {
  const platformTypes: Record<Platform, string> = {
    doordash: 'restaurant',
    ubereats: 'restaurant',
    instacart: 'grocery',
    amazon_fresh: 'grocery',
    walmart: 'grocery',
    shipt: 'grocery',
    costco: 'grocery',
    samsclub: 'grocery',
    drizly: 'alcohol',
    totalwine: 'alcohol',
    amazon: 'retail',
  };
  return platformTypes[platform] ?? 'retail';
}

/**
 * Format ETA for display
 */
export function formatETADisplay(minutes: number): string {
  if (minutes < 1) {
    return 'Arriving now';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

/**
 * Format ETA range for display
 */
export function formatETARange(range: ETAResult['range']): string | null {
  if (!range) return null;
  return `${Math.round(range.minMinutes)}-${Math.round(range.maxMinutes)} min`;
}

/**
 * Get color for confidence level
 */
export function getConfidenceColor(level: ETAConfidenceLevel): string {
  switch (level) {
    case 'high':
      return '#10B981'; // Signal Green
    case 'medium':
      return '#F59E0B'; // Alert Amber
    case 'low':
      return '#64748B'; // Slate
    default:
      return '#64748B';
  }
}

/**
 * Batch calculate ETAs for multiple deliveries
 */
export function calculateBatchETAs(deliveries: UnifiedDelivery[]): Map<string, ETAResult> {
  const results = new Map<string, ETAResult>();

  for (const delivery of deliveries) {
    results.set(delivery.id, calculateETA(delivery));
  }

  return results;
}

/**
 * Check if ETA has changed significantly
 * Used to trigger notifications
 */
export function hasSignificantETAChange(
  previousMinutes: number,
  currentMinutes: number,
  threshold = 5
): { changed: boolean; type: 'faster' | 'slower' | null; difference: number } {
  const difference = currentMinutes - previousMinutes;
  const absoluteDifference = Math.abs(difference);

  if (absoluteDifference < threshold) {
    return { changed: false, type: null, difference: 0 };
  }

  return {
    changed: true,
    type: difference < 0 ? 'faster' : 'slower',
    difference: absoluteDifference,
  };
}
