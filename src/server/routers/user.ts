import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { accounts, deliveryHistory, platformConnections, users } from '@/lib/db/schema';
import { protectedProcedure, publicProcedure, router } from '@/lib/trpc/init';

/**
 * User router - handles user profile and account operations
 */
export const userRouter = router({
  /**
   * Get current user profile
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id as string),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Get connected providers
    const connectedAccounts = await ctx.db.query.accounts.findMany({
      where: eq(accounts.userId, ctx.user.id as string),
      columns: {
        provider: true,
      },
    });

    return {
      ...user,
      connectedProviders: connectedAccounts.map((a) => a.provider),
    };
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id as string));

      return { success: true };
    }),

  /**
   * Get user statistics
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    // Get connected platforms count
    const connectionsResult = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformConnections)
      .where(eq(platformConnections.userId, ctx.user.id as string));

    // Get total deliveries tracked
    const deliveriesResult = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(deliveryHistory)
      .where(eq(deliveryHistory.userId, ctx.user.id as string));

    return {
      connectedPlatforms: connectionsResult[0]?.count ?? 0,
      totalDeliveries: deliveriesResult[0]?.count ?? 0,
    };
  }),

  /**
   * Delete user account
   */
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    // Delete user - cascade will handle related records
    await ctx.db.delete(users).where(eq(users.id, ctx.user.id as string));

    return { success: true };
  }),

  /**
   * Health check - public endpoint
   */
  healthCheck: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.2.0',
    };
  }),
});
