# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DropDeck is a multi-platform delivery tracking aggregator - a responsive web application that unifies real-time delivery tracking across 11+ platforms (Instacart, DoorDash, Uber Eats, Amazon, Walmart+, Shipt, Drizly, Total Wine, Costco, Sam's Club) into a single dashboard with live driver locations and ETAs.

**Status**: Planning phase - no code implemented yet. See `ref-docs/` for detailed specifications.

## Technology Stack (Planned)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x |
| Runtime/Package Manager | Bun |
| Styling | Tailwind CSS 4.x |
| Components | shadcn/ui |
| Maps | MapLibre GL JS (free OpenStreetMap tiles) |
| State (Server) | TanStack Query 5.x |
| State (Client) | Zustand 5.x |
| API Layer | tRPC 11.x |
| Auth | NextAuth.js 5.x |
| Database | PostgreSQL 16 (Neon serverless) |
| ORM | Drizzle ORM |
| Cache/Realtime | Redis (Upstash), Ably WebSockets |
| Testing | Vitest (unit), Playwright (E2E) |
| Linting/Formatting | Biome |

## Build Commands (Once Implemented)

```bash
bun install          # Install dependencies
bun run dev          # Development server
bun run build        # Production build
bun run start        # Start production server
bun run test         # Run unit tests (Vitest)
bun run test:e2e     # Run E2E tests (Playwright)
bun run lint         # Lint with Biome
bun run format       # Format with Biome
bun run db:push      # Push schema changes (Drizzle)
bun run db:studio    # Open Drizzle Studio
```

## Architecture

### Directory Structure (Planned)

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth route group (login, callback)
│   ├── (dashboard)/        # Main app (dashboard, settings)
│   └── api/                # API routes (platforms, webhooks)
├── components/             # React components
│   ├── dashboard/          # DeliveryGrid, DeliveryPane
│   ├── maps/               # MapContainer, DriverMarker
│   ├── platform/           # PlatformIcon, ConnectionStatus
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom hooks (useDeliveries, useRealTimeLocation)
├── lib/
│   ├── adapters/           # Platform-specific adapters (one per service)
│   ├── auth/               # NextAuth providers, token encryption
│   └── db/                 # Drizzle schema and client
├── stores/                 # Zustand stores
└── types/                  # TypeScript types (delivery.ts, platform.ts)
```

### Platform Integration Patterns

Three integration strategies based on API availability:

1. **Direct API** (Uber Eats, Instacart, DoorDash, Amazon) - Official partner/consumer APIs with OAuth
2. **OAuth Session Proxy** (Walmart+, Shipt) - OAuth auth but no tracking API; use authenticated session requests
3. **Embedded WebView** (Drizly, Total Wine, Sam's Club) - No API; leverage user's authenticated session via PostMessage bridge

### Key Abstractions

- **PlatformAdapter** (`lib/adapters/base.ts`) - Abstract base class for all platform integrations with OAuth, delivery fetching, and webhook methods
- **UnifiedDelivery** - Normalized delivery data model across all platforms with status, driver location, ETA, order details
- **DeliveryStatus** - Standardized statuses: preparing, ready_for_pickup, driver_assigned, out_for_delivery, arriving, delivered, cancelled, delayed

### Real-Time Data Flow

```
Platform Events → Event Normalizer → Redis Pub/Sub → WebSocket Server → React Client
```

Location updates broadcast to `user:{userId}:deliveries` channel. TanStack Query handles cache updates; MapLibre animates driver markers.

## Security Considerations

- All platform tokens encrypted with AES-256-GCM before storage
- Session cookies isolated per-platform (separate CookieJar instances)
- Proactive token refresh 5 minutes before expiry
- Webhook signatures verified before processing

## Reference Documentation

- `ref-docs/DropDeck-Delivery_DashHub_App-Proj_Concept.md` - Platform API research and integration strategies
- `ref-docs/DropDeck-Delivery_DashHub_App-Spec.md` - Full technical specification with schemas, API design, and implementation roadmap
