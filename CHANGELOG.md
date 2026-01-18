# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2026-01-17

### Added

#### Phase 4: Real-Time Features Complete

**Sprint 4.1: Live Tracking Components**
- `DeliveryMarker` component with platform-branded icons (32x32px)
- Smooth 60fps marker animation using `requestAnimationFrame` and easeOutCubic interpolation
- `DestinationMarker` component with address and delivery instructions
- `RouteLine` component with animated route lines and platform-specific colors
- `ConnectionStatusIndicator` for real-time connection status display
- `LiveTrackingMap` with multi-delivery support and auto-fit bounds
- Marker clustering support for multiple simultaneous deliveries

**Sprint 4.2: ETA System**
- ETA calculation service (`src/lib/services/eta.ts`) with:
  - Platform ETA aggregation and normalization
  - Confidence scoring (high/medium/low based on accuracy history)
  - Traffic condition adjustments
  - Historical accuracy tracking
- `ETADisplay` component with animated countdown (24px bold, tabular-nums)
- `ETADisplayCompact` for card integration
- `ETATimeline` visual progression with milestone highlighting
- Pulse animation for "arriving soon" state (Cyan glow)

**Sprint 4.3: Notifications System**
- In-app notification infrastructure via Ably WebSockets
- Notification event schema with Zod validation
- `useNotifications` hook for real-time notification subscriptions
- `NotificationBell` component with unread count badge
- `NotificationList` with date grouping and delivery grouping
- `NotificationCenter` for full notification management
- `NotificationPreferences` UI with:
  - Push notification toggle
  - Per-platform notification settings
  - Per-event-type preferences
  - Quiet hours configuration
- Notification types: `DELIVERY_STATUS_CHANGE`, `DRIVER_ASSIGNED`, `OUT_FOR_DELIVERY`, `ARRIVING_SOON`, `DELIVERED`, `DELAY_DETECTED`

**Sprint 4.4: Unified Dashboard**
- Zustand dashboard store (`src/stores/dashboard-store.ts`) with:
  - Delivery state management (CRUD operations)
  - Filter state (platforms, statuses, search query)
  - Sort options (ETA, status, platform, order time)
  - View settings (grid/list/map mode)
  - LocalStorage persistence for user preferences
  - Computed selectors for filtered/sorted deliveries
- `DeliveryCard` component (Design System compliant):
  - Platform badge with brand colors
  - Status badge with semantic colors
  - Driver info, ETA display, progress indicator
  - Hover animation (-translate-y-0.5, increased shadow)
  - Skeleton loader for loading states
- `DeliveryGrid` responsive grid (1/2/3/4 columns)
- `DeliveryFilters` with:
  - Platform multi-select with counts
  - Status filter (Active/Completed/Cancelled)
  - Sort dropdown with order toggle
  - View mode toggle (grid/list)
  - Active filter chips with clear functionality
- `DeliveryStats` dashboard stats (active, arriving soon, delivered today, weekly total)
- Empty states for no deliveries, no platforms, no filter results
- Real-time card updates via tRPC subscriptions
- Collapsible map section integration

**Dashboard Page Updates**
- Updated `src/app/(dashboard)/dashboard/page.tsx` with full Zustand integration
- Real-time updates via `useRealTimeUpdates` hook with conditional enabling
- Connection status indicator in header
- Responsive layout with Design System breakpoints

### Changed
- Extended `use-realtime.ts` hook with `enabled` option for conditional subscriptions
- Extended `LiveTrackingMap` to accept external deliveries prop
- Added `autoFitBounds` option to map component
- Updated Ably client with `userNotifications` channel and `publishNotification` helper
- Extended realtime events schema with notification event types

### Technical Details
- **21 new files created** across 5 directories
- **8 files modified** (existing infrastructure)
- **+4,300 lines of code**
- **Total codebase: 131 files, ~20,600 lines**
- TypeScript compilation: PASS
- Biome lint: PASS (4 warnings for intentional non-null assertions)

### Component Architecture

| Category | Components |
|----------|------------|
| Map | DeliveryMarker, DestinationMarker, RouteLine, ConnectionStatus, LiveTrackingMap |
| ETA | ETADisplay, ETADisplayCompact, ETATimeline |
| Notifications | NotificationBell, NotificationList, NotificationCenter, NotificationPreferences |
| Dashboard | DeliveryCard, DeliveryGrid, DeliveryFilters, DeliveryStats |
| Stores | dashboard-store (Zustand with persistence) |
| Services | eta.ts (calculation engine) |

---

## [0.3.0] - 2026-01-17

### Added

#### Phase 3: Platform Adapters Complete

**Sprint 3.1: Instacart Adapter**
- OAuth 2.0 client with token refresh and revocation
- API client for orders, delivery tracking, store search
- Webhook handler for real-time delivery updates (HMAC-SHA256 verification)
- Costco integration via Instacart fulfillment detection
- Zod schemas for all Instacart API responses
- Status mapping from Instacart → unified delivery status

**Sprint 3.2: DoorDash Adapter**
- JWT authentication with RS256 signing (jose library)
- Drive API integration for delivery tracking
- Webhook handler with signature verification
- Real-time location tracking support
- Support for dasher assignment and unassignment events
- Status mapping for all DoorDash delivery states

**Sprint 3.3: Uber Eats Adapter**
- OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- Eats API integration for order and delivery data
- Real-time tracking via webhook subscriptions
- `exchangeCodeWithPKCE()` method for secure token exchange
- Support for courier location updates and ETA changes

**Sprint 3.4: Amazon Adapter**
- OAuth 2.0 + AWS Signature V4 for SP-API authentication
- Support for Amazon, Amazon Fresh, and Whole Foods
- Multiple delivery window tracking
- Shipment tracking with carrier integration
- Sub-brand detection (Fresh, Whole Foods) via order metadata

**Sprint 3.5: Walmart+ Adapter**
- Session-based authentication (extends SessionBasedAdapter)
- Order tracking API with slot management
- Delivery window and slot availability
- Cookie capture and validation flow
- Walmart Grocery Express support

**Sprint 3.6: Remaining Adapters**
- **Shipt Adapter**: Session-based auth, Target order detection, shopper tracking
- **Drizly Adapter**: Session-based auth, ID verification tracking, 21+ compliance
- **Total Wine Adapter**: Onfleet API integration, webhook support, age verification
- **Sam's Club Adapter**: Session-based auth, Instacart delegation for fulfilled orders

**OAuth Callback Route**
- Unified callback handler at `/api/auth/callback/[platform]`
- Support for standard OAuth 2.0 and PKCE flows
- State validation via Redis for CSRF protection
- Automatic token encryption and storage
- Error handling with user-friendly redirects

**Adapter Registry Updates**
- All 11 platform adapters registered with lazy loading
- Platform-specific adapter instantiation
- Type-safe adapter retrieval by platform name

### Technical Details

- **26 new files created** across 9 adapter directories
- **2 files modified** (.env.example, registry.ts)
- **+7,600 lines of code**
- **Total codebase: 109 files, ~16,300 lines**
- TypeScript compilation: PASS
- Biome lint: PASS (4 warnings for intentional non-null assertions)

### Authentication Methods by Platform

| Platform | Auth Method | Implementation |
|----------|-------------|----------------|
| Instacart | OAuth 2.0 | Standard flow with refresh |
| Costco | OAuth 2.0 | Via Instacart |
| DoorDash | JWT (RS256) | jose library signing |
| Uber Eats | OAuth 2.0 + PKCE | Code verifier/challenge |
| Amazon | OAuth 2.0 + AWS Sig V4 | SP-API authentication |
| Walmart+ | Session-based | Cookie capture |
| Shipt | Session-based | Cookie capture |
| Drizly | Session-based | Cookie capture |
| Total Wine | API Key | Onfleet integration |
| Sam's Club | Session-based | Cookie capture |

---

## [0.2.0] - 2026-01-17

### Added

#### Phase 2: Core Infrastructure Complete

**Sprint 2.1: tRPC Setup**
- tRPC 11.x with superjson transformer for Date/Map serialization
- Type-safe procedures with Zod input validation
- Context factory with session, database, and Redis integration
- Public and protected procedure middlewares
- Rate limiting middleware using @upstash/ratelimit
- Complete router structure:
  - `platform` - Connection management, OAuth flow, sync
  - `delivery` - Active deliveries, history, real-time subscriptions
  - `preference` - User settings and notification preferences
  - `user` - Profile, stats, account management
- TanStack Query integration with React hooks
- API route handler for Next.js App Router

**Sprint 2.2: Platform Adapter Base**
- Abstract `PlatformAdapter` class with OAuth and session methods
- `SessionBasedAdapter` for platforms without APIs
- Adapter registry with lazy loading
- Complete status mapping for all 11 platforms:
  - Instacart, DoorDash, Uber Eats, Amazon, Walmart+
  - Shipt, Drizly, Total Wine, Costco, Sam's Club
- Platform-specific error hierarchy:
  - `PlatformAuthError`, `PlatformRateLimitError`
  - `PlatformUnavailableError`, `PlatformDataError`
- Common utilities: ETA calculation, coordinate utilities, retry logic

**Sprint 2.3: Real-Time Infrastructure**
- Upstash Redis client for caching and pub/sub
- Ably WebSocket client with token authentication
- Pub/Sub bridge system between Redis and Ably
- Channel naming conventions:
  - `user:{userId}:deliveries` - Delivery updates
  - `delivery:{id}:location` - Driver location
  - `system:status` - System announcements
- Zod-validated event schemas:
  - `DeliveryUpdateEvent`, `LocationUpdateEvent`
  - `ConnectionStatusEvent`, `SystemStatusEvent`
- React hooks: `useRealTimeUpdates`, `useLocationSubscription`
- Webhook handler with signature verification and idempotency
- AES-256-GCM token encryption utilities

**Sprint 2.4: MapLibre Integration**
- MapLibre GL JS 5.x with react-map-gl
- OpenFreeMap tile sources (no API key required)
- Light and dark mode map styles
- Map components:
  - `MapContainer` - Wrapper with loading/error states
  - `MapControls` - Zoom, center, fullscreen controls
  - `DriverMarker` - Animated driver icon with platform colors
  - `DestinationMarker` - Delivery address marker with popup
- Smooth position interpolation for marker animation
- Theme synchronization with app theme
- Bounds calculation for multiple markers

### Technical Details

- **31 new files created**
- **2 files modified**
- **+4,000 lines of code**
- **Total codebase: 89 files, ~8,700 lines**
- TypeScript compilation: PASS
- Biome lint: PASS (4 warnings for intentional non-null assertions)

---

## [0.1.0] - 2026-01-17

### Added

#### Phase 1: Foundation Complete

**Sprint 1.1: Project Setup**
- Next.js 15.3.3 with App Router and Turbopack
- React 19 with TypeScript 5.x strict mode
- Bun runtime and package manager
- Biome linter/formatter configuration
- Project directory structure with organized src/ layout
- Environment validation with Zod
- Development tooling (.editorconfig, .gitignore)

**Sprint 1.2: Database Setup**
- Drizzle ORM 0.44.2 with PostgreSQL dialect
- Neon serverless PostgreSQL integration
- Complete database schema with 8 tables:
  - `users` - Core user data with email verification
  - `accounts` - OAuth provider accounts
  - `sessions` - Session management
  - `verification_tokens` - Email/magic link verification
  - `platform_connections` - Platform OAuth tokens (AES-256-GCM encrypted)
  - `user_preferences` - Theme, notifications, display settings
  - `delivery_cache` - Active delivery caching
  - `delivery_history` - Historical delivery records
- Enum types for platforms (11 services), delivery status, theme, sort order
- Drizzle Studio integration for database inspection

**Sprint 1.3: Authentication**
- NextAuth.js v5 (Auth.js) with Drizzle adapter
- OAuth providers configured: Google, GitHub, Discord
- Credentials provider for email/password
- Magic link email authentication support
- JWT sessions with 30-day expiration
- Auth callback route handling
- Protected route middleware

**Sprint 1.4: UI Foundation**
- Tailwind CSS 4.x with CSS-first configuration
- DropDeck design system CSS variables:
  - Brand colors: Deck Navy (#1E293B), Drop Cyan (#06B6D4)
  - Semantic colors: Success, Warning, Error, Info
  - 8-level spacing scale
  - Typography with Inter and JetBrains Mono
- shadcn/ui component library integration:
  - Button, Card, Avatar, Badge, Skeleton
  - Dropdown Menu, Sheet, Switch, Separator
- Custom layout components:
  - AppLayout with responsive sidebar
  - Header with user menu and theme toggle
  - Sidebar with navigation and platform connections
  - MobileNav with slide-out menu
- next-themes for dark/light/system theme support
- Framer Motion for animations
- Custom hooks: useMediaQuery, useMounted

### Technical Details

- **66 files created**
- **+4,833 lines of code**
- TypeScript compilation: PASS
- Biome lint: PASS (0 errors)
- Next.js build: PASS

---

- Initial project planning and documentation
- Comprehensive technical specification covering:
  - Project overview with vision and goals
  - Detailed feature specifications for 15 features
  - System architecture and component design
  - Technology stack decisions with rationale
  - Platform integration strategies for 11 delivery services
  - Database schema and data models
  - tRPC API design specifications
  - Security architecture and practices
  - Testing strategy with coverage targets
  - Deployment and CI/CD configuration
- Complete UI/UX design system including:
  - Color system with brand colors (Deck Navy, Drop Cyan)
  - Typography scale using Inter and JetBrains Mono
  - Spacing and layout guidelines
  - Component patterns and specifications
  - Animation and motion design
  - Accessibility standards (WCAG 2.1 AA)
- Brand guidelines with:
  - Logo system (horizontal, icon, dark/light variants)
  - Color usage rules
  - Voice and tone specifications
  - Platform branding considerations
- 6-phase development roadmap with 1,516 total tasks:
  - Phase 1: Foundation (172 tasks)
  - Phase 2: Core Infrastructure (153 tasks)
  - Phase 3: Platform Adapters (330 tasks)
  - Phase 4: Real-Time Features (270 tasks)
  - Phase 5: Polish & Testing (302 tasks)
  - Phase 6: Launch (289 tasks)

### Documentation

- `docs/00-PROJECT-OVERVIEW.md` - Vision, goals, architecture overview
- `docs/01-FEATURES.md` - Feature specifications with user stories
- `docs/02-ARCHITECTURE.md` - System and component architecture
- `docs/03-TECHNOLOGY-STACK.md` - Technology decisions and configurations
- `docs/04-PLATFORM-INTEGRATIONS.md` - Per-platform integration details
- `docs/05-DATA-MODELS.md` - Database schema and data models
- `docs/06-API-DESIGN.md` - tRPC router and API specifications
- `docs/07-SECURITY.md` - Security architecture and practices
- `docs/08-TESTING-STRATEGY.md` - Testing approach and coverage targets
- `docs/09-DEPLOYMENT.md` - Deployment and CI/CD configuration
- `docs/10-UI-UX-DESIGN-SYSTEM.md` - Complete design system
- `docs/11-BRAND-GUIDELINES.md` - Brand identity guidelines

### Brand Assets

- `images/DropDeck-logo-horizontal.svg` - Horizontal logo (light mode)
- `images/DropDeck-logo-horizontal-dark.svg` - Horizontal logo (dark mode)
- `images/DropDeck-icon-simple.svg` - Simple icon for favicon/small contexts
- `images/DropDeck-logo-card-grid.svg` - Full card grid logo

---

## Version History

This changelog will be updated as development progresses through each phase.

**Target Launch:** Q2 2026

[Unreleased]: https://github.com/doublegate/DropDeck/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/doublegate/DropDeck/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/doublegate/DropDeck/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/doublegate/DropDeck/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/doublegate/DropDeck/releases/tag/v0.1.0
