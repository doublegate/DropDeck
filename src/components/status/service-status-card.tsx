'use client';

import { cn } from '@/lib/utils';
import { type ServiceStatus, StatusIndicator } from './status-indicator';

interface ServiceStatusCardProps {
  name: string;
  description?: string;
  status: ServiceStatus;
  latencyMs?: number;
  lastChecked?: Date;
  className?: string;
}

export function ServiceStatusCard({
  name,
  description,
  status,
  latencyMs,
  lastChecked,
  className,
}: ServiceStatusCardProps) {
  return (
    <div
      className={cn('flex items-center justify-between rounded-lg border bg-card p-4', className)}
    >
      <div className="space-y-1">
        <h3 className="font-medium">{name}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked: {formatTimeAgo(lastChecked)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        {latencyMs !== undefined && (
          <span
            className={cn(
              'text-sm tabular-nums',
              latencyMs > 500 ? 'text-yellow-600' : 'text-muted-foreground'
            )}
          >
            {latencyMs}ms
          </span>
        )}
        <StatusIndicator status={status} />
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
