import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import type { TimelineEvent, UnifiedDelivery } from '@/types/delivery';
import type { EncryptedData, NotificationSettings, PlatformMetadata } from '@/types/platform';

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

export const sortOrderEnum = pgEnum('sort_order', ['eta', 'alphabetical', 'recent', 'manual']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'delivery_status_change',
  'driver_assigned',
  'out_for_delivery',
  'arriving_soon',
  'delivered',
  'delay_detected',
  'platform_connected',
  'platform_disconnected',
]);

// ============================================
// USERS TABLE
// ============================================

export const users = pgTable(
  'users',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    name: text('name'),
    image: text('image'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [uniqueIndex('users_email_idx').on(table.email)]
);

// ============================================
// AUTH.JS / NEXT-AUTH TABLES
// ============================================

export const accounts = pgTable(
  'accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [uniqueIndex('accounts_provider_idx').on(table.provider, table.providerAccountId)]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ============================================
// PLATFORM CONNECTIONS TABLE
// ============================================

export const platformConnections = pgTable(
  'platform_connections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
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
  },
  (table) => [
    uniqueIndex('connections_user_platform_idx').on(table.userId, table.platform),
    index('connections_status_idx').on(table.status),
  ]
);

// ============================================
// USER PREFERENCES TABLE
// ============================================

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  theme: themeEnum('theme').default('system').notNull(),
  sortOrder: sortOrderEnum('sort_order').default('eta').notNull(),
  enabledPlatforms: jsonb('enabled_platforms').$type<string[]>().default([]).notNull(),
  manualPlatformOrder: jsonb('manual_platform_order').$type<string[] | null>(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  notificationSettings: jsonb('notification_settings').$type<NotificationSettings | null>(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// ============================================
// DELIVERY CACHE TABLE
// ============================================

export const deliveryCache = pgTable(
  'delivery_cache',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    externalOrderId: text('external_order_id'),
    deliveryData: jsonb('delivery_data').$type<UnifiedDelivery>().notNull(),
    driverLocation: jsonb('driver_location').$type<{
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      timestamp: string;
    } | null>(),
    etaMinutes: integer('eta_minutes'),
    status: deliveryStatusEnum('status').notNull(),
    lastUpdated: timestamp('last_updated', { mode: 'date' }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
  },
  (table) => [
    index('cache_user_platform_idx').on(table.userId, table.platform),
    index('cache_expires_idx').on(table.expiresAt),
    index('cache_status_idx').on(table.status),
  ]
);

// ============================================
// DELIVERY HISTORY TABLE
// ============================================

export const deliveryHistory = pgTable(
  'delivery_history',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    platform: platformEnum('platform').notNull(),
    externalOrderId: text('external_order_id'),
    deliveryData: jsonb('delivery_data').$type<UnifiedDelivery>().notNull(),
    finalStatus: deliveryStatusEnum('final_status').notNull(),
    orderedAt: timestamp('ordered_at', { mode: 'date' }).notNull(),
    deliveredAt: timestamp('delivered_at', { mode: 'date' }),
    timeline: jsonb('timeline').$type<TimelineEvent[]>(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('history_user_platform_idx').on(table.userId, table.platform),
    index('history_ordered_at_idx').on(table.orderedAt),
  ]
);

// ============================================
// PUSH SUBSCRIPTIONS TABLE
// ============================================

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  },
  (table) => [
    uniqueIndex('push_endpoint_idx').on(table.endpoint),
    index('push_user_idx').on(table.userId),
  ]
);

// ============================================
// NOTIFICATIONS TABLE
// ============================================

export const notifications = pgTable(
  'notifications',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    data: jsonb('data').$type<{
      deliveryId?: string;
      platform?: string;
      status?: string;
      actionUrl?: string;
    } | null>(),
    read: boolean('read').default(false).notNull(),
    pushSent: boolean('push_sent').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => [
    index('notifications_user_idx').on(table.userId),
    index('notifications_read_idx').on(table.userId, table.read),
    index('notifications_created_idx').on(table.createdAt),
  ]
);

// ============================================
// NOTIFICATION PREFERENCES TABLE
// ============================================

export const notificationPreferences = pgTable('notification_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  pushEnabled: boolean('push_enabled').default(true).notNull(),
  inAppEnabled: boolean('in_app_enabled').default(true).notNull(),
  soundEnabled: boolean('sound_enabled').default(true).notNull(),
  // Per-event-type preferences
  driverAssigned: boolean('driver_assigned').default(true).notNull(),
  outForDelivery: boolean('out_for_delivery').default(true).notNull(),
  arrivingSoon: boolean('arriving_soon').default(true).notNull(),
  delivered: boolean('delivered').default(true).notNull(),
  delayed: boolean('delayed').default(true).notNull(),
  platformStatus: boolean('platform_status').default(true).notNull(),
  // Per-platform preferences (null = all platforms)
  enabledPlatforms: jsonb('enabled_platforms').$type<string[] | null>(),
  // Quiet hours
  quietHoursEnabled: boolean('quiet_hours_enabled').default(false).notNull(),
  quietHoursStart: text('quiet_hours_start').default('22:00'), // 24-hour format
  quietHoursEnd: text('quiet_hours_end').default('08:00'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  notificationPreferences: one(notificationPreferences),
  connections: many(platformConnections),
  deliveryCache: many(deliveryCache),
  deliveryHistory: many(deliveryHistory),
  accounts: many(accounts),
  sessions: many(sessions),
  pushSubscriptions: many(pushSubscriptions),
  notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
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

export const deliveryCacheRelations = relations(deliveryCache, ({ one }) => ({
  user: one(users, {
    fields: [deliveryCache.userId],
    references: [users.id],
  }),
}));

export const deliveryHistoryRelations = relations(deliveryHistory, ({ one }) => ({
  user: one(users, {
    fields: [deliveryHistory.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));
