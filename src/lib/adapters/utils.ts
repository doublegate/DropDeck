import type { DriverLocation } from '@/types/delivery';

/**
 * Earth radius in miles
 */
const EARTH_RADIUS_MILES = 3959;

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @param unit - Unit of distance ('miles' or 'km')
 * @returns Distance in the specified unit
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  unit: 'miles' | 'km' = 'miles'
): number {
  const R = unit === 'miles' ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate ETA in minutes based on distance and speed
 * @param distanceMiles - Distance in miles
 * @param speedMph - Speed in miles per hour (default 25 for city driving)
 * @returns Estimated minutes
 */
export function calculateEtaFromDistance(distanceMiles: number, speedMph = 25): number {
  return Math.round((distanceMiles / speedMph) * 60);
}

/**
 * Calculate heading (bearing) between two points
 * @returns Heading in degrees (0-360)
 */
export function calculateHeading(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLng = toRadians(toLng - fromLng);
  const lat1 = toRadians(fromLat);
  const lat2 = toRadians(toLat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let heading = Math.atan2(y, x) * (180 / Math.PI);
  heading = (heading + 360) % 360; // Normalize to 0-360

  return heading;
}

/**
 * Interpolate between two locations for smooth animation
 * @param from - Starting location
 * @param to - Ending location
 * @param fraction - Interpolation fraction (0-1)
 * @returns Interpolated location
 */
export function interpolateLocation(
  from: Pick<DriverLocation, 'lat' | 'lng'>,
  to: Pick<DriverLocation, 'lat' | 'lng'>,
  fraction: number
): { lat: number; lng: number } {
  return {
    lat: from.lat + (to.lat - from.lat) * fraction,
    lng: from.lng + (to.lng - from.lng) * fraction,
  };
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param baseDelayMs - Base delay in milliseconds
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * 2 ** attempt;
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format phone number for display (masked)
 */
export function maskPhoneNumber(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) {
    return phone;
  }

  // Show only last 4 digits
  const lastFour = digits.slice(-4);
  return `***-***-${lastFour}`;
}

/**
 * Format license plate for display (partial)
 */
export function maskLicensePlate(plate: string): string {
  if (plate.length < 3) {
    return plate;
  }

  // Show only last 3 characters
  const lastThree = plate.slice(-3);
  return `***${lastThree}`;
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

/**
 * Format ETA for display
 */
export function formatEta(minutes: number): string {
  if (minutes < 1) {
    return 'Arriving now';
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

/**
 * Parse ISO date string safely
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) {
    return null;
  }

  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
