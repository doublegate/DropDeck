'use client';

import { cn } from '@/lib/utils';

export type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance' | 'unknown';

interface StatusIndicatorProps {
  status: ServiceStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<ServiceStatus, { color: string; pulseColor: string; label: string }> = {
  operational: {
    color: 'bg-green-500',
    pulseColor: 'bg-green-400',
    label: 'Operational',
  },
  degraded: {
    color: 'bg-yellow-500',
    pulseColor: 'bg-yellow-400',
    label: 'Degraded',
  },
  outage: {
    color: 'bg-red-500',
    pulseColor: 'bg-red-400',
    label: 'Outage',
  },
  maintenance: {
    color: 'bg-blue-500',
    pulseColor: 'bg-blue-400',
    label: 'Maintenance',
  },
  unknown: {
    color: 'bg-gray-400',
    pulseColor: 'bg-gray-300',
    label: 'Unknown',
  },
};

const SIZE_CONFIG = {
  sm: { dot: 'h-2 w-2', text: 'text-xs' },
  md: { dot: 'h-3 w-3', text: 'text-sm' },
  lg: { dot: 'h-4 w-4', text: 'text-base' },
};

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = true,
  className,
}: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex">
        {/* Pulse animation for operational status */}
        {status === 'operational' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.pulseColor
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', sizeConfig.dot, config.color)} />
      </span>
      {showLabel && <span className={cn('font-medium', sizeConfig.text)}>{config.label}</span>}
    </div>
  );
}
