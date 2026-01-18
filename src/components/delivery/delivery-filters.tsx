'use client';

import { useMemo } from 'react';
import { Filter, SortAsc, SortDesc, Grid3X3, List, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { PLATFORM_CONFIGS, type Platform } from '@/types/platform';
import type { DeliveryStatus } from '@/types/delivery';
import type { SortBy, SortOrder, ViewMode, DashboardFilters } from '@/stores/dashboard-store';

/**
 * Status filter options
 */
const STATUS_OPTIONS: Array<{
  value: DeliveryStatus;
  label: string;
  group: 'active' | 'completed';
}> = [
  { value: 'preparing', label: 'Preparing', group: 'active' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup', group: 'active' },
  { value: 'driver_assigned', label: 'Driver Assigned', group: 'active' },
  { value: 'driver_heading_to_store', label: 'Driver En Route', group: 'active' },
  { value: 'driver_at_store', label: 'Driver at Store', group: 'active' },
  { value: 'out_for_delivery', label: 'Out for Delivery', group: 'active' },
  { value: 'arriving', label: 'Arriving', group: 'active' },
  { value: 'delayed', label: 'Delayed', group: 'active' },
  { value: 'delivered', label: 'Delivered', group: 'completed' },
  { value: 'cancelled', label: 'Cancelled', group: 'completed' },
];

/**
 * Sort options
 */
const SORT_OPTIONS: Array<{ value: SortBy; label: string }> = [
  { value: 'eta', label: 'ETA' },
  { value: 'status', label: 'Status' },
  { value: 'platform', label: 'Platform' },
  { value: 'orderTime', label: 'Order Time' },
];

/**
 * DeliveryFilters props
 */
interface DeliveryFiltersProps {
  /** Current filters */
  filters: DashboardFilters;
  /** Current sort */
  sortBy: SortBy;
  sortOrder: SortOrder;
  /** Current view mode */
  viewMode: ViewMode;
  /** Filter handlers */
  onPlatformToggle: (platform: Platform) => void;
  onStatusToggle: (status: DeliveryStatus) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  /** Sort handlers */
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderToggle: () => void;
  /** View handlers */
  onViewModeChange: (mode: ViewMode) => void;
  /** Delivery counts */
  deliveryCounts?: {
    total: number;
    filtered: number;
    byPlatform: Partial<Record<Platform, number>>;
    byStatus: Partial<Record<DeliveryStatus, number>>;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * DeliveryFilters component
 * Filter, sort, and view controls for the delivery dashboard
 */
export function DeliveryFilters({
  filters,
  sortBy,
  sortOrder,
  viewMode,
  onPlatformToggle,
  onStatusToggle,
  onSearchChange,
  onClearFilters,
  onSortByChange,
  onSortOrderToggle,
  onViewModeChange,
  deliveryCounts,
  className,
}: DeliveryFiltersProps) {
  const hasFilters =
    filters.platforms.length > 0 ||
    filters.statuses.length > 0 ||
    filters.searchQuery.trim().length > 0;

  const activeStatusOptions = useMemo(() => STATUS_OPTIONS.filter((s) => s.group === 'active'), []);
  const completedStatusOptions = useMemo(
    () => STATUS_OPTIONS.filter((s) => s.group === 'completed'),
    []
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search and main controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search deliveries..."
            value={filters.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dd-text-muted)]" />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--dd-text-muted)] hover:text-[var(--dd-text-secondary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {/* Platform filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Platform
                {filters.platforms.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-brand-cyan text-white text-xs rounded-full">
                    {filters.platforms.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by Platform</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(PLATFORM_CONFIGS).map((platform) => (
                <DropdownMenuCheckboxItem
                  key={platform.id}
                  checked={filters.platforms.includes(platform.id)}
                  onCheckedChange={() => onPlatformToggle(platform.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    {platform.name}
                    {deliveryCounts?.byPlatform[platform.id] !== undefined && (
                      <span className="ml-auto text-xs text-[var(--dd-text-muted)]">
                        {deliveryCounts.byPlatform[platform.id]}
                      </span>
                    )}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Status
                {filters.statuses.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-brand-cyan text-white text-xs rounded-full">
                    {filters.statuses.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Active Statuses</DropdownMenuLabel>
              {activeStatusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.statuses.includes(option.value)}
                  onCheckedChange={() => onStatusToggle(option.value)}
                >
                  {option.label}
                  {deliveryCounts?.byStatus[option.value] !== undefined && (
                    <span className="ml-auto text-xs text-[var(--dd-text-muted)]">
                      {deliveryCounts.byStatus[option.value]}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Completed</DropdownMenuLabel>
              {completedStatusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.statuses.includes(option.value)}
                  onCheckedChange={() => onStatusToggle(option.value)}
                >
                  {option.label}
                  {deliveryCounts?.byStatus[option.value] !== undefined && (
                    <span className="ml-auto text-xs text-[var(--dd-text-muted)]">
                      {deliveryCounts.byStatus[option.value]}
                    </span>
                  )}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
                Sort
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sortBy}
                onValueChange={(v) => onSortByChange(v as SortBy)}
              >
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortOrder === 'desc'}
                onCheckedChange={onSortOrderToggle}
              >
                Descending order
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View mode toggle */}
          <div className="hidden sm:flex items-center border border-[var(--dd-border)] rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-r-none border-r border-[var(--dd-border)]',
                viewMode === 'grid' && 'bg-[var(--dd-bg-tertiary)]'
              )}
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('rounded-l-none', viewMode === 'list' && 'bg-[var(--dd-bg-tertiary)]')}
              onClick={() => onViewModeChange('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--dd-text-muted)]">Filters:</span>

          {filters.platforms.map((platform) => (
            <button
              type="button"
              key={platform}
              onClick={() => onPlatformToggle(platform)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
            >
              {PLATFORM_CONFIGS[platform]?.name ?? platform}
              <X className="w-3 h-3" />
            </button>
          ))}

          {filters.statuses.map((status) => {
            const option = STATUS_OPTIONS.find((s) => s.value === status);
            return (
              <button
                type="button"
                key={status}
                onClick={() => onStatusToggle(status)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
              >
                {option?.label ?? status}
                <X className="w-3 h-3" />
              </button>
            );
          })}

          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20 transition-colors"
            >
              Search: &quot;{filters.searchQuery}&quot;
              <X className="w-3 h-3" />
            </button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-xs text-[var(--dd-text-muted)] hover:text-brand-cyan"
          >
            Clear all
          </Button>

          {deliveryCounts && (
            <span className="ml-auto text-xs text-[var(--dd-text-muted)]">
              Showing {deliveryCounts.filtered} of {deliveryCounts.total}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export type { DeliveryFiltersProps };
