'use client';

import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  getMapStyle,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ANIMATION,
  MAP_PADDING,
  type MapBounds,
} from '@/lib/maps/config';

/**
 * MapContainer props
 */
interface MapContainerProps {
  /** Initial center coordinates [lng, lat] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show loading skeleton */
  showLoading?: boolean;
  /** Show zoom controls */
  showZoomControls?: boolean;
  /** Show fullscreen control */
  showFullscreenControl?: boolean;
  /** Map ready callback */
  onMapReady?: (map: maplibregl.Map) => void;
  /** Bounds to fit */
  bounds?: MapBounds;
  /** Children (markers, etc.) */
  children?: React.ReactNode;
}

/**
 * MapContainer component
 * Wrapper for MapLibre GL JS with loading states and theme support
 */
export function MapContainer({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className,
  showLoading = true,
  showZoomControls = true,
  showFullscreenControl = false,
  onMapReady,
  bounds,
  children,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  /**
   * Initialize map
   */
  useEffect(() => {
    if (!mapContainer.current) return;

    const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: getMapStyle(theme),
        center,
        zoom,
        attributionControl: false,
      });

      // Add attribution in bottom right
      map.current.addControl(
        new maplibregl.AttributionControl({
          compact: true,
        }),
        'bottom-right'
      );

      // Add navigation controls if enabled
      if (showZoomControls) {
        map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      }

      // Add fullscreen control if enabled
      if (showFullscreenControl) {
        map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');
      }

      // Handle map load
      map.current.on('load', () => {
        setIsLoading(false);
        onMapReady?.(map.current!);
      });

      // Handle errors
      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [center, zoom, showZoomControls, showFullscreenControl, onMapReady, resolvedTheme]);

  /**
   * Update map style on theme change
   */
  useEffect(() => {
    if (!map.current) return;

    const theme = resolvedTheme === 'dark' ? 'dark' : 'light';
    const newStyle = getMapStyle(theme);
    const currentStyle = (map.current.getStyle()?.metadata as Record<string, unknown>)?.['mapbox:origin'];

    if (currentStyle !== newStyle) {
      map.current.setStyle(newStyle);
    }
  }, [resolvedTheme]);

  /**
   * Fit bounds when provided
   */
  useEffect(() => {
    if (!map.current || !bounds) return;

    map.current.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      {
        padding: MAP_PADDING,
        duration: ANIMATION.flyTo,
      }
    );
  }, [bounds]);

  return (
    <div className={cn('map-container relative', className)}>
      {/* Loading skeleton */}
      {showLoading && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500 dark:text-slate-400">Loading map...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-slate-500 dark:text-slate-400">{error}</span>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg" />

      {/* Children (for markers via context) */}
      {children}
    </div>
  );
}

export type { MapContainerProps };
