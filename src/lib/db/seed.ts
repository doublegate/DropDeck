/**
 * Database seed script
 * Run with: bun run db:seed
 *
 * This script populates the database with sample data for development.
 * It creates a test user with preferences and sample delivery history.
 */

import { db } from './index';
import { deliveryHistory, userPreferences, users } from './schema';

async function seed() {
  console.log('Seeding database...');

  try {
    // Create a test user
    const [testUser] = await db
      .insert(users)
      .values({
        email: 'test@dropdeck.app',
        name: 'Test User',
        emailVerified: new Date(),
      })
      .returning();

    if (!testUser) {
      throw new Error('Failed to create test user');
    }

    console.log('Created test user:', testUser.id);

    // Create user preferences
    await db.insert(userPreferences).values({
      userId: testUser.id,
      theme: 'system',
      sortOrder: 'eta',
      enabledPlatforms: ['instacart', 'doordash', 'ubereats', 'amazon'],
      notificationsEnabled: true,
      notificationSettings: {
        driverAssigned: true,
        outForDelivery: true,
        arrivingSoon: true,
        delivered: true,
        delayed: true,
      },
    });

    console.log('Created user preferences');

    // Create sample delivery history
    const sampleDeliveries = [
      {
        userId: testUser.id,
        platform: 'doordash' as const,
        externalOrderId: 'DD-12345678',
        deliveryData: {
          id: 'dd-hist-1',
          platform: 'doordash' as const,
          externalOrderId: 'DD-12345678',
          status: 'delivered' as const,
          statusLabel: 'Delivered',
          statusUpdatedAt: new Date('2026-01-15T18:30:00'),
          destination: {
            address: '123 Main St, San Francisco, CA 94102',
            lat: 37.7749,
            lng: -122.4194,
          },
          eta: {
            estimatedArrival: new Date('2026-01-15T18:30:00'),
            minutesRemaining: 0,
            confidence: 'high' as const,
          },
          order: {
            itemCount: 3,
            totalAmount: 4599,
            currency: 'USD',
          },
          tracking: {
            mapAvailable: true,
            liveUpdates: true,
            contactDriverAvailable: true,
          },
          timestamps: {
            ordered: new Date('2026-01-15T17:45:00'),
            delivered: new Date('2026-01-15T18:30:00'),
          },
          meta: {
            lastFetchedAt: new Date('2026-01-15T18:30:00'),
            fetchMethod: 'webhook' as const,
            adapterId: 'doordash-v1',
          },
        },
        finalStatus: 'delivered' as const,
        orderedAt: new Date('2026-01-15T17:45:00'),
        deliveredAt: new Date('2026-01-15T18:30:00'),
        timeline: [
          { status: 'preparing' as const, timestamp: new Date('2026-01-15T17:50:00') },
          { status: 'driver_assigned' as const, timestamp: new Date('2026-01-15T18:05:00') },
          { status: 'out_for_delivery' as const, timestamp: new Date('2026-01-15T18:15:00') },
          { status: 'delivered' as const, timestamp: new Date('2026-01-15T18:30:00') },
        ],
      },
      {
        userId: testUser.id,
        platform: 'instacart' as const,
        externalOrderId: 'IC-87654321',
        deliveryData: {
          id: 'ic-hist-1',
          platform: 'instacart' as const,
          externalOrderId: 'IC-87654321',
          status: 'delivered' as const,
          statusLabel: 'Delivered',
          statusUpdatedAt: new Date('2026-01-14T14:00:00'),
          destination: {
            address: '456 Oak Ave, San Francisco, CA 94103',
            lat: 37.7739,
            lng: -122.4312,
          },
          eta: {
            estimatedArrival: new Date('2026-01-14T14:00:00'),
            minutesRemaining: 0,
            confidence: 'high' as const,
          },
          order: {
            itemCount: 15,
            totalAmount: 12499,
            currency: 'USD',
          },
          tracking: {
            mapAvailable: true,
            liveUpdates: true,
            contactDriverAvailable: true,
          },
          timestamps: {
            ordered: new Date('2026-01-14T11:30:00'),
            delivered: new Date('2026-01-14T14:00:00'),
          },
          meta: {
            lastFetchedAt: new Date('2026-01-14T14:00:00'),
            fetchMethod: 'api' as const,
            adapterId: 'instacart-v1',
          },
        },
        finalStatus: 'delivered' as const,
        orderedAt: new Date('2026-01-14T11:30:00'),
        deliveredAt: new Date('2026-01-14T14:00:00'),
        timeline: [
          { status: 'preparing' as const, timestamp: new Date('2026-01-14T12:00:00') },
          { status: 'driver_assigned' as const, timestamp: new Date('2026-01-14T13:00:00') },
          { status: 'out_for_delivery' as const, timestamp: new Date('2026-01-14T13:30:00') },
          { status: 'delivered' as const, timestamp: new Date('2026-01-14T14:00:00') },
        ],
      },
    ];

    for (const delivery of sampleDeliveries) {
      await db.insert(deliveryHistory).values(delivery);
    }

    console.log('Created sample delivery history');
    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
seed();
