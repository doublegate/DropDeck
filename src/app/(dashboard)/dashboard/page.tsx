'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Map as MapIcon, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { DeliveryFilters, DeliveryGrid, DeliveryStats } from '@/components/delivery';
import { LiveTrackingMap } from '@/components/map';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeUpdates } from '@/hooks/use-realtime';
import {
  useDashboardStats,
  useDashboardStore,
  useSortedDeliveries,
} from '@/stores/dashboard-store';
import type { DeliveryStatus, UnifiedDelivery } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * Dashboard Page
 * Unified delivery tracking dashboard with real-time updates
 */
export default function DashboardPage() {
  // Store state
  const {
    deliveries,
    filters,
    sortBy,
    sortOrder,
    viewMode,
    showMap,
    mapExpanded,
    isLoading,
    error,
    selectedDeliveryId,
    expandedDeliveryId,
    // Actions
    setDeliveries,
    updateDelivery,
    togglePlatformFilter,
    toggleStatusFilter,
    setSearchQuery,
    clearFilters,
    setSortBy,
    toggleSortOrder,
    setViewMode,
    toggleMap,
    setMapExpanded,
    setLoading,
    selectDelivery,
    toggleExpandDelivery,
  } = useDashboardStore();

  const sortedDeliveries = useSortedDeliveries();
  const stats = useDashboardStats();

  // Calculate delivery counts for filter UI
  const deliveryCounts = useMemo(() => {
    const byPlatform: Partial<Record<Platform, number>> = {};
    const byStatus: Partial<Record<DeliveryStatus, number>> = {};

    deliveries.forEach((d) => {
      byPlatform[d.platform] = (byPlatform[d.platform] ?? 0) + 1;
      byStatus[d.status] = (byStatus[d.status] ?? 0) + 1;
    });

    return {
      total: deliveries.length,
      filtered: sortedDeliveries.length,
      byPlatform,
      byStatus,
    };
  }, [deliveries, sortedDeliveries]);

  // Real-time updates
  const { connectionState, isConnected } = useRealTimeUpdates({
    userId: 'demo-user', // In production, get from auth context
    onDeliveryUpdate: (event) => {
      // Update delivery in store
      const existingDelivery = deliveries.find((d) => d.id === event.payload.deliveryId);
      if (!existingDelivery?.eta) return;

      updateDelivery(event.payload.deliveryId, {
        status: event.payload.status as DeliveryStatus,
        statusLabel: event.payload.statusLabel,
        eta: event.payload.eta
          ? {
              ...existingDelivery.eta,
              minutesRemaining: event.payload.eta,
            }
          : existingDelivery.eta,
      });
    },
    onLocationUpdate: (event) => {
      const delivery = deliveries.find((d) => d.id === event.payload.deliveryId);
      if (delivery?.driver) {
        updateDelivery(event.payload.deliveryId, {
          driver: {
            ...delivery.driver,
            location: {
              lat: event.payload.location.lat,
              lng: event.payload.location.lng,
              heading: event.payload.location.heading,
              speed: event.payload.location.speed,
              timestamp: new Date(event.payload.location.timestamp),
            },
          },
        });
      }
    },
  });

  // Determine empty state type
  const emptyType = useMemo(() => {
    if (deliveries.length === 0) {
      // Check if any platforms are connected (would need to check connections)
      return 'no-deliveries';
    }
    if (sortedDeliveries.length === 0) {
      return 'no-results';
    }
    return 'no-deliveries';
  }, [deliveries.length, sortedDeliveries.length]);

  const hasFilters =
    filters.platforms.length > 0 ||
    filters.statuses.length > 0 ||
    filters.searchQuery.trim().length > 0;

  // Get active deliveries with live tracking for map
  const trackableDeliveries = useMemo(() => {
    return sortedDeliveries.filter(
      (d) =>
        d.tracking?.liveUpdates &&
        d.driver?.location &&
        !['delivered', 'cancelled'].includes(d.status)
    );
  }, [sortedDeliveries]);

  // Fetch active deliveries on mount
  const fetchActiveDeliveries = useCallback(async () => {
    try {
      const res = await fetch('/api/trpc/delivery.getActive');
      if (!res.ok) return;
      const json = (await res.json()) as {
        result?: { data?: Partial<UnifiedDelivery>[] };
      };
      const rawDeliveries = json?.result?.data;
      if (Array.isArray(rawDeliveries)) {
        const now = new Date();
        const normalized: UnifiedDelivery[] = rawDeliveries.map((d, index) => ({
          id: d.id ?? `delivery-${index}`,
          platform: d.platform ?? 'doordash',
          externalOrderId: d.externalOrderId ?? d.id ?? `order-${index}`,
          status: d.status ?? 'preparing',
          statusLabel: d.statusLabel ?? 'Preparing',
          statusUpdatedAt: d.statusUpdatedAt ? new Date(d.statusUpdatedAt) : now,
          eta: {
            estimatedArrival: d.eta?.estimatedArrival
              ? new Date(d.eta.estimatedArrival)
              : new Date(now.getTime() + (d.eta?.minutesRemaining ?? 15) * 60000),
            minutesRemaining: d.eta?.minutesRemaining ?? 15,
            confidence: d.eta?.confidence ?? 'high',
          },
          driver: d.driver,
          destination: {
            address: d.destination?.address ?? '123 Main St',
            lat: d.destination?.lat ?? 37.7749,
            lng: d.destination?.lng ?? -122.4194,
          },
          order: {
            itemCount: d.order?.itemCount ?? 1,
            totalAmount: d.order?.totalAmount,
            items: d.order?.items,
          },
          tracking: {
            mapAvailable: d.tracking?.mapAvailable ?? false,
            liveUpdates: d.tracking?.liveUpdates ?? false,
            contactDriverAvailable: d.tracking?.contactDriverAvailable ?? false,
          },
          timestamps: {
            ordered: d.timestamps?.ordered ? new Date(d.timestamps.ordered) : now,
          },
          meta: {
            lastFetchedAt: d.meta?.lastFetchedAt ? new Date(d.meta.lastFetchedAt) : now,
            fetchMethod: d.meta?.fetchMethod ?? 'api',
            adapterId: d.meta?.adapterId ?? d.platform ?? 'doordash',
          },
        }));
        setDeliveries(normalized);
      }
    } catch {
      // Ignore fetch errors in offline/unconfigured environments
    }
  }, [setDeliveries]);

  useEffect(() => {
    void fetchActiveDeliveries();
  }, [fetchActiveDeliveries]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setLoading(true);
    void fetchActiveDeliveries().finally(() => {
      setTimeout(() => setLoading(false), 500);
    });
  }, [fetchActiveDeliveries, setLoading]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--dd-text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--dd-text-muted)]">
            Track all your deliveries from one unified view.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--dd-text-muted)]">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-success'
                  : connectionState === 'connecting'
                    ? 'bg-warning animate-pulse'
                    : 'bg-[var(--dd-text-muted)]'
              }`}
            />
            {isConnected ? 'Live' : connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
          </div>

          {/* Refresh button */}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Map toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMap}
            className={showMap ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan' : ''}
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Map
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <DeliveryStats
        activeCount={stats.active}
        arrivingSoonCount={stats.arrivingSoon}
        deliveredTodayCount={stats.deliveredToday}
        weeklyTotal={stats.total}
        isLoading={isLoading}
      />

      {/* Map Section (collapsible) */}
      <AnimatePresence>
        {showMap && trackableDeliveries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div>
                  <CardTitle className="text-base">Live Tracking</CardTitle>
                  <CardDescription className="text-xs">
                    {trackableDeliveries.length} active{' '}
                    {trackableDeliveries.length === 1 ? 'delivery' : 'deliveries'} on the map
                  </CardDescription>
                </div>
                <Button
                  aria-label={mapExpanded ? 'Minimize map' : 'Maximize map'}
                  variant="ghost"
                  size="sm"
                  onClick={() => setMapExpanded(!mapExpanded)}
                >
                  {mapExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className={mapExpanded ? 'h-[500px]' : 'h-[300px]'}>
                  <LiveTrackingMap
                    deliveries={trackableDeliveries}
                    selectedDeliveryId={selectedDeliveryId}
                    onDeliverySelect={(delivery) => selectDelivery(delivery.id)}
                    showConnectionStatus
                    autoFitBounds
                    className="w-full h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters and Controls */}
      <DeliveryFilters
        filters={filters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        viewMode={viewMode}
        onPlatformToggle={togglePlatformFilter}
        onStatusToggle={toggleStatusFilter}
        onSearchChange={setSearchQuery}
        onClearFilters={clearFilters}
        onSortByChange={setSortBy}
        onSortOrderToggle={toggleSortOrder}
        onViewModeChange={setViewMode}
        deliveryCounts={deliveryCounts}
      />

      {/* Deliveries Section */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Deliveries</CardTitle>
            {sortedDeliveries.length > 0 && (
              <span className="text-sm text-[var(--dd-text-muted)]">
                {sortedDeliveries.length}{' '}
                {sortedDeliveries.length === 1 ? 'delivery' : 'deliveries'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DeliveryGrid
            deliveries={sortedDeliveries}
            selectedId={selectedDeliveryId}
            expandedId={expandedDeliveryId}
            onSelect={selectDelivery}
            onExpand={toggleExpandDelivery}
            isLoading={isLoading}
            error={error}
            emptyType={emptyType}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onConnectPlatforms={() => {
              // Navigate to settings/platforms
              window.location.href = '/settings/platforms';
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
