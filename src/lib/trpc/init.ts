import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';

/**
 * tRPC initialization for DropDeck
 * Configures transformer, error formatting, and base procedures
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
        code: error.code,
        retryable: isRetryableError(error.code),
      },
    };
  },
});

/**
 * Determine if an error is retryable
 */
function isRetryableError(code: string): boolean {
  const retryableCodes = ['TIMEOUT', 'TOO_MANY_REQUESTS', 'INTERNAL_SERVER_ERROR'];
  return retryableCodes.includes(code);
}

/**
 * Create router and merge routers
 */
export const router = t.router;

/**
 * Merge multiple routers
 */
export const mergeRouters = t.mergeRouters;

/**
 * Public procedure - no authentication required
 * Use for public endpoints like health checks
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - authentication required
 * Throws UNAUTHORIZED if no valid session
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      // Guaranteed to have user after this middleware
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});

/**
 * Create caller for server-side usage
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware helper
 */
export const middleware = t.middleware;
