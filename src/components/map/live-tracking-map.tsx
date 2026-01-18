'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { MapContainer } from '@/components/maps/MapContainer';
import { DeliveryMarker } from './delivery-marker';
import { DestinationMarker } from './destination-marker';
import { RouteLine } from './route-line';
import { ConnectionStatusIndicator } from './connection-status-indicator';
import { useRealTimeUpdates, type ConnectionState } from '@/hooks/use-realtime';
import { calculateBounds } from '@/lib/maps/config';
import type { UnifiedDelivery, DriverLocation } from '@/types/delivery';
import type { LocationUpdateEvent, DeliveryUpdateEvent } from '@/lib/realtime/events';

/**
 * LiveTrackingMap props
 */
interface LiveTrackingMapProps {
  /** User ID for real-time subscriptions (required when not providing deliveries externally) */
  userId?: string;
  /** Initial deliveries to display (used when component manages own state) */
  initialDeliveries?: UnifiedDelivery[];
  /** Externally managed deliveries (takes precedence over internal state) */
  deliveries?: UnifiedDelivery[];
  /** Callback when a delivery is selected */
  onDeliverySelect?: (delivery: UnifiedDelivery) => void;
  /** Currently selected delivery ID */
  selectedDeliveryId?: string | null;
  /** Additional CSS classes */
  className?: string;
  /** Show connection status indicator */
  showConnectionStatus?: boolean;
  /** Auto-fit bounds when deliveries change */
  autoFitBounds?: boolean;
}

/**
 * LiveTrackingMap component
 * Full-featured map with real-time driver tracking, routes, and multi-delivery support
 */
export function LiveTrackingMap({
  userId,
  initialDeliveries = [],
  deliveries: externalDeliveries,
  onDeliverySelect,
  selectedDeliveryId,
  className,
  showConnectionStatus = true,
  autoFitBounds = false,
}: LiveTrackingMapProps) {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [internalDeliveries, setInternalDeliveries] =
    useState<UnifiedDelivery[]>(initialDeliveries);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // Use external deliveries if provided, otherwise use internal state
  const deliveries = externalDeliveries ?? internalDeliveries;

  // Track driver locations separately for smooth animations
  const [driverLocations, setDriverLocations] = useState<Map<string, DriverLocation>>(new Map());

  // Ref to track if we need to fit bounds
  const shouldFitBoundsRef = useRef(true);
  const prevDeliveriesLengthRef = useRef(deliveries.length);

  /**
   * Handle delivery updates from real-time subscription
   */
  const handleDeliveryUpdate = useCallback((event: DeliveryUpdateEvent) => {
    setInternalDeliveries((prev) => {
      const index = prev.findIndex((d) => d.id === event.payload.deliveryId);
      if (index === -1) {
        // New delivery - would need to fetch full data via API
        return prev;
      }

      // Update existing delivery status
      const updated = [...prev];
      const existing = updated[index];
      if (!existing) return prev;

      updated[index] = {
        ...existing,
        status: event.payload.status as UnifiedDelivery['status'],
        statusLabel: event.payload.statusLabel,
        eta: event.payload.eta
          ? {
              ...existing.eta,
              minutesRemaining: event.payload.eta,
            }
          : existing.eta,
      };
      return updated;
    });
  }, []);

  /**
   * Handle location updates from real-time subscription
   */
  const handleLocationUpdate = useCallback((event: LocationUpdateEvent) => {
    const { deliveryId, location } = event.payload;

    setDriverLocations((prev) => {
      const newMap = new Map(prev);
      newMap.set(deliveryId, {
        lat: location.lat,
        lng: location.lng,
        heading: location.heading,
        speed: location.speed,
        accuracy: location.accuracy,
        timestamp: new Date(location.timestamp),
      });
      return newMap;
    });

    // Also update the delivery object
    setInternalDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId && d.driver
          ? {
              ...d,
              driver: {
                ...d.driver,
                location: {
                  lat: location.lat,
                  lng: location.lng,
                  heading: location.heading,
                  speed: location.speed,
                  accuracy: location.accuracy,
                  timestamp: new Date(location.timestamp),
                },
              },
            }
          : d
      )
    );
  }, []);

  /**
   * Handle connection state changes
   */
  const handleStateChange = useCallback((state: ConnectionState) => {
    setConnectionState(state);
  }, []);

  // Set up real-time subscriptions (only when managing internal state)
  const { isConnected: _isConnected } = useRealTimeUpdates({
    userId: userId ?? 'anonymous',
    onDeliveryUpdate: externalDeliveries ? undefined : handleDeliveryUpdate,
    onLocationUpdate: externalDeliveries ? undefined : handleLocationUpdate,
    onStateChange: handleStateChange,
    debug: process.env.NODE_ENV === 'development',
    enabled: !externalDeliveries && !!userId,
  });

  /**
   * Initialize driver locations from deliveries
   */
  useEffect(() => {
    const locationMap = new Map<string, DriverLocation>();
    for (const delivery of deliveries) {
      if (delivery.driver?.location) {
        locationMap.set(delivery.id, delivery.driver.location);
      }
    }
    setDriverLocations(locationMap);

    // If not using external deliveries, also update internal state from initial
    if (!externalDeliveries) {
      setInternalDeliveries(initialDeliveries);
    }
  }, [deliveries, externalDeliveries, initialDeliveries]);

  /**
   * Calculate bounds to fit all markers
   */
  const bounds = useMemo(() => {
    if (deliveries.length === 0) return null;

    const coordinates: Array<{ lat: number; lng: number }> = [];

    for (const delivery of deliveries) {
      // Add destination
      coordinates.push({
        lat: delivery.destination.lat,
        lng: delivery.destination.lng,
      });

      // Add driver location
      const driverLocation = driverLocations.get(delivery.id);
      if (driverLocation) {
        coordinates.push({
          lat: driverLocation.lat,
          lng: driverLocation.lng,
        });
      }
    }

    return calculateBounds(coordinates);
  }, [deliveries, driverLocations]);

  /**
   * Fit bounds on initial load or when deliveries change significantly
   */
  useEffect(() => {
    if (!map || !bounds) return;

    // Fit bounds on initial load or when autoFitBounds is enabled and deliveries count changed
    const shouldFit =
      shouldFitBoundsRef.current ||
      (autoFitBounds && deliveries.length !== prevDeliveriesLengthRef.current);

    if (!shouldFit) return;

    map.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 1000,
      }
    );

    // Track that we've done initial fit
    shouldFitBoundsRef.current = false;
    prevDeliveriesLengthRef.current = deliveries.length;
  }, [map, bounds, autoFitBounds, deliveries.length]);

  /**
   * Handle map ready
   */
  const handleMapReady = useCallback((mapInstance: maplibregl.Map) => {
    setMap(mapInstance);
  }, []);

  /**
   * Handle delivery marker click
   */
  const handleDeliveryClick = useCallback(
    (delivery: UnifiedDelivery) => {
      onDeliverySelect?.(delivery);
    },
    [onDeliverySelect]
  );

  /**
   * Get route coordinates from driver to destination
   * In a real app, this would come from a routing API
   */
  const getRouteCoordinates = useCallback(
    (delivery: UnifiedDelivery): Array<[number, number]> | null => {
      const driverLocation = driverLocations.get(delivery.id);
      if (!driverLocation) return null;

      // Simple straight line for now
      // In production, use a routing API like OSRM or Mapbox Directions
      return [
        [driverLocation.lng, driverLocation.lat],
        [delivery.destination.lng, delivery.destination.lat],
      ];
    },
    [driverLocations]
  );

  // Filter active deliveries (not delivered or cancelled)
  const activeDeliveries = useMemo(
    () => deliveries.filter((d) => d.status !== 'delivered' && d.status !== 'cancelled'),
    [deliveries]
  );

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        className="w-full h-full min-h-[300px]"
        showZoomControls
        showFullscreenControl
        onMapReady={handleMapReady}
      >
        {/* Route lines (rendered first so they're below markers) */}
        {activeDeliveries.map((delivery) => {
          const routeCoords = getRouteCoordinates(delivery);
          if (!routeCoords) return null;

          return (
            <RouteLine
              key={`route-${delivery.id}`}
              map={map}
              coordinates={routeCoords}
              platform={delivery.platform}
              deliveryId={delivery.id}
              opacity={selectedDeliveryId === delivery.id ? 1 : 0.5}
            />
          );
        })}

        {/* Destination markers */}
        {activeDeliveries.map((delivery) => (
          <DestinationMarker
            key={`dest-${delivery.id}`}
            map={map}
            location={{
              lat: delivery.destination.lat,
              lng: delivery.destination.lng,
            }}
            address={delivery.destination.address}
            instructions={delivery.destination.instructions}
            deliveryId={delivery.id}
            onClick={() => handleDeliveryClick(delivery)}
          />
        ))}

        {/* Driver markers */}
        {activeDeliveries.map((delivery) => {
          const driverLocation = driverLocations.get(delivery.id);
          if (!driverLocation) return null;

          return (
            <DeliveryMarker
              key={`driver-${delivery.id}`}
              map={map}
              location={driverLocation}
              platform={delivery.platform}
              status={delivery.status}
              driverName={delivery.driver?.name}
              etaMinutes={delivery.eta.minutesRemaining}
              deliveryId={delivery.id}
              isSelected={selectedDeliveryId === delivery.id}
              onClick={() => handleDeliveryClick(delivery)}
            />
          );
        })}
      </MapContainer>

      {/* Connection status indicator */}
      {showConnectionStatus && (
        <ConnectionStatusIndicator state={connectionState} className="absolute top-4 left-4" />
      )}

      {/* Delivery count badge */}
      {activeDeliveries.length > 0 && (
        <div className="absolute top-4 right-4 bg-[var(--dd-bg-card)] border border-[var(--dd-border)] rounded-full px-3 py-1 shadow-md">
          <span className="text-sm font-medium text-[var(--dd-text-primary)]">
            {activeDeliveries.length} {activeDeliveries.length === 1 ? 'delivery' : 'deliveries'}
          </span>
        </div>
      )}
    </div>
  );
}

export type { LiveTrackingMapProps };
