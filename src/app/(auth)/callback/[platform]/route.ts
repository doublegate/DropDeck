import { NextRequest, NextResponse } from 'next/server';
import { getAdapterAsync } from '@/lib/adapters/registry';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { platformConnections } from '@/lib/db/schema';
import { encryptToken } from '@/lib/encryption/tokens';
import { redis } from '@/lib/realtime/redis';
import type { Platform } from '@/types/platform';

/**
 * Valid OAuth platforms
 */
const OAUTH_PLATFORMS = ['instacart', 'doordash', 'ubereats', 'amazon', 'amazon_fresh'] as const;

type OAuthPlatform = (typeof OAUTH_PLATFORMS)[number];

function isOAuthPlatform(platform: string): platform is OAuthPlatform {
  return OAUTH_PLATFORMS.includes(platform as OAuthPlatform);
}

/**
 * OAuth State data stored in Redis
 */
interface OAuthState {
  userId: string;
  platform: Platform;
  timestamp: number;
  codeVerifier?: string; // For PKCE (Uber Eats)
}

/**
 * OAuth callback handler
 *
 * Handles the OAuth 2.0 authorization code callback for delivery platforms.
 * This route is accessed after a user authorizes access on the platform's OAuth page.
 *
 * Query parameters:
 * - code: Authorization code from the platform
 * - state: State parameter for CSRF protection
 * - error: Error code if authorization failed
 * - error_description: Human-readable error description
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
  const { platform } = await params;

  // Validate platform
  if (!isOAuthPlatform(platform)) {
    return NextResponse.redirect(
      new URL(`/settings/connections?error=invalid_platform&platform=${platform}`, request.url)
    );
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors from the platform
  if (error) {
    console.error(`[OAuth:${platform}] Authorization error:`, error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/settings/connections?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription ?? '')}&platform=${platform}`,
        request.url
      )
    );
  }

  // Validate required parameters
  if (!code || !state) {
    console.error(`[OAuth:${platform}] Missing code or state parameter`);
    return NextResponse.redirect(
      new URL(`/settings/connections?error=missing_params&platform=${platform}`, request.url)
    );
  }

  try {
    // Get authenticated user session
    const session = await auth();
    if (!session?.user?.id) {
      console.error(`[OAuth:${platform}] No authenticated session`);
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=/settings/connections`, request.url)
      );
    }

    // Verify state from Redis
    if (!redis) {
      console.error(`[OAuth:${platform}] Redis not available`);
      return NextResponse.redirect(
        new URL(`/settings/connections?error=server_error&platform=${platform}`, request.url)
      );
    }

    const stateDataRaw = await redis.get(`oauth_state:${state}`);
    if (!stateDataRaw) {
      console.error(`[OAuth:${platform}] Invalid or expired OAuth state`);
      return NextResponse.redirect(
        new URL(`/settings/connections?error=invalid_state&platform=${platform}`, request.url)
      );
    }

    const stateData = JSON.parse(stateDataRaw as string) as OAuthState;

    // Validate state matches current user and platform
    if (stateData.userId !== session.user.id) {
      console.error(`[OAuth:${platform}] User ID mismatch in state`);
      return NextResponse.redirect(
        new URL(`/settings/connections?error=state_mismatch&platform=${platform}`, request.url)
      );
    }

    if (stateData.platform !== platform) {
      console.error(`[OAuth:${platform}] Platform mismatch in state`);
      return NextResponse.redirect(
        new URL(`/settings/connections?error=state_mismatch&platform=${platform}`, request.url)
      );
    }

    // Check state expiration (10 minutes)
    if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
      console.error(`[OAuth:${platform}] State expired`);
      await redis.del(`oauth_state:${state}`);
      return NextResponse.redirect(
        new URL(`/settings/connections?error=state_expired&platform=${platform}`, request.url)
      );
    }

    // Delete state (one-time use)
    await redis.del(`oauth_state:${state}`);

    // Get adapter and exchange code for tokens
    const adapter = await getAdapterAsync(platform as Platform);

    let tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date; scope?: string };
    if (platform === 'ubereats' && stateData.codeVerifier) {
      // Uber Eats uses PKCE - need to pass code verifier
      // The exchangeCodeWithPKCE is defined in ubereats adapter
      const ubereatsAdapter = adapter as unknown as {
        exchangeCodeWithPKCE: (
          code: string,
          verifier: string
        ) => Promise<{
          accessToken: string;
          refreshToken?: string;
          expiresAt?: Date;
          scope?: string;
        }>;
      };
      tokens = await ubereatsAdapter.exchangeCodeWithPKCE(code, stateData.codeVerifier);
    } else {
      tokens = await adapter.exchangeCode(code);
    }

    // Encrypt tokens
    const accessTokenEncrypted = encryptToken(tokens.accessToken);
    const refreshTokenEncrypted = tokens.refreshToken ? encryptToken(tokens.refreshToken) : null;

    // Store or update platform connection
    await db
      .insert(platformConnections)
      .values({
        userId: session.user.id,
        platform: platform as Platform,
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

    console.log(`[OAuth:${platform}] Successfully connected for user ${session.user.id}`);

    // Redirect to connections page with success
    return NextResponse.redirect(
      new URL(`/settings/connections?success=true&platform=${platform}`, request.url)
    );
  } catch (err) {
    console.error(`[OAuth:${platform}] Callback error:`, err);

    const errorMessage = err instanceof Error ? err.message : 'Unknown error during OAuth callback';

    return NextResponse.redirect(
      new URL(
        `/settings/connections?error=callback_failed&description=${encodeURIComponent(errorMessage)}&platform=${platform}`,
        request.url
      )
    );
  }
}

/**
 * Handle POST requests (some platforms may use POST for callback)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ platform: string }> }
): Promise<NextResponse> {
  // Convert POST body to query params and delegate to GET
  try {
    const formData = await request.formData();
    const url = new URL(request.url);

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        url.searchParams.set(key, value);
      }
    }

    const newRequest = new NextRequest(url, {
      method: 'GET',
      headers: request.headers,
    });

    return GET(newRequest, context);
  } catch {
    const { platform } = await context.params;
    return NextResponse.redirect(
      new URL(`/settings/connections?error=invalid_request&platform=${platform}`, request.url)
    );
  }
}
