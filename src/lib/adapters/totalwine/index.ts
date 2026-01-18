import crypto from 'node:crypto';
import { z } from 'zod';
import { checkRateLimit, createPlatformRateLimiter } from '@/lib/ratelimit';
import type { DeliveryStatus, DriverLocation, UnifiedDelivery } from '@/types/delivery';
import { PlatformAdapter } from '../base';
import {
  PlatformAuthError,
  PlatformNetworkError,
  PlatformRateLimitError,
  PlatformUnavailableError,
} from '../errors';
import { totalwineStatusMap } from '../status-map';
import type { AdapterConnection, AdapterMetadata, WebhookPayload } from '../types';
import { maskPhoneNumber, withRetry } from '../utils';

// ============================================
// Total Wine / Onfleet Types
// ============================================

const OnfleetWorkerSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  imageUrl: z.string().optional(),
  location: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
  vehicle: z
    .object({
      type: z.string().optional(),
      description: z.string().optional(),
      licensePlate: z.string().optional(),
      color: z.string().optional(),
    })
    .optional(),
});

const OnfleetTaskSchema = z.object({
  id: z.string(),
  shortId: z.string().optional(),
  trackingURL: z.string().optional(),
  state: z.number(), // 0=unassigned, 1=assigned, 2=active, 3=completed
  completeAfter: z.number().optional(),
  completeBefore: z.number().optional(),
  timeCreated: z.number(),
  timeLastModified: z.number(),
  completionDetails: z
    .object({
      success: z.boolean().optional(),
      notes: z.string().optional(),
      photoUploadId: z.string().optional(),
      time: z.number().optional(),
    })
    .optional(),
  destination: z.object({
    id: z.string().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string().optional(),
    }),
    location: z.tuple([z.number(), z.number()]).optional(), // [lng, lat]
    notes: z.string().optional(),
  }),
  recipients: z
    .array(
      z.object({
        name: z.string(),
        phone: z.string().optional(),
      })
    )
    .optional(),
  eta: z.number().optional(),
  worker: z.string().optional(), // Worker ID
});

type OnfleetTask = z.infer<typeof OnfleetTaskSchema>;
type OnfleetWorker = z.infer<typeof OnfleetWorkerSchema>;

const OnfleetWebhookSchema = z.object({
  triggerId: z.number(),
  triggerName: z.string(),
  taskId: z.string(),
  workerId: z.string().optional(),
  time: z.number(),
  data: z.object({
    task: OnfleetTaskSchema.optional(),
    worker: OnfleetWorkerSchema.optional(),
  }),
});

/**
 * Total Wine Platform Adapter
 *
 * Implements Onfleet API integration for Total Wine delivery tracking.
 * Uses API key authentication for Onfleet.
 */
export class TotalWineAdapter extends PlatformAdapter {
  readonly metadata: AdapterMetadata = {
    platformId: 'totalwine',
    displayName: 'Total Wine',
    iconUrl: '/icons/totalwine.svg',
    primaryColor: '#6D2C41',
    capabilities: {
      oauth: false,
      webhooks: true,
      liveLocation: true,
      driverContact: false,
      sessionAuth: false,
      orderItems: false, // Onfleet doesn't provide item details
      etaUpdates: true,
    },
    minPollingInterval: 30,
    maxPollingInterval: 180,
    defaultPollingInterval: 60,
    apiBaseUrl: 'https://onfleet.com/api/v2',
  };

  private readonly baseUrl = 'https://onfleet.com/api/v2';
  private readonly rateLimiter = createPlatformRateLimiter('totalwine');
  private readonly webhookSecret = process.env.TOTALWINE_WEBHOOK_SECRET ?? '';

  // ============================================
  // OAuth Methods (Uses API Key instead)
  // ============================================

  override supportsOAuth(): boolean {
    return false;
  }

  override async testConnection(accessToken: string): Promise<void> {
    await this.makeRequest('/organization', accessToken);
  }

  // ============================================
  // Delivery Methods
  // ============================================

  async getActiveDeliveries(connection: AdapterConnection): Promise<UnifiedDelivery[]> {
    // Get active tasks (state 1=assigned, 2=active)
    const [assignedData, activeData] = await Promise.all([
      this.makeRequest<OnfleetTask[]>('/tasks?state=1', connection.accessToken),
      this.makeRequest<OnfleetTask[]>('/tasks?state=2', connection.accessToken),
    ]);

    const tasks = [...assignedData, ...activeData];
    const deliveries: UnifiedDelivery[] = [];

    for (const task of tasks) {
      // Fetch worker details if assigned
      let worker: OnfleetWorker | undefined;
      if (task.worker) {
        try {
          worker = await this.makeRequest<OnfleetWorker>(
            `/workers/${task.worker}`,
            connection.accessToken
          );
        } catch {
          // Worker fetch failed, continue without
        }
      }
      deliveries.push(this.normalizeTask(task, worker));
    }

    return deliveries;
  }

  async getDeliveryDetails(
    connection: AdapterConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery> {
    const taskId = deliveryId.startsWith('to_') ? deliveryId.slice(3) : deliveryId;
    const task = await this.makeRequest<OnfleetTask>(`/tasks/${taskId}`, connection.accessToken);

    let worker: OnfleetWorker | undefined;
    if (task.worker) {
      try {
        worker = await this.makeRequest<OnfleetWorker>(
          `/workers/${task.worker}`,
          connection.accessToken
        );
      } catch {
        // Continue without worker
      }
    }

    return this.normalizeTask(task, worker);
  }

  // ============================================
  // Webhook Methods
  // ============================================

  override supportsWebhooks(): boolean {
    return true;
  }

  override verifyWebhook(payload: unknown, signature: string | null): boolean {
    if (!signature || !this.webhookSecret) {
      return false;
    }

    try {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(payloadString)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  override normalizeWebhookPayload(payload: WebhookPayload): UnifiedDelivery | null {
    try {
      const parsed = OnfleetWebhookSchema.parse(payload.data);
      if (!parsed.data.task) return null;
      return this.normalizeTask(parsed.data.task, parsed.data.worker);
    } catch {
      return null;
    }
  }

  // ============================================
  // HTTP Request Helper
  // ============================================

  private async makeRequest<T>(
    endpoint: string,
    apiKey: string,
    options: { method?: string; body?: unknown } = {}
  ): Promise<T> {
    if (this.rateLimiter) {
      const result = await checkRateLimit(this.rateLimiter, 'totalwine-api');
      if (!result.success) {
        throw new PlatformRateLimitError(
          'totalwine',
          Math.ceil((result.reset - Date.now()) / 1000)
        );
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const fetchFn = async (): Promise<T> => {
      try {
        const response = await fetch(url, {
          method: options.method ?? 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new PlatformAuthError('totalwine');
        }
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('X-RateLimit-Reset') ?? '60', 10);
          throw new PlatformRateLimitError('totalwine', retryAfter);
        }
        if (response.status >= 500) {
          throw new PlatformUnavailableError('totalwine');
        }
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new PlatformNetworkError('totalwine', 'Request timeout');
        }
        throw error;
      }
    };

    return withRetry(fetchFn, 3, 1000);
  }

  // ============================================
  // Status Mapping
  // ============================================

  mapStatus(platformStatus: string): DeliveryStatus {
    const normalized = platformStatus.toLowerCase().replace(/[- ]/g, '_');
    return totalwineStatusMap[normalized] ?? 'preparing';
  }

  /**
   * Map Onfleet task state to status string
   */
  private mapTaskState(state: number, completionDetails?: { success?: boolean }): string {
    if (state === 3) {
      return completionDetails?.success ? 'delivered' : 'cancelled';
    }
    if (state === 2) return 'out_for_delivery';
    if (state === 1) return 'ready';
    return 'submitted';
  }

  // ============================================
  // Private Methods
  // ============================================

  private normalizeTask(task: OnfleetTask, worker?: OnfleetWorker): UnifiedDelivery {
    const statusString = this.mapTaskState(task.state, task.completionDetails);
    const status = this.mapStatus(statusString);
    const now = new Date();

    // Parse ETA
    const etaMs = task.eta ?? (task.completeBefore ? task.completeBefore - Date.now() : 0);
    const minutesRemaining = Math.max(0, Math.round(etaMs / 60000));
    const estimatedArrival = task.eta
      ? new Date(task.eta)
      : new Date(Date.now() + minutesRemaining * 60 * 1000);

    // Build driver location from worker (Onfleet uses [lng, lat] format)
    let driverLocation: DriverLocation | undefined;
    if (worker?.location) {
      driverLocation = {
        lat: worker.location[1],
        lng: worker.location[0],
        timestamp: now,
      };
    }

    // Build address
    const addr = task.destination.address;
    const formattedAddress = [addr.street, `${addr.city}, ${addr.state} ${addr.postalCode}`].join(
      ', '
    );

    // Get recipient name
    const recipient = task.recipients?.[0];

    return {
      id: this.generateDeliveryId(task.id),
      platform: 'totalwine',
      externalOrderId: task.shortId ?? task.id,
      status,
      statusLabel: this.getStatusLabel(status),
      statusUpdatedAt: new Date(task.timeLastModified),

      driver: worker
        ? {
            name: worker.name,
            photo: worker.imageUrl,
            phone: worker.phone ? maskPhoneNumber(worker.phone) : undefined,
            vehicle: worker.vehicle
              ? {
                  color: worker.vehicle.color,
                  licensePlate: worker.vehicle.licensePlate,
                }
              : undefined,
            location: driverLocation,
          }
        : undefined,

      destination: {
        address: formattedAddress,
        addressLine1: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.postalCode,
        lat: task.destination.location?.[1] ?? 0,
        lng: task.destination.location?.[0] ?? 0,
        instructions: task.destination.notes,
      },

      eta: {
        estimatedArrival,
        minutesRemaining,
        confidence: worker?.location ? 'high' : 'medium',
      },

      order: {
        itemCount: 0, // Onfleet doesn't provide item details
        specialInstructions: 'ID verification required for alcohol delivery',
      },

      tracking: {
        url: task.trackingURL,
        mapAvailable: !!worker?.location,
        liveUpdates: task.state === 2,
        contactDriverAvailable: !!worker?.phone,
      },

      timestamps: {
        ordered: new Date(task.timeCreated),
        driverAssigned: task.worker ? new Date(task.timeLastModified) : undefined,
        delivered: task.completionDetails?.time ? new Date(task.completionDetails.time) : undefined,
      },

      meta: {
        lastFetchedAt: now,
        fetchMethod: 'api',
        adapterId: 'totalwine',
        rawData: {
          task,
          worker,
          recipientName: recipient?.name,
        },
      },
    };
  }
}

export const totalwineAdapter = new TotalWineAdapter();
