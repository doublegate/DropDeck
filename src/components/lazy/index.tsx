'use client';

/**
 * Lazy-loaded components for code splitting
 * Sprint 5.3 - Performance Optimizations
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading fallback for map components
 */
function MapLoadingFallback() {
  return (
    <div className="w-full h-full min-h-[300px] bg-[var(--dd-bg-secondary)] rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--dd-text-muted)]">Loading map...</span>
      </div>
    </div>
  );
}

/**
 * Loading fallback for notification components
 */
function NotificationLoadingFallback() {
  return (
    <div className="p-4 space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/**
 * Loading fallback for settings components
 */
function SettingsLoadingFallback() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * Loading fallback for delivery list
 */
function DeliveryListLoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

/**
 * Lazy-loaded LiveTrackingMap component
 * Heavy component with MapLibre GL - loaded on demand
 */
export const LazyLiveTrackingMap = dynamic(
  () => import('@/components/map/live-tracking-map').then((mod) => mod.LiveTrackingMap),
  {
    loading: MapLoadingFallback,
    ssr: false, // MapLibre requires browser APIs
  }
);

/**
 * Lazy-loaded MapContainer component
 */
export const LazyMapContainer = dynamic(
  () => import('@/components/maps/MapContainer').then((mod) => mod.MapContainer),
  {
    loading: MapLoadingFallback,
    ssr: false,
  }
);

/**
 * Lazy-loaded NotificationCenter component
 */
export const LazyNotificationCenter = dynamic(
  () =>
    import('@/components/notifications/notification-center').then((mod) => mod.NotificationCenter),
  {
    loading: NotificationLoadingFallback,
    ssr: false, // Uses Ably which requires browser APIs
  }
);

/**
 * Lazy-loaded NotificationList component
 */
export const LazyNotificationList = dynamic(
  () => import('@/components/notifications/notification-list').then((mod) => mod.NotificationList),
  {
    loading: NotificationLoadingFallback,
  }
);

/**
 * Lazy-loaded NotificationPreferences component
 */
export const LazyNotificationPreferences = dynamic(
  () =>
    import('@/components/notifications/notification-preferences').then(
      (mod) => mod.NotificationPreferences
    ),
  {
    loading: SettingsLoadingFallback,
  }
);

/**
 * Lazy-loaded VirtualizedDeliveryList component
 */
export const LazyVirtualizedDeliveryList = dynamic(
  () =>
    import('@/components/delivery/virtualized-delivery-list').then(
      (mod) => mod.VirtualizedDeliveryList
    ),
  {
    loading: DeliveryListLoadingFallback,
  }
);

/**
 * Lazy-loaded SmartDeliveryList component
 */
export const LazySmartDeliveryList = dynamic(
  () =>
    import('@/components/delivery/virtualized-delivery-list').then((mod) => mod.SmartDeliveryList),
  {
    loading: DeliveryListLoadingFallback,
  }
);

/**
 * Lazy-loaded ETATimeline component
 */
export const LazyETATimeline = dynamic(
  () => import('@/components/delivery/eta-timeline').then((mod) => mod.ETATimeline),
  {
    loading: () => <Skeleton className="h-24 w-full" />,
  }
);

/**
 * Lazy-loaded DeliveryStats component
 */
export const LazyDeliveryStats = dynamic(
  () => import('@/components/delivery/delivery-stats').then((mod) => mod.DeliveryStats),
  {
    loading: () => (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    ),
  }
);

/**
 * Preload a lazy component before it's needed
 */
export function preloadComponent(
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic components require flexible typing
  component: { preload?: () => void } & React.ComponentType<any>
) {
  if (component.preload) {
    component.preload();
  }
}

/**
 * Preload map components when user hovers over relevant UI
 */
export function preloadMapComponents() {
  preloadComponent(LazyLiveTrackingMap);
  preloadComponent(LazyMapContainer);
}

/**
 * Preload notification components
 */
export function preloadNotificationComponents() {
  preloadComponent(LazyNotificationCenter);
  preloadComponent(LazyNotificationList);
}
