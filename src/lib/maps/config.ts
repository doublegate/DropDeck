import type { StyleSpecification } from 'maplibre-gl';

/**
 * MapLibre configuration for DropDeck
 * Uses OpenFreeMap for free tile sources
 */

/**
 * OpenFreeMap tile sources
 */
export const TILE_SOURCES = {
  openFreeMap: 'https://tiles.openfreemap.org/styles/liberty/style.json',
  openFreeMapLight: 'https://tiles.openfreemap.org/styles/liberty/style.json',
  openFreeMapDark: 'https://tiles.openfreemap.org/styles/dark/style.json',
} as const;

/**
 * Default map center (San Francisco)
 */
export const DEFAULT_CENTER: [number, number] = [-122.4194, 37.7749];

/**
 * Default zoom level
 */
export const DEFAULT_ZOOM = 13;

/**
 * Zoom levels
 */
export const ZOOM_LEVELS = {
  city: 12,
  neighborhood: 14,
  street: 16,
  building: 18,
  detail: 19,
} as const;

/**
 * Animation durations in milliseconds
 */
export const ANIMATION = {
  markerMove: 500,
  flyTo: 1500,
  easeTo: 1000,
  themeTransition: 300,
} as const;

/**
 * Map padding for fit bounds
 */
export const MAP_PADDING = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
} as const;

/**
 * Light theme style overrides
 */
export const lightThemeOverrides: Partial<StyleSpecification> = {
  // Override specific layers for light theme
};

/**
 * Dark theme style overrides
 */
export const darkThemeOverrides: Partial<StyleSpecification> = {
  // Override specific layers for dark theme
};

/**
 * Get map style URL based on theme
 */
export function getMapStyle(theme: 'light' | 'dark'): string {
  return theme === 'dark' ? TILE_SOURCES.openFreeMapDark : TILE_SOURCES.openFreeMapLight;
}

/**
 * Platform colors for markers
 */
export const PLATFORM_MARKER_COLORS: Record<string, string> = {
  doordash: '#FF3008',
  ubereats: '#06C167',
  instacart: '#43B02A',
  amazon: '#FF9900',
  amazon_fresh: '#FF9900',
  walmart: '#0071DC',
  shipt: '#00A859',
  costco: '#E31837',
  samsclub: '#0067A0',
  totalwine: '#6D2C41',
  drizly: '#6B46C1',
} as const;

/**
 * Status colors for markers
 */
export const STATUS_MARKER_COLORS: Record<string, string> = {
  preparing: '#64748B',
  ready_for_pickup: '#64748B',
  driver_assigned: '#06B6D4',
  driver_heading_to_store: '#06B6D4',
  driver_at_store: '#06B6D4',
  out_for_delivery: '#06B6D4',
  arriving: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
  delayed: '#F59E0B',
} as const;

/**
 * Get marker color for a platform
 */
export function getPlatformMarkerColor(platform: string): string {
  return PLATFORM_MARKER_COLORS[platform] ?? '#06B6D4';
}

/**
 * Get marker color for a status
 */
export function getStatusMarkerColor(status: string): string {
  return STATUS_MARKER_COLORS[status] ?? '#64748B';
}

/**
 * Map bounds configuration
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Calculate bounds from coordinates
 */
export function calculateBounds(
  coordinates: Array<{ lat: number; lng: number }>
): MapBounds | null {
  if (coordinates.length === 0) return null;

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const coord of coordinates) {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  }

  return { north, south, east, west };
}

/**
 * Calculate center from bounds
 */
export function boundsCenter(bounds: MapBounds): [number, number] {
  return [(bounds.east + bounds.west) / 2, (bounds.north + bounds.south) / 2];
}
