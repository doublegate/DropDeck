'use client';

import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

/**
 * DestinationMarker props
 */
interface DestinationMarkerProps {
  /** MapLibre map instance */
  map: maplibregl.Map | null;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Address label (optional) */
  label?: string;
  /** Marker color */
  color?: string;
  /** Show popup on click */
  showPopup?: boolean;
  /** Popup content */
  popupContent?: string;
  /** Click handler */
  onClick?: () => void;
}

/**
 * Create SVG element for pin icon
 */
function createPinSvg(color: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', color);
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.filter = 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute(
    'd',
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
  );
  svg.appendChild(path);

  return svg;
}

/**
 * DestinationMarker component
 * Marker showing delivery destination with optional label and popup
 */
export function DestinationMarker({
  map,
  lat,
  lng,
  label,
  color = '#10B981',
  showPopup = false,
  popupContent,
  onClick,
}: DestinationMarkerProps) {
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  /**
   * Create marker element using DOM methods
   */
  const createMarkerElement = useCallback(() => {
    const el = document.createElement('div');
    el.className = 'destination-marker';

    const container = document.createElement('div');
    container.className = 'destination-marker-container';
    container.style.position = 'relative';
    container.style.width = '32px';
    container.style.cursor = 'pointer';

    // Pin icon
    const pin = document.createElement('div');
    pin.className = 'destination-marker-pin';
    pin.style.width = '32px';
    pin.style.height = '42px';
    pin.style.transition = 'transform 0.2s ease';
    pin.appendChild(createPinSvg(color));
    container.appendChild(pin);

    // Shadow
    const shadow = document.createElement('div');
    shadow.className = 'destination-marker-shadow';
    shadow.style.position = 'absolute';
    shadow.style.bottom = '-4px';
    shadow.style.left = '50%';
    shadow.style.transform = 'translateX(-50%)';
    shadow.style.width = '12px';
    shadow.style.height = '4px';
    shadow.style.background = 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)';
    container.appendChild(shadow);

    // Label
    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'destination-marker-label';
      labelEl.style.position = 'absolute';
      labelEl.style.top = '100%';
      labelEl.style.left = '50%';
      labelEl.style.transform = 'translateX(-50%)';
      labelEl.style.marginTop = '8px';
      labelEl.style.padding = '4px 8px';
      labelEl.style.background = 'white';
      labelEl.style.borderRadius = '4px';
      labelEl.style.fontSize = '11px';
      labelEl.style.fontWeight = '500';
      labelEl.style.whiteSpace = 'nowrap';
      labelEl.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.2)';
      labelEl.style.maxWidth = '150px';
      labelEl.style.overflow = 'hidden';
      labelEl.style.textOverflow = 'ellipsis';
      labelEl.textContent = label;
      container.appendChild(labelEl);
    }

    el.appendChild(container);

    // Hover effect
    container.addEventListener('mouseenter', () => {
      pin.style.transform = 'scale(1.1) translateY(-2px)';
    });
    container.addEventListener('mouseleave', () => {
      pin.style.transform = 'scale(1)';
    });

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    return el;
  }, [label, color, onClick]);

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
      .setLngLat([lng, lat])
      .addTo(map);

    // Add popup if enabled
    if (showPopup && popupContent) {
      const popupEl = document.createElement('div');
      popupEl.className = 'p-2 text-sm';
      popupEl.textContent = popupContent;

      popupRef.current = new maplibregl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false,
      }).setDOMContent(popupEl);

      markerRef.current.setPopup(popupRef.current);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, [map, lat, lng, showPopup, popupContent, createMarkerElement]);

  /**
   * Update marker position
   */
  useEffect(() => {
    markerRef.current?.setLngLat([lng, lat]);
  }, [lat, lng]);

  return null;
}

export type { DestinationMarkerProps };
