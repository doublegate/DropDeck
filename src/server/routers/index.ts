import { router } from '@/lib/trpc/init';
import { platformRouter } from './platform';
import { deliveryRouter } from './delivery';
import { preferenceRouter } from './preference';
import { userRouter } from './user';

/**
 * Root router for DropDeck API
 * All sub-routers are merged here
 */
export const appRouter = router({
  platform: platformRouter,
  delivery: deliveryRouter,
  preference: preferenceRouter,
  user: userRouter,
});

/**
 * Type definition for the app router
 * Used by tRPC client for type inference
 */
export type AppRouter = typeof appRouter;
