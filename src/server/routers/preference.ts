import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { userPreferences } from '@/lib/db/schema';
import { protectedProcedure, router } from '@/lib/trpc/init';

/**
 * Notification settings schema
 */
const notificationSettingsSchema = z.object({
  driverAssigned: z.boolean(),
  outForDelivery: z.boolean(),
  arrivingSoon: z.boolean(),
  delivered: z.boolean(),
  delayed: z.boolean(),
  quietHours: z
    .object({
      enabled: z.boolean(),
      start: z.string(),
      end: z.string(),
    })
    .optional(),
});

/**
 * Theme enum
 */
const themeSchema = z.enum(['light', 'dark', 'system']);

/**
 * Sort order enum
 */
const sortOrderSchema = z.enum(['eta', 'alphabetical', 'recent', 'manual']);

/**
 * Preference router - handles user preferences
 */
export const preferenceRouter = router({
  /**
   * Get user preferences
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, ctx.user.id as string),
    });

    if (!prefs) {
      // Return defaults
      return {
        theme: 'system' as const,
        sortOrder: 'eta' as const,
        enabledPlatforms: [] as string[],
        manualPlatformOrder: null as string[] | null,
        notificationsEnabled: true,
        notificationSettings: null,
      };
    }

    return prefs;
  }),

  /**
   * Update user preferences
   */
  update: protectedProcedure
    .input(
      z.object({
        theme: themeSchema.optional(),
        sortOrder: sortOrderSchema.optional(),
        enabledPlatforms: z.array(z.string()).optional(),
        manualPlatformOrder: z.array(z.string()).optional().nullable(),
        notificationsEnabled: z.boolean().optional(),
        notificationSettings: notificationSettingsSchema.optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Filter out undefined values
      const updateData: Record<string, unknown> = {};
      if (input.theme !== undefined) updateData.theme = input.theme;
      if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
      if (input.enabledPlatforms !== undefined)
        updateData.enabledPlatforms = input.enabledPlatforms;
      if (input.manualPlatformOrder !== undefined)
        updateData.manualPlatformOrder = input.manualPlatformOrder;
      if (input.notificationsEnabled !== undefined)
        updateData.notificationsEnabled = input.notificationsEnabled;
      if (input.notificationSettings !== undefined)
        updateData.notificationSettings = input.notificationSettings;

      await ctx.db
        .insert(userPreferences)
        .values({
          userId: ctx.user.id as string,
          ...updateData,
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            ...updateData,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }),

  /**
   * Reset preferences to defaults
   */
  reset: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(userPreferences).where(eq(userPreferences.userId, ctx.user.id as string));

    return {
      theme: 'system' as const,
      sortOrder: 'eta' as const,
      enabledPlatforms: [] as string[],
      manualPlatformOrder: null,
      notificationsEnabled: true,
      notificationSettings: null,
    };
  }),
});
