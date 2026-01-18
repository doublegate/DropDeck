'use client';

import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { interpolateLocation } from '@/lib/adapters/utils';
import { ANIMATION, getPlatformMarkerColor } from '@/lib/maps/config';
import type { DeliveryStatus, DriverLocation } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * DeliveryMarker props
 */
interface DeliveryMarkerProps {
  /** MapLibre map instance */
  map: maplibregl.Map | null;
  /** Driver location */
  location: DriverLocation;
  /** Platform for styling */
  platform: Platform;
  /** Delivery status */
  status: DeliveryStatus;
  /** Driver name (optional) */
  driverName?: string;
  /** ETA in minutes */
  etaMinutes?: number;
  /** Delivery ID for identification */
  deliveryId: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether this delivery is the selected/focused one */
  isSelected?: boolean;
}

/**
 * Easing function: ease-out cubic
 */
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Get status badge color based on status
 */
function getStatusColor(status: DeliveryStatus): string {
  const statusColors: Record<DeliveryStatus, string> = {
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
  };
  return statusColors[status] ?? '#64748B';
}

/**
 * Create platform-specific icon SVG
 */
function createPlatformIcon(_platform: Platform): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.style.width = '20px';
  svg.style.height = '20px';

  // Car icon path
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z'
  );
  svg.appendChild(path);

  return svg;
}

/**
 * DeliveryMarker component
 * Platform-branded marker with status badge and smooth animations
 * Design System compliant: 32x32px white bg, 4px border-radius, 2px shadow
 */
export function DeliveryMarker({
  map,
  location,
  platform,
  status,
  driverName,
  etaMinutes,
  deliveryId,
  onClick,
  isSelected: _isSelected = false,
}: DeliveryMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousLocationRef = useRef(location);
  const [_isHovered, setIsHovered] = useState(false);

  const platformColor = useMemo(() => getPlatformMarkerColor(platform), [platform]);
  const statusColor = useMemo(() => getStatusColor(status), [status]);

  // Determine if this delivery should pulse (active and in transit)
  const shouldPulse = useMemo(() => {
    const activeStatuses: DeliveryStatus[] = [
      'driver_assigned',
      'driver_heading_to_store',
      'driver_at_store',
      'out_for_delivery',
      'arriving',
    ];
    return activeStatuses.includes(status);
  }, [status]);

  /**
   * Create marker element with Design System styling
   */
  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'delivery-marker';
    el.setAttribute('data-delivery-id', deliveryId);

    const container = document.createElement('div');
    container.className = 'delivery-marker-container';
    container.style.position = 'relative';
    container.style.width = '40px';
    container.style.height = '40px';
    container.style.cursor = 'pointer';

    // Pulse animation for active deliveries
    if (shouldPulse) {
      const pulse = document.createElement('div');
      pulse.className = 'delivery-marker-pulse';
      pulse.style.position = 'absolute';
      pulse.style.inset = '-8px';
      pulse.style.background = '#06B6D4'; // Drop Cyan
      pulse.style.borderRadius = '50%';
      pulse.style.opacity = '0.3';
      pulse.style.animation = 'delivery-pulse 2s ease-out infinite';
      container.appendChild(pulse);
    }

    // Main icon container (Design System: 32x32px white bg, 4px border-radius)
    const iconContainer = document.createElement('div');
    iconContainer.className = 'delivery-marker-icon';
    iconContainer.style.position = 'relative';
    iconContainer.style.width = '32px';
    iconContainer.style.height = '32px';
    iconContainer.style.margin = '4px';
    iconContainer.style.background = '#FFFFFF';
    iconContainer.style.borderRadius = '4px';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
    iconContainer.style.color = platformColor;
    iconContainer.style.transition = 'transform 150ms ease-out, box-shadow 150ms ease-out';
    iconContainer.style.border = `2px solid ${platformColor}`;

    // Platform icon
    iconContainer.appendChild(createPlatformIcon(platform));
    container.appendChild(iconContainer);

    // Status badge
    const statusBadge = document.createElement('div');
    statusBadge.className = 'delivery-marker-status';
    statusBadge.style.position = 'absolute';
    statusBadge.style.top = '-4px';
    statusBadge.style.right = '-4px';
    statusBadge.style.width = '12px';
    statusBadge.style.height = '12px';
    statusBadge.style.background = statusColor;
    statusBadge.style.borderRadius = '50%';
    statusBadge.style.border = '2px solid white';
    statusBadge.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
    container.appendChild(statusBadge);

    // Hover tooltip with driver info
    const tooltip = document.createElement('div');
    tooltip.className = 'delivery-marker-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '100%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.marginBottom = '8px';
    tooltip.style.padding = '8px 12px';
    tooltip.style.background = 'white';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '12px';
    tooltip.style.fontWeight = '500';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    tooltip.style.opacity = '0';
    tooltip.style.visibility = 'hidden';
    tooltip.style.transition = 'opacity 150ms ease-out, visibility 150ms ease-out';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '100';

    // Tooltip content
    const tooltipContent = document.createElement('div');
    tooltipContent.style.display = 'flex';
    tooltipContent.style.flexDirection = 'column';
    tooltipContent.style.gap = '4px';

    if (driverName) {
      const nameRow = document.createElement('div');
      nameRow.style.color = '#1E293B';
      nameRow.style.fontWeight = '600';
      nameRow.textContent = driverName;
      tooltipContent.appendChild(nameRow);
    }

    if (etaMinutes !== undefined) {
      const etaRow = document.createElement('div');
      etaRow.style.color = '#06B6D4';
      etaRow.style.fontSize = '14px';
      etaRow.style.fontWeight = '700';
      etaRow.textContent = etaMinutes < 1 ? 'Arriving now' : `${etaMinutes} min`;
      tooltipContent.appendChild(etaRow);
    }

    tooltip.appendChild(tooltipContent);

    // Tooltip arrow
    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.top = '100%';
    arrow.style.left = '50%';
    arrow.style.transform = 'translateX(-50%)';
    arrow.style.width = '0';
    arrow.style.height = '0';
    arrow.style.borderLeft = '6px solid transparent';
    arrow.style.borderRight = '6px solid transparent';
    arrow.style.borderTop = '6px solid white';
    tooltip.appendChild(arrow);

    container.appendChild(tooltip);
    el.appendChild(container);

    // Add keyframe animation via style element
    const style = document.createElement('style');
    style.textContent = `
      @keyframes delivery-pulse {
        0% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(2); opacity: 0; }
      }
    `;
    el.appendChild(style);

    // Hover effects
    container.addEventListener('mouseenter', () => {
      iconContainer.style.transform = 'scale(1.1)';
      iconContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.25)';
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      setIsHovered(true);
    });

    container.addEventListener('mouseleave', () => {
      iconContainer.style.transform = 'scale(1)';
      iconContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
      setIsHovered(false);
    });

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    return el;
  }, [
    platformColor,
    statusColor,
    shouldPulse,
    driverName,
    etaMinutes,
    deliveryId,
    onClick,
    platform,
  ]);

  /**
   * Initialize marker
   */
  useEffect(() => {
    if (!map) return;

    const el = createMarkerElement();

    markerRef.current = new maplibregl.Marker({
      element: el,
      anchor: 'center',
      rotationAlignment: 'map',
    })
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    if (location.heading !== undefined) {
      markerRef.current.setRotation(location.heading);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [map, createMarkerElement, location.lng, location.lat, location.heading]);

  /**
   * Animate marker to new location with 60fps smooth interpolation
   */
  useEffect(() => {
    if (!markerRef.current || !map) return;

    const previousLocation = previousLocationRef.current;
    const startTime = performance.now();
    const duration = ANIMATION.markerMove;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const interpolated = interpolateLocation(
        { lat: previousLocation.lat, lng: previousLocation.lng },
        { lat: location.lat, lng: location.lng },
        eased
      );

      markerRef.current?.setLngLat([interpolated.lng, interpolated.lat]);

      // Interpolate heading for smooth rotation
      if (location.heading !== undefined && previousLocation.heading !== undefined) {
        const headingDiff = location.heading - previousLocation.heading;
        // Handle wrap-around (e.g., 350 -> 10)
        const adjustedDiff =
          headingDiff > 180
            ? headingDiff - 360
            : headingDiff < -180
              ? headingDiff + 360
              : headingDiff;
        const interpolatedHeading = previousLocation.heading + adjustedDiff * eased;
        markerRef.current?.setRotation(interpolatedHeading);
      } else if (location.heading !== undefined) {
        markerRef.current?.setRotation(location.heading);
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousLocationRef.current = location;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [location, map]);

  return null;
}

export type { DeliveryMarkerProps };
