import type { Session } from 'next-auth';
import type { Redis } from '@upstash/redis';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redis } from '@/lib/realtime/redis';

/**
 * Context available in every tRPC procedure
 */
export interface Context {
  /** Database client */
  db: typeof db;
  /** Redis client for caching and pub/sub */
  redis: Redis | null;
  /** Current session (may be null if not authenticated) */
  session: Session | null;
  /** Current user (extracted from session for convenience) */
  user: Session['user'] | null;
  /** Request headers */
  headers: Headers;
  /** Request source (for rate limiting) */
  source: 'client' | 'server';
}

/**
 * Options for creating context
 */
interface CreateContextOptions {
  headers: Headers;
  session?: Session | null;
}

/**
 * Create context for tRPC procedures
 * Called for every request
 */
export async function createContext(opts: CreateContextOptions): Promise<Context> {
  // Get session if not provided
  const session = opts.session ?? (await auth());

  return {
    db,
    redis,
    session,
    user: session?.user ?? null,
    headers: opts.headers,
    source: 'client',
  };
}

/**
 * Create context for server-side calls
 * Used when calling tRPC procedures directly from server components
 */
export async function createServerContext(): Promise<Context> {
  const session = await auth();

  return {
    db,
    redis,
    session,
    user: session?.user ?? null,
    headers: new Headers(),
    source: 'server',
  };
}

/**
 * Type for context with authenticated user
 * Use this when you need guaranteed user access
 */
export interface AuthenticatedContext extends Context {
  session: Session;
  user: NonNullable<Session['user']>;
}
