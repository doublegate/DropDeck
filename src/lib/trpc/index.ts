/**
 * tRPC exports for DropDeck
 */

// Client
export { trpc as trpcClient } from './client';
export type { AuthenticatedContext, Context } from './context';
// Context
export { createContext, createServerContext } from './context';
// Server-side initialization
export {
  createCallerFactory,
  middleware,
  protectedProcedure,
  publicProcedure,
  router,
} from './init';
