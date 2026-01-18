import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inviteCodes, inviteRedemptions, userPreferences } from '@/lib/db/schema';

/**
 * Request body schema for redeeming an invite code
 */
const redeemSchema = z.object({
  code: z
    .string()
    .min(4)
    .max(32)
    .transform((val) => val.toUpperCase().trim()),
});

/**
 * POST /api/invite
 * Redeem an invite code
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse and validate request body
    const body = await request.json();
    const result = redeemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { code } = result.data;

    // Check if user already redeemed an invite code
    const existingRedemption = await db.query.inviteRedemptions.findFirst({
      where: eq(inviteRedemptions.userId, userId),
    });

    if (existingRedemption) {
      return NextResponse.json(
        { error: 'You have already redeemed an invite code' },
        { status: 400 }
      );
    }

    // Find the invite code
    const inviteCode = await db.query.inviteCodes.findFirst({
      where: and(eq(inviteCodes.code, code), eq(inviteCodes.status, 'active')),
    });

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // Check if code is exhausted
    if (inviteCode.redemptionCount >= inviteCode.maxRedemptions) {
      return NextResponse.json(
        { error: 'This invite code has been fully redeemed' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 });
    }

    // Redeem the code in a transaction
    await db.transaction(async (tx) => {
      // Create redemption record
      await tx.insert(inviteRedemptions).values({
        inviteCodeId: inviteCode.id,
        userId,
      });

      // Increment redemption count
      await tx
        .update(inviteCodes)
        .set({
          redemptionCount: inviteCode.redemptionCount + 1,
          status:
            inviteCode.redemptionCount + 1 >= inviteCode.maxRedemptions ? 'exhausted' : 'active',
        })
        .where(eq(inviteCodes.id, inviteCode.id));

      // Update user preferences to mark as beta user
      await tx
        .insert(userPreferences)
        .values({
          userId,
          isBeta: true,
          betaJoinedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userPreferences.userId,
          set: {
            isBeta: true,
            betaJoinedAt: new Date(),
          },
        });
    });

    return NextResponse.json({
      success: true,
      message: 'Welcome to the DropDeck beta!',
    });
  } catch (error) {
    console.error('Error redeeming invite code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/invite
 * Check if user has redeemed an invite code
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check user's beta status
    const preferences = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    // Check for redemption record
    const redemption = await db.query.inviteRedemptions.findFirst({
      where: eq(inviteRedemptions.userId, userId),
      with: {
        inviteCode: true,
      },
    });

    return NextResponse.json({
      isBeta: preferences?.isBeta ?? false,
      betaJoinedAt: preferences?.betaJoinedAt ?? null,
      hasRedeemed: !!redemption,
      inviteCode: redemption?.inviteCode?.code ?? null,
    });
  } catch (error) {
    console.error('Error checking invite status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
