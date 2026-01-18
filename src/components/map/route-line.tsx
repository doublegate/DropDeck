'use client';

import type maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import { getPlatformMarkerColor } from '@/lib/maps/config';
import type { Platform } from '@/types/platform';

/**
 * RouteLine props
 */
interface RouteLineProps {
  /** MapLibre map instance */
  map: maplibregl.Map | null;
  /** Route coordinates (ordered from start to end) */
  coordinates: Array<[number, number]>; // [lng, lat]
  /** Platform for color styling */
  platform: Platform;
  /** Delivery ID for identification */
  deliveryId: string;
  /** Line opacity (0-1) */
  opacity?: number;
  /** Line width in pixels */
  lineWidth?: number;
}

/**
 * RouteLine component
 * Draws a route polyline between driver and destination
 */
export function RouteLine({
  map,
  coordinates,
  platform,
  deliveryId,
  opacity = 0.8,
  lineWidth = 4,
}: RouteLineProps) {
  const sourceIdRef = useRef(`route-${deliveryId}`);
  const layerIdRef = useRef(`route-line-${deliveryId}`);
  const casingLayerIdRef = useRef(`route-casing-${deliveryId}`);

  useEffect(() => {
    if (!map || coordinates.length < 2) return;

    const sourceId = sourceIdRef.current;
    const layerId = layerIdRef.current;
    const casingLayerId = casingLayerIdRef.current;
    const platformColor = getPlatformMarkerColor(platform);

    // Wait for map to be loaded
    const addRoute = () => {
      // Remove existing layers/source if they exist
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getLayer(casingLayerId)) {
        map.removeLayer(casingLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      // Add casing layer (outline) - adds depth
      map.addLayer({
        id: casingLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#000000',
          'line-width': lineWidth + 2,
          'line-opacity': opacity * 0.2,
        },
      });

      // Add main route layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': platformColor,
          'line-width': lineWidth,
          'line-opacity': opacity,
        },
      });
    };

    if (map.isStyleLoaded()) {
      addRoute();
    } else {
      map.on('load', addRoute);
    }

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getLayer(casingLayerId)) {
        map.removeLayer(casingLayerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliveryId only used for refs initialized on mount
  }, [map, coordinates, platform, opacity, lineWidth]);

  // Update coordinates when they change
  useEffect(() => {
    if (!map || coordinates.length < 2) return;

    const sourceId = sourceIdRef.current;
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;

    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }
  }, [map, coordinates]);

  return null;
}

export type { RouteLineProps };
