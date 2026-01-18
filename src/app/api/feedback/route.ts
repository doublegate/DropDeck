import { desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';

/**
 * Request body schema for submitting feedback
 */
const feedbackSchema = z.object({
  category: z.enum([
    'bug',
    'feature_request',
    'ux_improvement',
    'platform_issue',
    'performance',
    'other',
  ]),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  metadata: z
    .object({
      url: z.string().url().optional(),
      platform: z.string().optional(),
      userAgent: z.string().optional(),
      screenshot: z.string().optional(), // Base64 or URL
    })
    .optional(),
});

/**
 * POST /api/feedback
 * Submit feedback
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
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { category, title, description, metadata } = result.data;

    // Create feedback record
    const [created] = await db
      .insert(feedback)
      .values({
        userId,
        category,
        title,
        description,
        metadata: metadata ?? null,
      })
      .returning({ id: feedback.id });

    return NextResponse.json({
      success: true,
      feedbackId: created?.id,
      message: 'Thank you for your feedback!',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/feedback
 * Get user's submitted feedback
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's feedback
    const userFeedback = await db.query.feedback.findMany({
      where: eq(feedback.userId, userId),
      orderBy: [desc(feedback.createdAt)],
    });

    return NextResponse.json({
      feedback: userFeedback.map((f) => ({
        id: f.id,
        category: f.category,
        title: f.title,
        description: f.description,
        status: f.status,
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
