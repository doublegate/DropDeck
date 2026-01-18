import { z } from 'zod';

/**
 * Production environment variables schema
 * All fields are required in production to ensure system reliability
 */
const productionEnvSchema = z.object({
  // Node environment - must be production
  NODE_ENV: z.literal('production'),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url({
    message: 'NEXT_PUBLIC_APP_URL must be a valid URL (e.g., https://dropdeck.app)',
  }),

  // Database - must be a valid PostgreSQL connection string
  DATABASE_URL: z.string().startsWith('postgresql://', {
    message: 'DATABASE_URL must start with postgresql://',
  }),
  DATABASE_URL_UNPOOLED: z.string().startsWith('postgresql://').optional(),

  // Authentication
  AUTH_SECRET: z.string().min(32, {
    message: 'AUTH_SECRET must be at least 32 characters for security',
  }),
  NEXTAUTH_URL: z.string().url().optional(),

  // OAuth providers (at least one required)
  AUTH_GOOGLE_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
  AUTH_GITHUB_ID: z.string().min(1).optional(),
  AUTH_GITHUB_SECRET: z.string().min(1).optional(),

  // Encryption - must be 64 hex characters (32 bytes)
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .length(64, {
      message: 'TOKEN_ENCRYPTION_KEY must be exactly 64 hex characters (256 bits)',
    })
    .regex(/^[a-fA-F0-9]+$/, {
      message: 'TOKEN_ENCRYPTION_KEY must contain only hexadecimal characters',
    }),

  // Redis / Upstash - required for caching and rate limiting
  UPSTASH_REDIS_REST_URL: z.string().url({
    message: 'UPSTASH_REDIS_REST_URL must be a valid URL',
  }),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, {
    message: 'UPSTASH_REDIS_REST_TOKEN is required',
  }),

  // Real-time / Ably - required for WebSocket functionality
  ABLY_API_KEY: z.string().includes(':', {
    message: 'ABLY_API_KEY must be in the format appId.keyId:keySecret',
  }),
  NEXT_PUBLIC_ABLY_API_KEY: z.string().optional(),

  // Monitoring (optional but recommended)
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Rate limiting
  RATELIMIT_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  // Platform API keys (optional per platform)
  INSTACART_CLIENT_ID: z.string().optional(),
  INSTACART_CLIENT_SECRET: z.string().optional(),
  INSTACART_WEBHOOK_SECRET: z.string().optional(),

  DOORDASH_DEVELOPER_ID: z.string().optional(),
  DOORDASH_KEY_ID: z.string().optional(),
  DOORDASH_SIGNING_SECRET: z.string().optional(),
  DOORDASH_WEBHOOK_SECRET: z.string().optional(),

  UBER_CLIENT_ID: z.string().optional(),
  UBER_CLIENT_SECRET: z.string().optional(),

  AMAZON_SELLER_ID: z.string().optional(),
  AMAZON_CLIENT_ID: z.string().optional(),
  AMAZON_CLIENT_SECRET: z.string().optional(),
});

/**
 * Type for validated production environment
 */
export type ProductionEnv = z.infer<typeof productionEnvSchema>;

/**
 * Validation result type
 */
export interface ValidationResult {
  success: boolean;
  data?: ProductionEnv;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Validate production environment variables
 * @returns Validation result with data or errors
 */
export function validateProductionEnv(): ValidationResult {
  const result = productionEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return {
      success: false,
      errors,
    };
  }

  // Additional OAuth validation - at least one provider required
  const hasGoogleAuth = result.data.AUTH_GOOGLE_ID && result.data.AUTH_GOOGLE_SECRET;
  const hasGitHubAuth = result.data.AUTH_GITHUB_ID && result.data.AUTH_GITHUB_SECRET;

  if (!hasGoogleAuth && !hasGitHubAuth) {
    return {
      success: false,
      errors: [
        {
          field: 'AUTH_*',
          message: 'At least one OAuth provider (Google or GitHub) must be configured',
        },
      ],
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Validate production environment and exit on failure
 * Use this during application startup
 */
export function validateProductionEnvOrExit(): ProductionEnv {
  const result = validateProductionEnv();

  if (!result.success) {
    console.error('='.repeat(60));
    console.error('PRODUCTION ENVIRONMENT VALIDATION FAILED');
    console.error('='.repeat(60));
    console.error('');
    console.error('The following environment variables are missing or invalid:');
    console.error('');

    for (const error of result.errors ?? []) {
      console.error(`  - ${error.field}: ${error.message}`);
    }

    console.error('');
    console.error('Please ensure all required environment variables are set correctly.');
    console.error('See .env.example for reference.');
    console.error('='.repeat(60));

    process.exit(1);
  }

  // result.data is guaranteed to exist when result.success is true
  return result.data as ProductionEnv;
}

/**
 * Get typed production environment (assumes validation passed)
 * @throws Error if called in non-production environment
 */
export function getProductionEnv(): ProductionEnv {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('getProductionEnv() should only be called in production');
  }

  return validateProductionEnvOrExit();
}

/**
 * Check if all production requirements are met
 * Returns boolean without exiting (for health checks)
 */
export function isProductionReady(): boolean {
  const result = validateProductionEnv();
  return result.success;
}

/**
 * Get production readiness report
 * Returns detailed status for health checks and diagnostics
 */
export interface ProductionReadinessReport {
  ready: boolean;
  checks: {
    database: boolean;
    redis: boolean;
    auth: boolean;
    encryption: boolean;
    realtime: boolean;
    monitoring: boolean;
  };
  missingOptional: string[];
}

export function getProductionReadinessReport(): ProductionReadinessReport {
  const env = process.env;

  const checks = {
    database: Boolean(env.DATABASE_URL?.startsWith('postgresql://')),
    redis: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
    auth: Boolean(
      env.AUTH_SECRET &&
        env.AUTH_SECRET.length >= 32 &&
        ((env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) ||
          (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET))
    ),
    encryption: Boolean(env.TOKEN_ENCRYPTION_KEY?.length === 64),
    realtime: Boolean(env.ABLY_API_KEY?.includes(':')),
    monitoring: Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN),
  };

  const missingOptional: string[] = [];

  if (!env.SENTRY_DSN) missingOptional.push('SENTRY_DSN');
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) missingOptional.push('NEXT_PUBLIC_POSTHOG_KEY');
  if (!env.DATABASE_URL_UNPOOLED) missingOptional.push('DATABASE_URL_UNPOOLED');

  // Check for platform API keys
  const platforms = ['INSTACART', 'DOORDASH', 'UBER', 'AMAZON'];
  for (const platform of platforms) {
    if (!env[`${platform}_CLIENT_ID`]) {
      missingOptional.push(`${platform}_CLIENT_ID`);
    }
  }

  return {
    ready: checks.database && checks.redis && checks.auth && checks.encryption && checks.realtime,
    checks,
    missingOptional,
  };
}
