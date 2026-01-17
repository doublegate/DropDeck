# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/doublegate/DropDeck/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/doublegate/DropDeck/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/doublegate/DropDeck/releases/tag/v0.1.0
