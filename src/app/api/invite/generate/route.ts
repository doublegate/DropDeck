import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inviteCodes } from '@/lib/db/schema';

/**
 * Generate a random invite code
 */
function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 for clarity
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Request body schema for generating invite codes
 */
const generateSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
  maxRedemptions: z.number().int().min(1).max(1000).default(1),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  note: z.string().max(255).optional(),
});

/**
 * POST /api/invite/generate
 * Generate new invite codes (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add proper admin check
    // For now, we'll use an environment variable for admin emails
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());
    const isAdmin = session.user.email && adminEmails.includes(session.user.email);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = generateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { count, maxRedemptions, expiresInDays, note } = result.data;

    // Calculate expiration date
    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Generate codes
    const codes: string[] = [];
    const createdCodes: Array<{ code: string; id: string }> = [];

    for (let i = 0; i < count; i++) {
      let code: string;
      let attempts = 0;

      // Generate unique code
      do {
        code = generateCode();
        attempts++;
        if (attempts > 10) {
          throw new Error('Failed to generate unique code');
        }
      } while (codes.includes(code));

      codes.push(code);

      const [created] = await db
        .insert(inviteCodes)
        .values({
          code,
          createdBy: session.user.id,
          maxRedemptions,
          expiresAt,
          note,
        })
        .returning({ id: inviteCodes.id, code: inviteCodes.code });

      if (created) {
        createdCodes.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      codes: createdCodes,
      count: createdCodes.length,
      expiresAt,
    });
  } catch (error) {
    console.error('Error generating invite codes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
