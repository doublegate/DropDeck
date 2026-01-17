/**
 * tRPC exports for DropDeck
 */

// Server-side initialization
export { router, publicProcedure, protectedProcedure, middleware, createCallerFactory } from './init';

// Context
export { createContext, createServerContext } from './context';
export type { Context, AuthenticatedContext } from './context';

// Client
export { trpc as trpcClient } from './client';
