# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DropDeck is a multi-platform delivery tracking aggregator - a responsive web application that unifies real-time delivery tracking across 11+ platforms (Instacart, DoorDash, Uber Eats, Amazon, Walmart+, Shipt, Drizly, Total Wine, Costco, Sam's Club) into a single dashboard with live driver locations and ETAs.

**Status**: Phase 2 Complete - Core Infrastructure implemented. Ready for Phase 3: Platform Adapters.

### Implementation Progress

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Foundation (Next.js, Auth, DB, UI) | Complete |
| Phase 2 | Core Infrastructure | Complete |
| Phase 3 | Platform Adapters | Pending |
| Phase 4 | Features & Polish | Pending |

## Technology Stack

| Layer | Technology | Status |
|-------|------------|--------|
| Framework | Next.js 15 (App Router) | Implemented |
| Language | TypeScript 5.x | Implemented |
| Runtime/Package Manager | Bun | Implemented |
| Styling | Tailwind CSS 4.x | Implemented |
| Components | shadcn/ui | Implemented |
| Maps | MapLibre GL JS (OpenFreeMap tiles) | Implemented |
| State (Server) | TanStack Query 5.x | Implemented |
| State (Client) | Zustand 5.x | Pending |
| API Layer | tRPC 11.x | Implemented |
| Auth | NextAuth.js 5.x | Implemented |
| Database | PostgreSQL 16 (Neon serverless) | Implemented |
| ORM | Drizzle ORM | Implemented |
| Cache/Realtime | Redis (Upstash), Ably WebSockets | Implemented |
| Testing | Vitest (unit), Playwright (E2E) | Pending |
| Linting/Formatting | Biome | Implemented |

## Build Commands

```bash
bun install          # Install dependencies
bun run dev          # Development server
bun run build        # Production build
bun run start        # Start production server
bun run test         # Run unit tests (Vitest)
bun run test:e2e     # Run E2E tests (Playwright)
bun run lint         # Lint with Biome
bun run format       # Format with Biome
bun run typecheck    # TypeScript type checking
bun run db:push      # Push schema changes (Drizzle)
bun run db:studio    # Open Drizzle Studio
bun run db:generate  # Generate migrations
bun run db:seed      # Seed database
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth route group (login, callback)
│   ├── (dashboard)/        # Main app (dashboard, settings)
│   └── api/                # API routes (tRPC, webhooks)
│       ├── trpc/           # tRPC endpoint
│       └── webhook/        # Platform webhooks
├── components/             # React components
│   ├── auth/               # Sign out button, OAuth buttons
│   ├── dashboard/          # DeliveryGrid, DeliveryPane (pending)
│   ├── layout/             # Header, Sidebar, AppLayout
│   ├── maps/               # MapContainer, DriverMarker, DestinationMarker
│   ├── motion/             # Framer Motion animations
│   ├── platform/           # PlatformIcon, ConnectionStatus (pending)
│   ├── providers/          # App providers (tRPC, Theme, Toast)
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom hooks
│   ├── use-realtime.ts     # Ably WebSocket subscriptions
│   └── use-toast.ts        # Toast notifications
├── lib/
│   ├── adapters/           # Platform adapter framework
│   │   ├── base.ts         # Abstract PlatformAdapter class
│   │   ├── errors.ts       # Custom error classes
│   │   ├── registry.ts     # Adapter registry
│   │   ├── status-map.ts   # Platform status mappings
│   │   ├── types.ts        # Adapter types
│   │   └── utils.ts        # Utility functions
│   ├── animations/         # Animation variants
│   ├── auth/               # NextAuth config
│   ├── db/                 # Drizzle schema and client
│   ├── encryption/         # Token encryption (AES-256-GCM)
│   ├── maps/               # MapLibre configuration
│   ├── realtime/           # Real-time infrastructure
│   │   ├── ably.ts         # Ably server client
│   │   ├── events.ts       # Zod event schemas
│   │   ├── pubsub.ts       # Pub/Sub bridge
│   │   └── redis.ts        # Upstash Redis client
│   ├── trpc/               # tRPC setup
│   │   ├── client.ts       # Vanilla client
│   │   ├── context.ts      # Context factory
│   │   ├── init.ts         # Router initialization
│   │   └── react.tsx       # React integration
│   └── utils.ts            # Utility functions
├── server/routers/         # tRPC routers
│   ├── delivery.ts         # Delivery queries/subscriptions
│   ├── platform.ts         # Platform connections
│   ├── preference.ts       # User preferences
│   └── user.ts             # User profile
├── stores/                 # Zustand stores (pending)
└── types/                  # TypeScript types
    ├── delivery.ts         # UnifiedDelivery, DriverLocation
    ├── events.ts           # Event payloads
    └── platform.ts         # Platform types
```

### Platform Integration Patterns

Three integration strategies based on API availability:

1. **Direct API** (Uber Eats, Instacart, DoorDash, Amazon) - Official partner/consumer APIs with OAuth
2. **OAuth Session Proxy** (Walmart+, Shipt) - OAuth auth but no tracking API; use authenticated session requests
3. **Embedded WebView** (Drizly, Total Wine, Sam's Club) - No API; leverage user's authenticated session via PostMessage bridge

### Key Abstractions

- **PlatformAdapter** (`lib/adapters/base.ts`) - Abstract base class for all platform integrations with OAuth, delivery fetching, and webhook methods
- **SessionBasedAdapter** - Subclass for platforms without official APIs
- **AdapterRegistry** - Singleton registry for managing platform adapters
- **UnifiedDelivery** - Normalized delivery data model across all platforms with status, driver location, ETA, order details
- **DeliveryStatus** - Standardized statuses: preparing, ready_for_pickup, driver_assigned, out_for_delivery, arriving, delivered, cancelled, delayed

### Real-Time Data Flow

```
Platform Events → Webhook Handler → Event Normalizer → Redis Pub/Sub → Ably → React Client
                                                    ↓
                                              Delivery Cache
```

Location updates broadcast to `user:{userId}:deliveries` channel. TanStack Query handles cache updates; MapLibre animates driver markers.

### tRPC Routers

| Router | Procedures |
|--------|------------|
| `delivery` | getActive, getById, getHistory, onUpdate, onLocationUpdate |
| `platform` | list, connect, disconnect, sync, testConnection |
| `preference` | get, update |
| `user` | getProfile, updateProfile, getStats, deleteAccount |

## Security Considerations

- All platform tokens encrypted with AES-256-GCM before storage (`lib/encryption/tokens.ts`)
- Session cookies isolated per-platform (separate CookieJar instances)
- Proactive token refresh 5 minutes before expiry
- Webhook signatures verified before processing
- Rate limiting on API, webhook, and auth endpoints (`lib/ratelimit.ts`)

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL=
DATABASE_URL_UNPOOLED=

# Auth
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Real-time
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
ABLY_API_KEY=

# Encryption
TOKEN_ENCRYPTION_KEY=  # 64 hex chars (32 bytes)

# Rate Limiting
RATELIMIT_ENABLED=
```

## Reference Documentation

- `ref-docs/DropDeck-Delivery_DashHub_App-Proj_Concept.md` - Platform API research and integration strategies
- `ref-docs/DropDeck-Delivery_DashHub_App-Spec.md` - Full technical specification with schemas, API design, and implementation roadmap
- `docs/` - Architecture and design documents
