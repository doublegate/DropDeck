import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UnifiedDelivery, DeliveryStatus } from '@/types/delivery';
import type { Platform } from '@/types/platform';

/**
 * Sort options for deliveries
 */
export type SortBy = 'eta' | 'status' | 'platform' | 'orderTime';
export type SortOrder = 'asc' | 'desc';

/**
 * View mode for the dashboard
 */
export type ViewMode = 'grid' | 'list' | 'map';

/**
 * Dashboard filter state
 */
export interface DashboardFilters {
  platforms: Platform[];
  statuses: DeliveryStatus[];
  searchQuery: string;
}

/**
 * Dashboard store state
 */
interface DashboardState {
  // Deliveries data
  deliveries: UnifiedDelivery[];
  selectedDeliveryId: string | null;
  expandedDeliveryId: string | null;

  // Filters
  filters: DashboardFilters;

  // Sorting
  sortBy: SortBy;
  sortOrder: SortOrder;

  // View settings
  viewMode: ViewMode;
  showMap: boolean;
  mapExpanded: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: Date | null;

  // Actions
  setDeliveries: (deliveries: UnifiedDelivery[]) => void;
  addDelivery: (delivery: UnifiedDelivery) => void;
  updateDelivery: (deliveryId: string, updates: Partial<UnifiedDelivery>) => void;
  removeDelivery: (deliveryId: string) => void;
  selectDelivery: (deliveryId: string | null) => void;
  toggleExpandDelivery: (deliveryId: string) => void;

  // Filter actions
  setPlatformFilter: (platforms: Platform[]) => void;
  togglePlatformFilter: (platform: Platform) => void;
  setStatusFilter: (statuses: DeliveryStatus[]) => void;
  toggleStatusFilter: (status: DeliveryStatus) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;

  // Sort actions
  setSortBy: (sortBy: SortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  toggleMap: () => void;
  setMapExpanded: (expanded: boolean) => void;

  // Status actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getFilteredDeliveries: () => UnifiedDelivery[];
  getSortedDeliveries: () => UnifiedDelivery[];
  getActiveCount: () => number;
  getArrivingSoonCount: () => number;
  getDeliveredTodayCount: () => number;
}

/**
 * Default filter state
 */
const DEFAULT_FILTERS: DashboardFilters = {
  platforms: [],
  statuses: [],
  searchQuery: '',
};

/**
 * Status priority for sorting
 */
const STATUS_PRIORITY: Record<DeliveryStatus, number> = {
  arriving: 0,
  out_for_delivery: 1,
  driver_at_store: 2,
  driver_heading_to_store: 3,
  driver_assigned: 4,
  ready_for_pickup: 5,
  preparing: 6,
  delayed: 7,
  delivered: 8,
  cancelled: 9,
};

/**
 * Active statuses for filtering
 */
const ACTIVE_STATUSES: DeliveryStatus[] = [
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'driver_heading_to_store',
  'driver_at_store',
  'out_for_delivery',
  'arriving',
  'delayed',
];

/**
 * Dashboard store
 */
export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // Initial state
      deliveries: [],
      selectedDeliveryId: null,
      expandedDeliveryId: null,
      filters: DEFAULT_FILTERS,
      sortBy: 'eta',
      sortOrder: 'asc',
      viewMode: 'grid',
      showMap: true,
      mapExpanded: false,
      isLoading: false,
      error: null,
      lastUpdatedAt: null,

      // Delivery actions
      setDeliveries: (deliveries) =>
        set({
          deliveries,
          lastUpdatedAt: new Date(),
          error: null,
        }),

      addDelivery: (delivery) =>
        set((state) => ({
          deliveries: [delivery, ...state.deliveries],
          lastUpdatedAt: new Date(),
        })),

      updateDelivery: (deliveryId, updates) =>
        set((state) => ({
          deliveries: state.deliveries.map((d) => (d.id === deliveryId ? { ...d, ...updates } : d)),
          lastUpdatedAt: new Date(),
        })),

      removeDelivery: (deliveryId) =>
        set((state) => ({
          deliveries: state.deliveries.filter((d) => d.id !== deliveryId),
          selectedDeliveryId:
            state.selectedDeliveryId === deliveryId ? null : state.selectedDeliveryId,
          expandedDeliveryId:
            state.expandedDeliveryId === deliveryId ? null : state.expandedDeliveryId,
        })),

      selectDelivery: (deliveryId) => set({ selectedDeliveryId: deliveryId }),

      toggleExpandDelivery: (deliveryId) =>
        set((state) => ({
          expandedDeliveryId: state.expandedDeliveryId === deliveryId ? null : deliveryId,
        })),

      // Filter actions
      setPlatformFilter: (platforms) =>
        set((state) => ({
          filters: { ...state.filters, platforms },
        })),

      togglePlatformFilter: (platform) =>
        set((state) => {
          const platforms = state.filters.platforms.includes(platform)
            ? state.filters.platforms.filter((p) => p !== platform)
            : [...state.filters.platforms, platform];
          return { filters: { ...state.filters, platforms } };
        }),

      setStatusFilter: (statuses) =>
        set((state) => ({
          filters: { ...state.filters, statuses },
        })),

      toggleStatusFilter: (status) =>
        set((state) => {
          const statuses = state.filters.statuses.includes(status)
            ? state.filters.statuses.filter((s) => s !== status)
            : [...state.filters.statuses, status];
          return { filters: { ...state.filters, statuses } };
        }),

      setSearchQuery: (query) =>
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        })),

      clearFilters: () => set({ filters: DEFAULT_FILTERS }),

      // Sort actions
      setSortBy: (sortBy) => set({ sortBy }),

      setSortOrder: (sortOrder) => set({ sortOrder }),

      toggleSortOrder: () =>
        set((state) => ({
          sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
        })),

      // View actions
      setViewMode: (viewMode) => set({ viewMode }),

      toggleMap: () => set((state) => ({ showMap: !state.showMap })),

      setMapExpanded: (mapExpanded) => set({ mapExpanded }),

      // Status actions
      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // Computed values
      getFilteredDeliveries: () => {
        const state = get();
        let filtered = [...state.deliveries];

        // Filter by platforms
        if (state.filters.platforms.length > 0) {
          filtered = filtered.filter((d) => state.filters.platforms.includes(d.platform));
        }

        // Filter by statuses
        if (state.filters.statuses.length > 0) {
          filtered = filtered.filter((d) => state.filters.statuses.includes(d.status));
        }

        // Filter by search query
        if (state.filters.searchQuery.trim()) {
          const query = state.filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.externalOrderId.toLowerCase().includes(query) ||
              d.statusLabel.toLowerCase().includes(query) ||
              d.destination.address.toLowerCase().includes(query) ||
              d.platform.toLowerCase().includes(query) ||
              d.driver?.name?.toLowerCase().includes(query)
          );
        }

        return filtered;
      },

      getSortedDeliveries: () => {
        const state = get();
        const filtered = state.getFilteredDeliveries();
        const multiplier = state.sortOrder === 'asc' ? 1 : -1;

        return filtered.sort((a, b) => {
          switch (state.sortBy) {
            case 'eta':
              return multiplier * (a.eta.minutesRemaining - b.eta.minutesRemaining);

            case 'status':
              return (
                multiplier * ((STATUS_PRIORITY[a.status] ?? 10) - (STATUS_PRIORITY[b.status] ?? 10))
              );

            case 'platform':
              return multiplier * a.platform.localeCompare(b.platform);

            case 'orderTime':
              return multiplier * (a.timestamps.ordered.getTime() - b.timestamps.ordered.getTime());

            default:
              return 0;
          }
        });
      },

      getActiveCount: () => {
        const state = get();
        return state.deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status)).length;
      },

      getArrivingSoonCount: () => {
        const state = get();
        return state.deliveries.filter(
          (d) => ACTIVE_STATUSES.includes(d.status) && d.eta.minutesRemaining <= 15
        ).length;
      },

      getDeliveredTodayCount: () => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return state.deliveries.filter(
          (d) =>
            d.status === 'delivered' && d.timestamps.delivered && d.timestamps.delivered >= today
        ).length;
      },
    }),
    {
      name: 'dropdeck-dashboard',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences, not data
        filters: state.filters,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        viewMode: state.viewMode,
        showMap: state.showMap,
      }),
    }
  )
);

/**
 * Selector hooks for common computations
 */
export const useFilteredDeliveries = () =>
  useDashboardStore((state) => state.getFilteredDeliveries());

export const useSortedDeliveries = () => useDashboardStore((state) => state.getSortedDeliveries());

export const useDashboardStats = () =>
  useDashboardStore((state) => ({
    active: state.getActiveCount(),
    arrivingSoon: state.getArrivingSoonCount(),
    deliveredToday: state.getDeliveredTodayCount(),
    total: state.deliveries.length,
  }));
