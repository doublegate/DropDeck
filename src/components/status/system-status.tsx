'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ServiceStatusCard } from './service-status-card';
import { type ServiceStatus, StatusIndicator } from './status-indicator';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: { status: string; latencyMs?: number; message?: string };
    redis: { status: string; latencyMs?: number; message?: string };
    environment: { status: string; message?: string };
  };
  meta?: {
    region?: string;
    commitSha?: string;
  };
}

interface SystemStatusProps {
  className?: string;
  showDetails?: boolean;
}

function mapStatus(status: string): ServiceStatus {
  switch (status) {
    case 'ok':
      return 'operational';
    case 'degraded':
      return 'degraded';
    case 'error':
      return 'outage';
    default:
      return 'unknown';
  }
}

function mapOverallStatus(status: string): ServiceStatus {
  switch (status) {
    case 'healthy':
      return 'operational';
    case 'degraded':
      return 'degraded';
    case 'unhealthy':
      return 'outage';
    default:
      return 'unknown';
  }
}

export function SystemStatus({ className, showDetails = true }: SystemStatusProps) {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error('Health check failed');
        }
        const data = (await response.json()) as HealthCheckResponse;
        setHealth(data);
        setError(null);
        setLastChecked(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health status');
      } finally {
        setLoading(false);
      }
    }

    fetchHealth();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-gray-300" />
          <span className="text-sm text-muted-foreground">Checking system status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <StatusIndicator status="unknown" />
          <span className="text-sm text-muted-foreground">Unable to determine status</span>
        </div>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const overallStatus = mapOverallStatus(health.status);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">System Status</h2>
          <p className="text-sm text-muted-foreground">
            All systems {overallStatus === 'operational' ? 'operational' : 'experiencing issues'}
          </p>
        </div>
        <StatusIndicator status={overallStatus} size="lg" />
      </div>

      {showDetails && (
        <>
          {/* Service Details */}
          <div className="space-y-2">
            <ServiceStatusCard
              name="Database"
              description="PostgreSQL database"
              status={mapStatus(health.checks.database.status)}
              latencyMs={health.checks.database.latencyMs}
              lastChecked={lastChecked ?? undefined}
            />
            <ServiceStatusCard
              name="Cache"
              description="Redis cache and pub/sub"
              status={mapStatus(health.checks.redis.status)}
              latencyMs={health.checks.redis.latencyMs}
              lastChecked={lastChecked ?? undefined}
            />
            <ServiceStatusCard
              name="Configuration"
              description="Environment and settings"
              status={mapStatus(health.checks.environment.status)}
              lastChecked={lastChecked ?? undefined}
            />
          </div>

          {/* Metadata */}
          {health.meta && (
            <div className="border-t pt-4">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Version</dt>
                  <dd className="font-mono">{health.version}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Environment</dt>
                  <dd className="font-mono">{health.environment}</dd>
                </div>
                {health.meta.region && (
                  <div>
                    <dt className="text-muted-foreground">Region</dt>
                    <dd className="font-mono">{health.meta.region}</dd>
                  </div>
                )}
                {health.meta.commitSha && (
                  <div>
                    <dt className="text-muted-foreground">Commit</dt>
                    <dd className="font-mono">{health.meta.commitSha}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
}
