/**
 * MSW request handlers for API mocking
 */

import { http, HttpResponse } from 'msw';
import { createMockDelivery, createMockDeliveries, createMockUser, createMockPlatformConfig, ALL_PLATFORMS } from '../utils/fixtures';

/**
 * Default handlers for all API routes
 */
export const handlers = [
  // Auth session
  http.get('/api/auth/session', () => {
    return HttpResponse.json({
      user: createMockUser(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }),

  // Get active deliveries
  http.get('/api/trpc/delivery.getActive', () => {
    return HttpResponse.json({
      result: {
        data: createMockDeliveries(3, { status: 'out_for_delivery' }),
      },
    });
  }),

  // Get delivery by ID
  http.get('/api/trpc/delivery.getById', ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get('input');
    const { id } = input ? JSON.parse(input) : { id: 'test-id' };

    return HttpResponse.json({
      result: {
        data: createMockDelivery({ id }),
      },
    });
  }),

  // Get delivery history
  http.get('/api/trpc/delivery.getHistory', () => {
    return HttpResponse.json({
      result: {
        data: createMockDeliveries(10, { status: 'delivered' }),
      },
    });
  }),

  // Get platform connections
  http.get('/api/trpc/platform.list', () => {
    return HttpResponse.json({
      result: {
        data: ALL_PLATFORMS.map((platform) => ({
          ...createMockPlatformConfig(platform),
          status: Math.random() > 0.5 ? 'connected' : 'disconnected',
          lastSyncAt: new Date().toISOString(),
        })),
      },
    });
  }),

  // Connect platform
  http.post('/api/trpc/platform.connect', async ({ request }) => {
    const body = await request.json() as { platform: string };
    return HttpResponse.json({
      result: {
        data: {
          success: true,
          platform: body.platform,
          authUrl: `https://${body.platform}.example.com/oauth/authorize`,
        },
      },
    });
  }),

  // Disconnect platform
  http.post('/api/trpc/platform.disconnect', async ({ request }) => {
    const body = await request.json() as { platform: string };
    return HttpResponse.json({
      result: {
        data: {
          success: true,
          platform: body.platform,
        },
      },
    });
  }),

  // Get user preferences
  http.get('/api/trpc/preference.get', () => {
    return HttpResponse.json({
      result: {
        data: {
          theme: 'system',
          notifications: {
            pushEnabled: true,
            inAppEnabled: true,
            soundEnabled: true,
            driverAssigned: true,
            outForDelivery: true,
            arrivingSoon: true,
            delivered: true,
            delayed: true,
          },
          defaultMapView: 'satellite',
          autoRefreshInterval: 30,
        },
      },
    });
  }),

  // Update user preferences
  http.post('/api/trpc/preference.update', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      result: {
        data: {
          success: true,
          ...body,
        },
      },
    });
  }),

  // Get user profile
  http.get('/api/trpc/user.getProfile', () => {
    return HttpResponse.json({
      result: {
        data: createMockUser(),
      },
    });
  }),

  // Update user profile
  http.post('/api/trpc/user.updateProfile', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      result: {
        data: {
          success: true,
          ...body,
        },
      },
    });
  }),

  // User stats
  http.get('/api/trpc/user.getStats', () => {
    return HttpResponse.json({
      result: {
        data: {
          totalDeliveries: 42,
          activeDeliveries: 3,
          connectedPlatforms: 5,
          avgDeliveryTime: 28,
        },
      },
    });
  }),
];

/**
 * Error handlers for testing error states
 */
export const errorHandlers = {
  // Unauthorized
  unauthorized: http.get('/api/auth/session', () => {
    return HttpResponse.json(null);
  }),

  // Server error
  serverError: http.get('/api/trpc/*', () => {
    return HttpResponse.json(
      { error: { message: 'Internal Server Error' } },
      { status: 500 }
    );
  }),

  // Network error
  networkError: http.get('/api/trpc/*', () => {
    return HttpResponse.error();
  }),

  // Rate limited
  rateLimited: http.get('/api/trpc/*', () => {
    return HttpResponse.json(
      { error: { message: 'Too many requests' } },
      { status: 429 }
    );
  }),
};
