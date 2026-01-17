# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/doublegate/DropDeck/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/doublegate/DropDeck/releases/tag/v0.1.0
