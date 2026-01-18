import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, gt, sql } from 'drizzle-orm';
import { observable } from '@trpc/server/observable';
import { router, protectedProcedure } from '@/lib/trpc/init';
import { deliveryCache, deliveryHistory, platformConnections } from '@/lib/db/schema';
import { getAdapter } from '@/lib/adapters/registry';
import { decryptToken } from '@/lib/encryption/tokens';
import type { UnifiedDelivery, DriverLocation } from '@/types/delivery';

/**
 * Platform schema for validation
 */
const platformSchema = z.enum([
  'instacart',
  'doordash',
  'ubereats',
  'amazon_fresh',
  'walmart',
  'shipt',
  'drizly',
  'totalwine',
  'costco',
  'samsclub',
  'amazon',
]);

/**
 * Delivery router - handles delivery queries and subscriptions
 */
export const deliveryRouter = router({
  /**
   * Get all active deliveries across all connected platforms
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    // First check cache
    const cached = await ctx.db.query.deliveryCache.findMany({
      where: and(
        eq(deliveryCache.userId, ctx.user.id as string),
        gt(deliveryCache.expiresAt, new Date())
      ),
      orderBy: [deliveryCache.etaMinutes],
    });

    if (cached.length > 0) {
      return cached.map((c) => c.deliveryData as UnifiedDelivery);
    }

    // Fetch fresh from all connected platforms
    const connections = await ctx.db.query.platformConnections.findMany({
      where: and(
        eq(platformConnections.userId, ctx.user.id as string),
        eq(platformConnections.status, 'connected')
      ),
    });

    const deliveryPromises = connections.map(async (conn) => {
      try {
        if (!conn.accessTokenEncrypted) {
          console.error(`No access token for ${conn.platform}`);
          return [];
        }
        const adapter = getAdapter(conn.platform);
        const accessToken = decryptToken(conn.accessTokenEncrypted);
        return await adapter.getActiveDeliveries({
          accessToken,
          userId: ctx.user.id as string,
          platform: conn.platform,
        });
      } catch (error) {
        console.error(`Failed to fetch from ${conn.platform}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(deliveryPromises);
    const deliveries: UnifiedDelivery[] = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => (r as PromiseFulfilledResult<UnifiedDelivery[]>).value);

    // Cache results
    for (const delivery of deliveries) {
      const driverLocation = delivery.driver?.location
        ? {
            lat: delivery.driver.location.lat,
            lng: delivery.driver.location.lng,
            heading: delivery.driver.location.heading,
            speed: delivery.driver.location.speed,
            timestamp: delivery.driver.location.timestamp.toISOString(),
          }
        : null;

      await ctx.db
        .insert(deliveryCache)
        .values({
          userId: ctx.user.id as string,
          platform: delivery.platform,
          externalOrderId: delivery.externalOrderId,
          deliveryData: delivery,
          driverLocation,
          etaMinutes: delivery.eta.minutesRemaining,
          status: delivery.status,
          expiresAt: new Date(Date.now() + 30 * 1000), // 30 second cache
        })
        .onConflictDoNothing();
    }

    // Sort by ETA
    return deliveries.sort((a, b) => a.eta.minutesRemaining - b.eta.minutesRemaining);
  }),

  /**
   * Get single delivery details
   */
  getById: protectedProcedure
    .input(
      z.object({
        platform: platformSchema,
        deliveryId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.platformConnections.findFirst({
        where: and(
          eq(platformConnections.userId, ctx.user.id as string),
          eq(platformConnections.platform, input.platform)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Not connected to ${input.platform}`,
        });
      }

      if (!connection.accessTokenEncrypted) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `No access token for ${input.platform}`,
        });
      }

      const adapter = getAdapter(input.platform);
      const accessToken = decryptToken(connection.accessTokenEncrypted);

      return adapter.getDeliveryDetails(
        { accessToken, userId: ctx.user.id as string, platform: connection.platform },
        input.deliveryId
      );
    }),

  /**
   * Get delivery history with pagination
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        platform: platformSchema.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const baseWhere = eq(deliveryHistory.userId, ctx.user.id as string);
      const where = input.platform
        ? and(baseWhere, eq(deliveryHistory.platform, input.platform))
        : baseWhere;

      const [items, totalResult] = await Promise.all([
        ctx.db.query.deliveryHistory.findMany({
          where,
          orderBy: [desc(deliveryHistory.orderedAt)],
          limit: input.limit,
          offset: input.offset,
        }),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(deliveryHistory).where(where),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
        items: items.map((h) => h.deliveryData as UnifiedDelivery),
        total,
        hasMore: input.offset + items.length < total,
      };
    }),

  /**
   * Subscribe to delivery updates (WebSocket/SSE)
   */
  onUpdate: protectedProcedure.subscription(({ ctx }) => {
    return observable<UnifiedDelivery>((emit) => {
      const channel = `user:${ctx.user.id}:deliveries`;

      // Subscribe to Redis channel if available
      if (ctx.redis) {
        // Note: Redis subscription handling would be set up here
        // For now, we return a cleanup function
        console.log(`Subscribed to ${channel}`);
      }

      // Example: emit updates (in production, this would be from Redis pub/sub)
      void emit;

      return () => {
        console.log(`Unsubscribed from ${channel}`);
      };
    });
  }),

  /**
   * Subscribe to high-frequency location updates
   */
  onLocationUpdate: protectedProcedure
    .input(z.object({ deliveryId: z.string() }))
    .subscription(({ input }) => {
      return observable<DriverLocation>(() => {
        const channel = `delivery:${input.deliveryId}:location`;

        // Note: Redis subscription handling would be set up here
        console.log(`Subscribed to ${channel}`);

        return () => {
          console.log(`Unsubscribed from ${channel}`);
        };
      });
    }),
});
