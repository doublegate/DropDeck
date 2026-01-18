'use client';

import maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef } from 'react';

/**
 * DestinationMarker props
 */
interface DestinationMarkerProps {
  /** MapLibre map instance */
  map: maplibregl.Map | null;
  /** Destination coordinates */
  location: { lat: number; lng: number };
  /** Delivery address */
  address: string;
  /** Address type icon */
  addressType?: 'home' | 'work' | 'other';
  /** Delivery instructions preview */
  instructions?: string;
  /** Click handler */
  onClick?: () => void;
  /** Delivery ID for identification */
  deliveryId: string;
}

/**
 * Create icon based on address type
 */
function createAddressIcon(type: 'home' | 'work' | 'other'): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.style.width = '16px';
  svg.style.height = '16px';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  switch (type) {
    case 'home': {
      // Home icon
      path.setAttribute('d', 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z');
      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '9 22 9 12 15 12 15 22');
      svg.appendChild(path);
      svg.appendChild(polyline);
      break;
    }
    case 'work':
      // Briefcase icon
      path.setAttribute(
        'd',
        'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'
      );
      svg.appendChild(path);
      break;
    default: {
      // Map pin icon
      path.setAttribute('d', 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '10');
      circle.setAttribute('r', '3');
      svg.appendChild(path);
      svg.appendChild(circle);
      break;
    }
  }

  return svg;
}

/**
 * DestinationMarker component
 * Shows the delivery destination with address and instructions
 */
export function DestinationMarker({
  map,
  location,
  address,
  addressType = 'other',
  instructions,
  onClick,
  deliveryId,
}: DestinationMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);

  /**
   * Create marker element
   */
  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'destination-marker';
    el.setAttribute('data-delivery-id', deliveryId);

    const container = document.createElement('div');
    container.className = 'destination-marker-container';
    container.style.position = 'relative';
    container.style.cursor = 'pointer';

    // Pin shape container
    const pin = document.createElement('div');
    pin.className = 'destination-marker-pin';
    pin.style.width = '36px';
    pin.style.height = '44px';
    pin.style.position = 'relative';

    // Pin body (rounded rectangle with point at bottom)
    const pinBody = document.createElement('div');
    pinBody.style.position = 'absolute';
    pinBody.style.top = '0';
    pinBody.style.left = '0';
    pinBody.style.width = '36px';
    pinBody.style.height = '36px';
    pinBody.style.background = '#10B981'; // Signal Green
    pinBody.style.borderRadius = '50% 50% 50% 0';
    pinBody.style.transform = 'rotate(-45deg)';
    pinBody.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    pinBody.style.transition = 'transform 150ms ease-out, box-shadow 150ms ease-out';
    pin.appendChild(pinBody);

    // Icon container (rotated back to upright)
    const iconContainer = document.createElement('div');
    iconContainer.style.position = 'absolute';
    iconContainer.style.top = '0';
    iconContainer.style.left = '0';
    iconContainer.style.width = '36px';
    iconContainer.style.height = '36px';
    iconContainer.style.display = 'flex';
    iconContainer.style.alignItems = 'center';
    iconContainer.style.justifyContent = 'center';
    iconContainer.style.color = 'white';
    iconContainer.appendChild(createAddressIcon(addressType));
    pin.appendChild(iconContainer);

    container.appendChild(pin);

    // Tooltip with address and instructions
    const tooltip = document.createElement('div');
    tooltip.className = 'destination-marker-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.bottom = '100%';
    tooltip.style.left = '50%';
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.style.marginBottom = '8px';
    tooltip.style.padding = '10px 14px';
    tooltip.style.background = 'white';
    tooltip.style.borderRadius = '8px';
    tooltip.style.fontSize = '12px';
    tooltip.style.maxWidth = '200px';
    tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    tooltip.style.opacity = '0';
    tooltip.style.visibility = 'hidden';
    tooltip.style.transition = 'opacity 150ms ease-out, visibility 150ms ease-out';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '100';

    // Address
    const addressEl = document.createElement('div');
    addressEl.style.color = '#1E293B';
    addressEl.style.fontWeight = '500';
    addressEl.style.marginBottom = instructions ? '6px' : '0';
    addressEl.style.lineHeight = '1.4';
    addressEl.textContent = address;
    tooltip.appendChild(addressEl);

    // Instructions (if any)
    if (instructions) {
      const instructionsEl = document.createElement('div');
      instructionsEl.style.color = '#64748B';
      instructionsEl.style.fontSize = '11px';
      instructionsEl.style.lineHeight = '1.4';
      instructionsEl.style.borderTop = '1px solid #E2E8F0';
      instructionsEl.style.paddingTop = '6px';
      instructionsEl.textContent =
        instructions.length > 80 ? `${instructions.slice(0, 80)}...` : instructions;
      tooltip.appendChild(instructionsEl);
    }

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

    // Hover effects
    container.addEventListener('mouseenter', () => {
      pinBody.style.transform = 'rotate(-45deg) scale(1.1)';
      pinBody.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.35)';
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
    });

    container.addEventListener('mouseleave', () => {
      pinBody.style.transform = 'rotate(-45deg) scale(1)';
      pinBody.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    });

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    return el;
  }, [address, addressType, instructions, deliveryId, onClick]);

  /**
   * Initialize marker
   */
  useEffect(() => {
    if (!map) return;

    const el = createMarkerElement();

    markerRef.current = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
    };
  }, [map, createMarkerElement, location.lat, location.lng]);

  return null;
}

export type { DestinationMarkerProps };
