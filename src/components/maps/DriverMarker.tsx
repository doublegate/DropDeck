'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import { getPlatformMarkerColor, ANIMATION } from '@/lib/maps/config';
import { interpolateLocation } from '@/lib/adapters/utils';
import type { Platform } from '@/types/platform';
import type { DriverLocation } from '@/types/delivery';

/**
 * DriverMarker props
 */
interface DriverMarkerProps {
  /** MapLibre map instance */
  map: maplibregl.Map | null;
  /** Driver location */
  location: DriverLocation;
  /** Platform for styling */
  platform: Platform;
  /** Driver name (optional) */
  driverName?: string;
  /** Show pulse animation */
  showPulse?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Create SVG element for car icon
 */
function createCarSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'currentColor');
  svg.style.width = '24px';
  svg.style.height = '24px';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z'
  );
  svg.appendChild(path);

  return svg;
}

/**
 * DriverMarker component
 * Animated marker showing driver location with platform-specific styling
 */
export function DriverMarker({
  map,
  location,
  platform,
  driverName,
  showPulse = true,
  onClick,
}: DriverMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousLocationRef = useRef(location);

  const platformColor = useMemo(() => getPlatformMarkerColor(platform), [platform]);

  /**
   * Create marker element using DOM methods
   */
  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'driver-marker';

    const container = document.createElement('div');
    container.className = 'driver-marker-container';
    container.style.setProperty('--platform-color', platformColor);
    container.style.position = 'relative';
    container.style.width = '40px';
    container.style.height = '40px';
    container.style.cursor = 'pointer';

    // Pulse element
    if (showPulse) {
      const pulse = document.createElement('div');
      pulse.className = 'driver-marker-pulse';
      pulse.style.position = 'absolute';
      pulse.style.inset = '-8px';
      pulse.style.background = platformColor;
      pulse.style.borderRadius = '50%';
      pulse.style.opacity = '0.3';
      pulse.style.animation = 'driver-pulse 2s ease-out infinite';
      container.appendChild(pulse);
    }

    // Icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'driver-marker-icon';
    iconContainer.style.position = 'relative';
    iconContainer.style.width = '40px';
    iconContainer.style.height = '40px';
    iconContainer.style.background = platformColor;
    iconContainer.style.borderRadius = '50%';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    iconContainer.style.color = 'white';
    iconContainer.style.transition = 'transform 0.2s ease';

    iconContainer.appendChild(createCarSvg());
    container.appendChild(iconContainer);

    // Driver name label
    if (driverName) {
      const label = document.createElement('div');
      label.className = 'driver-marker-label';
      label.style.position = 'absolute';
      label.style.top = '100%';
      label.style.left = '50%';
      label.style.transform = 'translateX(-50%)';
      label.style.marginTop = '4px';
      label.style.padding = '2px 8px';
      label.style.background = 'white';
      label.style.borderRadius = '4px';
      label.style.fontSize = '12px';
      label.style.fontWeight = '500';
      label.style.whiteSpace = 'nowrap';
      label.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2)';
      label.textContent = driverName;
      container.appendChild(label);
    }

    el.appendChild(container);

    // Add keyframe animation via style element
    const style = document.createElement('style');
    style.textContent = `
      @keyframes driver-pulse {
        0% { transform: scale(0.8); opacity: 0.5; }
        100% { transform: scale(2); opacity: 0; }
      }
    `;
    el.appendChild(style);

    // Hover effect
    container.addEventListener('mouseenter', () => {
      iconContainer.style.transform = 'scale(1.1)';
    });
    container.addEventListener('mouseleave', () => {
      iconContainer.style.transform = 'scale(1)';
    });

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    return el;
  }, [platformColor, showPulse, driverName, onClick]);

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
   * Animate marker to new location
   */
  useEffect(() => {
    if (!markerRef.current || !map) return;

    const previousLocation = previousLocationRef.current;
    const startTime = performance.now();
    const duration = ANIMATION.markerMove;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;

      const interpolated = interpolateLocation(
        { lat: previousLocation.lat, lng: previousLocation.lng },
        { lat: location.lat, lng: location.lng },
        eased
      );

      markerRef.current?.setLngLat([interpolated.lng, interpolated.lat]);

      if (location.heading !== undefined && previousLocation.heading !== undefined) {
        const headingDiff = location.heading - previousLocation.heading;
        const interpolatedHeading = previousLocation.heading + headingDiff * eased;
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

export type { DriverMarkerProps };
