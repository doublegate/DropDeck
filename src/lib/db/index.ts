import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

/**
 * Create Neon serverless SQL client
 * Uses HTTP for serverless/edge compatibility
 */
const connectionString = process.env.DATABASE_URL;

/**
 * Database client - undefined during build if DATABASE_URL is not set
 * This allows the build to succeed without a database connection
 */
export const db = connectionString
  ? drizzle(neon(connectionString), { schema })
  : (undefined as unknown as ReturnType<typeof drizzle<typeof schema>>);

/**
 * Export schema for use in queries
 */
export { schema };

/**
 * Export type helpers
 */
export type Database = typeof db;
