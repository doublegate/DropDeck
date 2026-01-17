import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deliveryCache } from '@/lib/db/schema';
import { redis, cacheKeys, ttl } from '@/lib/realtime/redis';
import { getAdapter, hasAdapter, PlatformDataError } from '@/lib/adapters';
import { publishDeliveryUpdate, publishLocationUpdate } from '@/lib/realtime/pubsub';
import { checkRateLimit, webhookRateLimiter, getRateLimitHeaders } from '@/lib/ratelimit';
import type { Platform } from '@/types/platform';

/**
 * Webhook handler for platform delivery updates
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  // Validate platform
  if (!hasAdapter(platform as Platform)) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(webhookRateLimiter, `webhook:${platform}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    // Parse body
    const body = await req.json();
    const signature = req.headers.get('x-webhook-signature') ?? req.headers.get('x-signature');

    // Get adapter
    const adapter = getAdapter(platform as Platform);

    // Verify webhook signature
    if (!adapter.supportsWebhooks()) {
      return NextResponse.json({ error: 'Webhooks not supported' }, { status: 400 });
    }

    if (!adapter.verifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Idempotency check
    const eventId = body.event_id || body.id || crypto.randomUUID();
    const idempotencyKey = cacheKeys.webhookIdempotency(platform, eventId);

    if (redis) {
      const exists = await redis.get(idempotencyKey);
      if (exists) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      // Mark as processed
      await redis.set(idempotencyKey, '1', { ex: ttl.webhookIdempotency });
    }

    // Normalize webhook payload
    const webhookPayload = {
      platform: platform as Platform,
      eventType: body.event_type || body.type || 'update',
      eventId,
      timestamp: new Date(),
      data: body,
    };

    const delivery = adapter.normalizeWebhookPayload(webhookPayload);

    if (!delivery) {
      // Webhook doesn't contain delivery data (e.g., test ping)
      return NextResponse.json({ received: true, processed: false });
    }

    // Find user from cached delivery
    const cached = await db.query.deliveryCache.findFirst({
      where: eq(deliveryCache.externalOrderId, delivery.externalOrderId),
    });

    if (cached) {
      // Convert DriverLocation to match schema (Date -> string for timestamp)
      const driverLocation = delivery.driver?.location
        ? {
            lat: delivery.driver.location.lat,
            lng: delivery.driver.location.lng,
            heading: delivery.driver.location.heading,
            speed: delivery.driver.location.speed,
            timestamp: delivery.driver.location.timestamp.toISOString(),
          }
        : null;

      // Update cache
      await db
        .update(deliveryCache)
        .set({
          deliveryData: delivery,
          driverLocation,
          etaMinutes: delivery.eta.minutesRemaining,
          status: delivery.status,
          lastUpdated: new Date(),
          expiresAt: new Date(Date.now() + ttl.deliveryCache * 1000),
        })
        .where(eq(deliveryCache.id, cached.id));

      // Publish delivery update
      await publishDeliveryUpdate(cached.userId, {
        deliveryId: delivery.id,
        platform: delivery.platform,
        status: delivery.status,
        statusLabel: delivery.statusLabel,
        eta: delivery.eta.minutesRemaining,
        delivery,
      });

      // Publish location update if available
      if (delivery.driver?.location) {
        await publishLocationUpdate(cached.userId, delivery.id, {
          deliveryId: delivery.id,
          platform: delivery.platform,
          location: delivery.driver.location,
        });
      }
    }

    return NextResponse.json({
      received: true,
      processed: !!cached,
    });
  } catch (error) {
    console.error(`Webhook error for ${platform}:`, error);

    if (error instanceof PlatformDataError) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Health check for webhook endpoint
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!hasAdapter(platform as Platform)) {
    return NextResponse.json({ error: 'Unknown platform' }, { status: 400 });
  }

  return NextResponse.json({
    platform,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
