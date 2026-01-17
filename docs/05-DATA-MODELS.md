# DropDeck: Data Models

## Overview

This document defines the database schema, entity relationships, unified delivery data model, and caching strategies for DropDeck.

---

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ PLATFORM_CONNECTIONS : has
    USERS ||--|| USER_PREFERENCES : has
    USERS ||--o{ DELIVERY_CACHE : has
    USERS ||--o{ DELIVERY_HISTORY : has
    USERS ||--o{ SESSIONS : has
    USERS ||--o{ ACCOUNTS : has

    USERS {
        text id PK
        text email UK
        text name
        text image
        timestamp email_verified
        timestamp created_at
        timestamp updated_at
    }

    PLATFORM_CONNECTIONS {
        text id PK
        text user_id FK
        text platform
        jsonb access_token_encrypted
        jsonb refresh_token_encrypted
        jsonb session_data_encrypted
        timestamp expires_at
        timestamp last_sync_at
        text status
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    USER_PREFERENCES {
        text user_id PK_FK
        text theme
        text sort_order
        jsonb enabled_platforms
        jsonb manual_platform_order
        boolean notifications_enabled
        jsonb notification_settings
        timestamp updated_at
    }

    DELIVERY_CACHE {
        text id PK
        text user_id FK
        text platform
        text external_order_id
        jsonb delivery_data
        jsonb driver_location
        integer eta_minutes
        text status
        timestamp last_updated
        timestamp expires_at
    }

    DELIVERY_HISTORY {
        text id PK
        text user_id FK
        text platform
        text external_order_id
        jsonb delivery_data
        text final_status
        timestamp ordered_at
        timestamp delivered_at
        jsonb timeline
        timestamp created_at
    }

    SESSIONS {
        text session_token PK
        text user_id FK
        timestamp expires
    }

    ACCOUNTS {
        text id PK
        text user_id FK
        text type
        text provider
        text provider_account_id
        text refresh_token
        text access_token
        integer expires_at
        text token_type
        text scope
        text id_token
        text session_state
    }

    VERIFICATION_TOKENS {
        text identifier
        text token
        timestamp expires
    }
```

---

## Database Schema (Drizzle ORM)

### Core Schema

```typescript
// lib/db/schema.ts
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const platformEnum = pgEnum('platform', [
  'instacart',
  'doordash',
  'ubereats',
  'amazon_fresh',
  'walmart',
  'shipt',
  'drizly',
  'totalwine',
  'costco',
  'samsclub',
  'amazon',
]);

export const connectionStatusEnum = pgEnum('connection_status', [
  'connected',
  'expired',
  'error',
  'disconnected',
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'driver_heading_to_store',
  'driver_at_store',
  'out_for_delivery',
  'arriving',
  'delivered',
  'cancelled',
  'delayed',
]);

export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

export const sortOrderEnum = pgEnum('sort_order', [
  'eta',
  'alphabetical',
  'recent',
  'manual',
]);

// ============================================
// USERS TABLE
// ============================================

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// ============================================
// AUTH.JS TABLES
// ============================================

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
}, (table) => ({
  providerIdx: uniqueIndex('accounts_provider_idx')
    .on(table.provider, table.providerAccountId),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// ============================================
// PLATFORM CONNECTIONS TABLE
// ============================================

export const platformConnections = pgTable('platform_connections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  accessTokenEncrypted: jsonb('access_token_encrypted').$type<EncryptedData | null>(),
  refreshTokenEncrypted: jsonb('refresh_token_encrypted').$type<EncryptedData | null>(),
  sessionDataEncrypted: jsonb('session_data_encrypted').$type<EncryptedData | null>(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  lastSyncAt: timestamp('last_sync_at', { mode: 'date' }),
  status: connectionStatusEnum('status').default('connected').notNull(),
  metadata: jsonb('metadata').$type<PlatformMetadata | null>(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  userPlatformIdx: uniqueIndex('connections_user_platform_idx')
    .on(table.userId, table.platform),
  statusIdx: index('connections_status_idx').on(table.status),
}));

// ============================================
// USER PREFERENCES TABLE
// ============================================

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum('theme').default('system').notNull(),
  sortOrder: sortOrderEnum('sort_order').default('eta').notNull(),
  enabledPlatforms: jsonb('enabled_platforms')
    .$type<Platform[]>()
    .default([]).notNull(),
  manualPlatformOrder: jsonb('manual_platform_order').$type<Platform[] | null>(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  notificationSettings: jsonb('notification_settings')
    .$type<NotificationSettings | null>(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// ============================================
// DELIVERY CACHE TABLE
// ============================================

export const deliveryCache = pgTable('delivery_cache', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  externalOrderId: text('external_order_id'),
  deliveryData: jsonb('delivery_data').$type<UnifiedDelivery>().notNull(),
  driverLocation: jsonb('driver_location').$type<DriverLocation | null>(),
  etaMinutes: integer('eta_minutes'),
  status: deliveryStatusEnum('status').notNull(),
  lastUpdated: timestamp('last_updated', { mode: 'date' }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
}, (table) => ({
  userPlatformIdx: index('cache_user_platform_idx')
    .on(table.userId, table.platform),
  expiresIdx: index('cache_expires_idx').on(table.expiresAt),
  statusIdx: index('cache_status_idx').on(table.status),
}));

// ============================================
// DELIVERY HISTORY TABLE
// ============================================

export const deliveryHistory = pgTable('delivery_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  externalOrderId: text('external_order_id'),
  deliveryData: jsonb('delivery_data').$type<UnifiedDelivery>().notNull(),
  finalStatus: deliveryStatusEnum('final_status').notNull(),
  orderedAt: timestamp('ordered_at', { mode: 'date' }).notNull(),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),
  timeline: jsonb('timeline').$type<TimelineEvent[]>(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  userPlatformIdx: index('history_user_platform_idx')
    .on(table.userId, table.platform),
  orderedAtIdx: index('history_ordered_at_idx').on(table.orderedAt),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  connections: many(platformConnections),
  deliveryCache: many(deliveryCache),
  deliveryHistory: many(deliveryHistory),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const platformConnectionsRelations = relations(platformConnections, ({ one }) => ({
  user: one(users, {
    fields: [platformConnections.userId],
    references: [users.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));
```

---

## TypeScript Type Definitions

### Encrypted Data Type

```typescript
// types/encryption.ts
export interface EncryptedData {
  ciphertext: string;  // Base64 encoded
  iv: string;          // Base64 encoded initialization vector
  authTag: string;     // Base64 encoded authentication tag
  algorithm: 'aes-256-gcm';
  version: number;     // For migration support
}
```

### Platform Metadata Type

```typescript
// types/platform.ts
export type Platform =
  | 'instacart'
  | 'doordash'
  | 'ubereats'
  | 'amazon_fresh'
  | 'walmart'
  | 'shipt'
  | 'drizly'
  | 'totalwine'
  | 'costco'
  | 'samsclub'
  | 'amazon';

export interface PlatformMetadata {
  // Platform-specific data
  accountEmail?: string;
  accountId?: string;
  retailerId?: string;       // For Instacart/Costco
  storeId?: string;          // For grocery platforms
  lastError?: string;
  errorCount?: number;
  capabilities?: {
    liveLocation: boolean;
    webhooks: boolean;
    driverContact: boolean;
  };
}
```

### Notification Settings Type

```typescript
// types/notifications.ts
export interface NotificationSettings {
  driverAssigned: boolean;
  outForDelivery: boolean;
  arrivingSoon: boolean;      // 5 minute warning
  delivered: boolean;
  delayed: boolean;
  quietHours?: {
    enabled: boolean;
    start: string;            // "22:00"
    end: string;              // "08:00"
  };
}
```

---

## Unified Delivery Data Model

```typescript
// types/delivery.ts

export type DeliveryStatus =
  | 'preparing'
  | 'ready_for_pickup'
  | 'driver_assigned'
  | 'driver_heading_to_store'
  | 'driver_at_store'
  | 'out_for_delivery'
  | 'arriving'
  | 'delivered'
  | 'cancelled'
  | 'delayed';

export interface UnifiedDelivery {
  // Identifiers
  id: string;                           // DropDeck internal ID
  platform: Platform;
  externalOrderId: string;              // Platform's order ID

  // Status
  status: DeliveryStatus;
  statusLabel: string;                  // Human-readable: "Out for delivery"
  statusUpdatedAt: Date;

  // Driver information (when available)
  driver?: {
    name?: string;                      // First name only
    photo?: string;                     // URL to driver photo
    phone?: string;                     // Masked: "***-***-1234"
    rating?: number;                    // Driver rating if available
    vehicle?: {
      make?: string;
      model?: string;
      color?: string;
      licensePlate?: string;            // Partial: "***ABC"
    };
    location?: DriverLocation;
  };

  // Destination
  destination: {
    address: string;                    // Full address
    addressLine1?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    lat: number;
    lng: number;
    instructions?: string;              // Delivery instructions
  };

  // ETA information
  eta: {
    estimatedArrival: Date;             // Absolute time
    minutesRemaining: number;           // Minutes until arrival
    distanceRemaining?: {
      value: number;
      unit: 'miles' | 'km';
    };
    stopsRemaining?: number;            // For Amazon multi-stop routes
    trafficConditions?: 'light' | 'moderate' | 'heavy';
    confidence: 'high' | 'medium' | 'low';
  };

  // Order summary
  order: {
    itemCount: number;
    totalAmount?: number;               // In cents
    currency?: string;                  // "USD"
    items?: OrderItem[];
    specialInstructions?: string;
  };

  // Tracking metadata
  tracking: {
    url?: string;                       // Platform tracking page URL
    mapAvailable: boolean;              // Can show live map
    liveUpdates: boolean;               // Real-time location available
    contactDriverAvailable: boolean;    // Can contact driver
  };

  // Event timestamps
  timestamps: {
    ordered: Date;
    confirmed?: Date;
    preparing?: Date;
    readyForPickup?: Date;
    driverAssigned?: Date;
    pickedUp?: Date;
    outForDelivery?: Date;
    arriving?: Date;
    delivered?: Date;
    cancelled?: Date;
  };

  // DropDeck metadata
  meta: {
    lastFetchedAt: Date;
    nextFetchAt?: Date;
    fetchMethod: 'api' | 'webhook' | 'polling' | 'embedded';
    adapterId: string;                  // Which adapter provided this
    rawData?: unknown;                  // Original platform response (debug)
  };
}

export interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;                     // Degrees (0-360)
  speed?: number;                       // km/h
  accuracy?: number;                    // Meters
  timestamp: Date;
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice?: number;                   // In cents
  imageUrl?: string;
  substituted?: boolean;
  substitutedWith?: string;
}

export interface TimelineEvent {
  status: DeliveryStatus;
  timestamp: Date;
  message?: string;
  location?: {
    lat: number;
    lng: number;
  };
}
```

---

## Redis Cache Structures

### Delivery Cache Keys

```typescript
// Cache key patterns
const cacheKeys = {
  // Active deliveries for a user
  userDeliveries: (userId: string) => `user:${userId}:deliveries`,

  // Single delivery details
  delivery: (deliveryId: string) => `delivery:${deliveryId}`,

  // Driver location (high-frequency updates)
  driverLocation: (deliveryId: string) => `delivery:${deliveryId}:location`,

  // Platform connection status
  connectionStatus: (userId: string, platform: Platform) =>
    `user:${userId}:connection:${platform}`,

  // Rate limit counters
  rateLimit: (platform: Platform, userId: string) =>
    `ratelimit:${platform}:${userId}`,

  // Webhook deduplication
  webhookIdempotency: (platform: Platform, eventId: string) =>
    `webhook:${platform}:${eventId}`,
};
```

### Cache Data Structures

```typescript
// Redis hash for delivery cache
interface DeliveryCacheRedis {
  data: string;           // JSON-serialized UnifiedDelivery
  status: DeliveryStatus;
  etaMinutes: number;
  lastUpdated: string;    // ISO timestamp
}

// Redis sorted set for user deliveries (sorted by ETA)
// Key: user:{userId}:deliveries
// Score: ETA timestamp
// Member: deliveryId

// Redis hash for driver location (high-frequency)
interface DriverLocationRedis {
  lat: string;
  lng: string;
  heading: string;
  speed: string;
  timestamp: string;
}
```

### Cache TTL Configuration

```typescript
const cacheTTL = {
  delivery: 300,              // 5 minutes
  driverLocation: 30,         // 30 seconds
  connectionStatus: 60,       // 1 minute
  webhookIdempotency: 3600,   // 1 hour (prevent replay)
  rateLimit: 60,              // 1 minute window
};
```

---

## Data Access Patterns

### Common Queries

```typescript
// lib/db/queries.ts
import { db } from './client';
import { eq, and, gt, desc } from 'drizzle-orm';
import * as schema from './schema';

// Get all active connections for user
export async function getUserConnections(userId: string) {
  return db.query.platformConnections.findMany({
    where: and(
      eq(schema.platformConnections.userId, userId),
      eq(schema.platformConnections.status, 'connected')
    ),
  });
}

// Get user with preferences
export async function getUserWithPreferences(userId: string) {
  return db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    with: {
      preferences: true,
      connections: true,
    },
  });
}

// Get cached deliveries
export async function getCachedDeliveries(userId: string) {
  return db.query.deliveryCache.findMany({
    where: and(
      eq(schema.deliveryCache.userId, userId),
      gt(schema.deliveryCache.expiresAt, new Date())
    ),
    orderBy: [schema.deliveryCache.etaMinutes],
  });
}

// Get delivery history with pagination
export async function getDeliveryHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0
) {
  return db.query.deliveryHistory.findMany({
    where: eq(schema.deliveryHistory.userId, userId),
    orderBy: [desc(schema.deliveryHistory.orderedAt)],
    limit,
    offset,
  });
}
```

### Mutation Helpers

```typescript
// lib/db/mutations.ts
import { db } from './client';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';

// Upsert platform connection
export async function upsertPlatformConnection(
  userId: string,
  platform: Platform,
  data: Partial<typeof schema.platformConnections.$inferInsert>
) {
  return db
    .insert(schema.platformConnections)
    .values({
      userId,
      platform,
      ...data,
    })
    .onConflictDoUpdate({
      target: [
        schema.platformConnections.userId,
        schema.platformConnections.platform,
      ],
      set: {
        ...data,
        updatedAt: new Date(),
      },
    })
    .returning();
}

// Update delivery cache
export async function updateDeliveryCache(
  userId: string,
  platform: Platform,
  delivery: UnifiedDelivery
) {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  return db
    .insert(schema.deliveryCache)
    .values({
      userId,
      platform,
      externalOrderId: delivery.externalOrderId,
      deliveryData: delivery,
      driverLocation: delivery.driver?.location ?? null,
      etaMinutes: delivery.eta.minutesRemaining,
      status: delivery.status,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: [schema.deliveryCache.id],
      set: {
        deliveryData: delivery,
        driverLocation: delivery.driver?.location ?? null,
        etaMinutes: delivery.eta.minutesRemaining,
        status: delivery.status,
        lastUpdated: new Date(),
        expiresAt,
      },
    });
}

// Archive completed delivery to history
export async function archiveDelivery(
  cacheEntry: typeof schema.deliveryCache.$inferSelect
) {
  const delivery = cacheEntry.deliveryData as UnifiedDelivery;

  // Insert into history
  await db.insert(schema.deliveryHistory).values({
    userId: cacheEntry.userId,
    platform: cacheEntry.platform,
    externalOrderId: cacheEntry.externalOrderId,
    deliveryData: delivery,
    finalStatus: delivery.status,
    orderedAt: delivery.timestamps.ordered,
    deliveredAt: delivery.timestamps.delivered ?? null,
    timeline: buildTimeline(delivery),
  });

  // Delete from cache
  await db
    .delete(schema.deliveryCache)
    .where(eq(schema.deliveryCache.id, cacheEntry.id));
}
```

---

## Migration Strategy

### Initial Migration

```typescript
// lib/db/migrations/0001_initial.ts
import { sql } from 'drizzle-orm';

export async function up(db: any) {
  // Create enums
  await db.execute(sql`
    CREATE TYPE platform AS ENUM (
      'instacart', 'doordash', 'ubereats', 'amazon_fresh',
      'walmart', 'shipt', 'drizly', 'totalwine',
      'costco', 'samsclub', 'amazon'
    );

    CREATE TYPE connection_status AS ENUM (
      'connected', 'expired', 'error', 'disconnected'
    );

    CREATE TYPE delivery_status AS ENUM (
      'preparing', 'ready_for_pickup', 'driver_assigned',
      'driver_heading_to_store', 'driver_at_store',
      'out_for_delivery', 'arriving', 'delivered',
      'cancelled', 'delayed'
    );
  `);

  // Create tables (Drizzle Kit handles this)
}

export async function down(db: any) {
  // Drop in reverse order
}
```

### Data Migration for Token Re-encryption

```typescript
// For future key rotation
export async function reencryptTokens(oldKey: Buffer, newKey: Buffer) {
  const connections = await db.query.platformConnections.findMany();

  for (const conn of connections) {
    if (conn.accessTokenEncrypted) {
      const decrypted = decrypt(conn.accessTokenEncrypted, oldKey);
      const reencrypted = encrypt(decrypted, newKey);
      await db
        .update(schema.platformConnections)
        .set({ accessTokenEncrypted: reencrypted })
        .where(eq(schema.platformConnections.id, conn.id));
    }
  }
}
```

---

## Data Retention Policies

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Active Deliveries | Until delivered + 24h | Operational need |
| Delivery History | 90 days | User value, analytics |
| Driver Locations | Real-time only | Privacy |
| User Preferences | Until account deletion | User settings |
| Platform Tokens | Until expired/revoked | Authentication |
| Audit Logs | 1 year | Security compliance |

---

*Document Version: 1.0 | Last Updated: January 2026*
