import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getAdapter } from '@/lib/adapters/registry';
import { platformConnections } from '@/lib/db/schema';
import { decryptToken, encryptToken } from '@/lib/encryption/tokens';
import { protectedProcedure, router } from '@/lib/trpc/init';

/**
 * Zod schema for platform validation
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
 * Platform router - handles platform connections and OAuth
 */
export const platformRouter = router({
  /**
   * Get all platform connections for the current user
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    const connections = await ctx.db.query.platformConnections.findMany({
      where: eq(platformConnections.userId, ctx.user.id as string),
      columns: {
        id: true,
        platform: true,
        status: true,
        lastSyncAt: true,
        expiresAt: true,
        metadata: true,
        createdAt: true,
      },
    });

    return connections.map((conn) => ({
      ...conn,
      isExpiringSoon: conn.expiresAt
        ? conn.expiresAt.getTime() - Date.now() < 5 * 60 * 1000
        : false,
    }));
  }),

  /**
   * Get single platform connection
   */
  getConnection: protectedProcedure
    .input(z.object({ platform: platformSchema }))
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.platformConnections.findFirst({
        where: and(
          eq(platformConnections.userId, ctx.user.id as string),
          eq(platformConnections.platform, input.platform)
        ),
      });

      if (!connection) {
        return { connected: false, platform: input.platform };
      }

      return {
        connected: connection.status === 'connected',
        platform: connection.platform,
        status: connection.status,
        lastSyncAt: connection.lastSyncAt,
        expiresAt: connection.expiresAt,
        metadata: connection.metadata,
      };
    }),

  /**
   * Initiate OAuth flow for a platform
   */
  initiateOAuth: protectedProcedure
    .input(z.object({ platform: platformSchema }))
    .mutation(async ({ ctx, input }) => {
      const adapter = getAdapter(input.platform);

      if (!adapter.supportsOAuth()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `${input.platform} does not support OAuth authentication`,
        });
      }

      const state = crypto.randomUUID();

      // Store state for verification
      if (ctx.redis) {
        await ctx.redis.set(
          `oauth_state:${state}`,
          JSON.stringify({
            userId: ctx.user.id,
            platform: input.platform,
            timestamp: Date.now(),
          }),
          { ex: 600 } // 10 minute expiry
        );
      }

      const authUrl = await adapter.getOAuthUrl(ctx.user.id as string, state);

      return { authUrl, state };
    }),

  /**
   * Handle OAuth callback
   */
  handleCallback: protectedProcedure
    .input(
      z.object({
        platform: platformSchema,
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.redis) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Redis not available',
        });
      }

      // Verify state
      const stateData = await ctx.redis.get(`oauth_state:${input.state}`);
      if (!stateData) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or expired OAuth state',
        });
      }

      const { userId, platform } = JSON.parse(stateData as string);
      if (userId !== ctx.user.id || platform !== input.platform) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'OAuth state mismatch',
        });
      }

      // Delete state
      await ctx.redis.del(`oauth_state:${input.state}`);

      // Exchange code for tokens
      const adapter = getAdapter(input.platform);
      const tokens = await adapter.exchangeCode(input.code);

      // Encrypt and store
      const accessTokenEncrypted = encryptToken(tokens.accessToken);
      const refreshTokenEncrypted = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

      await ctx.db
        .insert(platformConnections)
        .values({
          userId: ctx.user.id as string,
          platform: input.platform,
          accessTokenEncrypted,
          refreshTokenEncrypted,
          expiresAt: tokens.expiresAt,
          status: 'connected',
          lastSyncAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [platformConnections.userId, platformConnections.platform],
          set: {
            accessTokenEncrypted,
            refreshTokenEncrypted,
            expiresAt: tokens.expiresAt,
            status: 'connected',
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  /**
   * Disconnect a platform
   */
  disconnect: protectedProcedure
    .input(z.object({ platform: platformSchema }))
    .mutation(async ({ ctx, input }) => {
      // Try to revoke token at platform
      try {
        const connection = await ctx.db.query.platformConnections.findFirst({
          where: and(
            eq(platformConnections.userId, ctx.user.id as string),
            eq(platformConnections.platform, input.platform)
          ),
        });

        if (connection?.accessTokenEncrypted) {
          const adapter = getAdapter(input.platform);
          const accessToken = decryptToken(connection.accessTokenEncrypted);
          await adapter.revokeToken?.(accessToken);
        }
      } catch {
        // Continue even if revocation fails
      }

      // Delete connection
      await ctx.db
        .delete(platformConnections)
        .where(
          and(
            eq(platformConnections.userId, ctx.user.id as string),
            eq(platformConnections.platform, input.platform)
          )
        );

      // Clear cached deliveries
      if (ctx.redis) {
        await ctx.redis.del(`user:${ctx.user.id}:deliveries:${input.platform}`);
      }

      return { success: true };
    }),

  /**
   * Force refresh platform tokens
   */
  refresh: protectedProcedure
    .input(z.object({ platform: platformSchema }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.query.platformConnections.findFirst({
        where: and(
          eq(platformConnections.userId, ctx.user.id as string),
          eq(platformConnections.platform, input.platform)
        ),
      });

      if (!connection?.refreshTokenEncrypted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No refresh token available',
        });
      }

      const adapter = getAdapter(input.platform);
      const refreshToken = decryptToken(connection.refreshTokenEncrypted);
      const tokens = await adapter.refreshToken(refreshToken);

      const accessTokenEncrypted = encryptToken(tokens.accessToken);
      const refreshTokenEncrypted = tokens.refreshToken
        ? encryptToken(tokens.refreshToken)
        : connection.refreshTokenEncrypted;

      await ctx.db
        .update(platformConnections)
        .set({
          accessTokenEncrypted,
          refreshTokenEncrypted,
          expiresAt: tokens.expiresAt,
          status: 'connected',
          updatedAt: new Date(),
        })
        .where(eq(platformConnections.id, connection.id));

      return { success: true, expiresAt: tokens.expiresAt };
    }),

  /**
   * Test platform connectivity
   */
  testConnection: protectedProcedure
    .input(z.object({ platform: platformSchema }))
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.query.platformConnections.findFirst({
        where: and(
          eq(platformConnections.userId, ctx.user.id as string),
          eq(platformConnections.platform, input.platform)
        ),
      });

      if (!connection) {
        return { connected: false, error: 'Not connected' };
      }

      if (!connection.accessTokenEncrypted) {
        return { connected: false, error: 'No access token' };
      }

      try {
        const adapter = getAdapter(input.platform);
        const accessToken = decryptToken(connection.accessTokenEncrypted);
        await adapter.testConnection(accessToken);
        return { connected: true };
      } catch (error) {
        return {
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        };
      }
    }),
});
