import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getProductionReadinessReport } from '@/lib/env/production';
import { redis } from '@/lib/realtime/redis';

/**
 * Check if we're in production environment
 */
function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Health check status types
 */
type ServiceStatus = 'ok' | 'degraded' | 'error';

interface HealthCheck {
  status: ServiceStatus;
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    environment: HealthCheck;
  };
  meta?: {
    region?: string;
    commitSha?: string;
  };
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  if (!db) {
    return {
      status: 'error',
      message: 'Database client not initialized',
    };
  }

  const start = Date.now();

  try {
    await db.execute(sql`SELECT 1 as health_check`);
    const latencyMs = Date.now() - start;

    return {
      status: latencyMs > 1000 ? 'degraded' : 'ok',
      latencyMs,
      message: latencyMs > 1000 ? 'High latency detected' : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<HealthCheck> {
  if (!redis) {
    return {
      status: isProductionEnv() ? 'error' : 'degraded',
      message: 'Redis client not initialized',
    };
  }

  const start = Date.now();

  try {
    await redis.ping();
    const latencyMs = Date.now() - start;

    return {
      status: latencyMs > 500 ? 'degraded' : 'ok',
      latencyMs,
      message: latencyMs > 500 ? 'High latency detected' : undefined,
    };
  } catch (error) {
    return {
      status: 'error',
      latencyMs: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

/**
 * Check environment configuration
 */
function checkEnvironment(): HealthCheck {
  if (!isProductionEnv()) {
    return {
      status: 'ok',
      message: 'Development mode - skipping production checks',
    };
  }

  const report = getProductionReadinessReport();

  if (!report.ready) {
    const failedChecks = Object.entries(report.checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name);

    return {
      status: 'error',
      message: `Missing configuration: ${failedChecks.join(', ')}`,
    };
  }

  if (report.missingOptional.length > 0) {
    return {
      status: 'degraded',
      message: `Optional config missing: ${report.missingOptional.slice(0, 3).join(', ')}${report.missingOptional.length > 3 ? '...' : ''}`,
    };
  }

  return {
    status: 'ok',
  };
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(
  checks: Record<string, HealthCheck>
): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(checks).map((check) => check.status);

  if (statuses.some((s) => s === 'error')) {
    return 'unhealthy';
  }

  if (statuses.some((s) => s === 'degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startTime = process.uptime();

  // Run checks in parallel for faster response
  const [database, redisCheck] = await Promise.all([checkDatabase(), checkRedis()]);

  const environment = checkEnvironment();

  const checks = {
    database,
    redis: redisCheck,
    environment,
  };

  const status = calculateOverallStatus(checks);

  const response: HealthResponse = {
    status,
    version: process.env.npm_package_version ?? '0.1.0',
    environment: process.env.NODE_ENV ?? 'development',
    timestamp: new Date().toISOString(),
    uptime: startTime,
    checks,
    meta: {
      region: process.env.VERCEL_REGION,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7),
    },
  };

  // Return appropriate HTTP status code
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

/**
 * HEAD /api/health
 * Lightweight health check for load balancers
 */
export async function HEAD(): Promise<NextResponse> {
  // Quick check - just verify database is reachable
  const dbCheck = await checkDatabase();

  const status = dbCheck.status === 'error' ? 503 : 200;

  return new NextResponse(null, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
