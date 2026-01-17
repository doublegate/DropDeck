import { z } from 'zod';

/**
 * Server-side environment variables schema
 * These are only available on the server
 */
const serverSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Authentication
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),

  // Encryption
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .regex(/^[a-fA-F0-9]+$/)
    .optional(),

  // Redis / Upstash
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Real-time / Ably
  ABLY_API_KEY: z.string().optional(),
});

/**
 * Client-side environment variables schema
 * These are exposed to the browser (prefixed with NEXT_PUBLIC_)
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_ABLY_API_KEY: z.string().optional(),
});

/**
 * Combined schema for all environment variables
 */
const envSchema = serverSchema.merge(clientSchema);

/**
 * Type definitions
 */
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
export type Env = z.infer<typeof envSchema>;

/**
 * Validate and parse environment variables
 * This is called at build time and runtime
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);

    // In development, warn but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing with invalid environment in development mode...');
      return process.env as unknown as Env;
    }

    throw new Error('Invalid environment variables. Check the console for details.');
  }

  return parsed.data;
}

/**
 * Validated environment variables
 * Use this throughout the application
 */
export const env = validateEnv();

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in test environment
 */
export const isTest = env.NODE_ENV === 'test';
