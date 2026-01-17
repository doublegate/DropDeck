<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./images/DropDeck-logo-horizontal-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./images/DropDeck-logo-horizontal.svg">
  <img alt="DropDeck Logo" src="./images/DropDeck-logo-horizontal.svg" width="600">
</picture>

# DropDeck

**Every drop. One deck.**

[![Project Status](https://img.shields.io/badge/status-Phase%203%20Complete-success)](https://github.com/doublegate/DropDeck)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

A multi-platform delivery tracking aggregator that unifies real-time delivery tracking across 11+ platforms into a single, intuitive dashboard. View driver locations, estimated delivery times, and order status for all your active deliveries simultaneously.

<!-- Screenshot placeholder: Add app screenshot here when available -->
<!-- ![DropDeck Dashboard](./docs/assets/screenshot-dashboard.png) -->

---

## Features

- **Unified Dashboard** - Track all your deliveries from 11+ platforms in one place
- **Real-Time Driver Tracking** - Live driver locations with smooth map animations via MapLibre GL JS
- **Live ETA Countdown** - Accurate countdown timers that update in real-time
- **Platform-Agnostic** - Food delivery, grocery, alcohol, and package platforms supported
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme** - System-preference aware with instant switching
- **Persistent Sessions** - Login once per platform, stay connected for 30 days
- **Secure Credentials** - AES-256-GCM encryption for stored tokens

---

## Supported Platforms

| Platform | Category | Integration Status | Live Location | ETA |
|----------|----------|-------------------|---------------|-----|
| **Instacart** | Grocery | **Adapter Complete** | Yes | Yes |
| **DoorDash** | Food/Convenience | **Adapter Complete** | Yes | Yes |
| **Uber Eats** | Food/Grocery | **Adapter Complete** | Yes | Yes |
| **Amazon** | General/Grocery | **Adapter Complete** | Yes | Yes |
| **Amazon Fresh** | Grocery | **Adapter Complete** | Yes | Yes |
| **Walmart+** | Grocery/General | **Adapter Complete** | Limited | Yes |
| **Shipt** | Grocery | **Adapter Complete** | Limited | Yes |
| **Drizly** | Alcohol | **Adapter Complete** | Yes | Yes |
| **Total Wine** | Alcohol | **Adapter Complete** | Yes | Yes |
| **Costco** | Wholesale | **Adapter Complete** (via Instacart) | Yes | Yes |
| **Sam's Club** | Wholesale | **Adapter Complete** | Limited | Yes |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [Next.js](https://nextjs.org/) | 15.x | Full-stack React framework (App Router) |
| [React](https://react.dev/) | 19.x | UI component library |
| [TypeScript](https://www.typescriptlang.org/) | 5.x | Type-safe development |
| [Tailwind CSS](https://tailwindcss.com/) | 4.x | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Latest | Accessible component primitives |
| [MapLibre GL JS](https://maplibre.org/) | 4.x | Interactive map rendering |
| [TanStack Query](https://tanstack.com/query) | 5.x | Server state management |
| [Zustand](https://zustand-demo.pmnd.rs/) | 5.x | Client state management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| [tRPC](https://trpc.io/) | 11.x | End-to-end typesafe APIs |
| [NextAuth.js](https://authjs.dev/) | 5.x | Authentication framework |
| [Drizzle ORM](https://orm.drizzle.team/) | 0.35.x | TypeScript ORM |

### Infrastructure

| Technology | Provider | Purpose |
|------------|----------|---------|
| PostgreSQL 16 | [Neon](https://neon.tech/) | Primary database (serverless) |
| Redis 7 | [Upstash](https://upstash.com/) | Caching, pub/sub, rate limiting |
| WebSockets | [Ably](https://ably.com/) | Real-time communication |

### Development

| Technology | Purpose |
|------------|---------|
| [Bun](https://bun.sh/) | Runtime and package manager |
| [Biome](https://biomejs.dev/) | Linting and formatting |
| [Vitest](https://vitest.dev/) | Unit and integration testing |
| [Playwright](https://playwright.dev/) | End-to-end testing |

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Node.js](https://nodejs.org/) >= 20.x (for compatibility)
- PostgreSQL database (or [Neon](https://neon.tech/) account)
- Redis instance (or [Upstash](https://upstash.com/) account)

### Installation

```bash
# Clone the repository
git clone https://github.com/doublegate/DropDeck.git
cd DropDeck

# Install dependencies
bun install

# Copy environment template
cp .env.example .env.local

# Configure environment variables (see .env.example for details)

# Run database migrations
bun run db:migrate

# Start development server
bun run dev
```

### Development Commands

```bash
# Development
bun run dev           # Start development server with Turbopack

# Building
bun run build         # Build for production
bun run start         # Start production server

# Code Quality
bun run lint          # Run Biome linter
bun run format        # Format code with Biome
bun run check         # Run all checks

# Testing
bun run test          # Run unit tests with Vitest
bun run test:e2e      # Run E2E tests with Playwright

# Database
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations
bun run db:push       # Push schema changes
bun run db:studio     # Open Drizzle Studio
```

---

## Project Structure

```
DropDeck/
├── docs/                   # Project documentation
│   ├── 00-PROJECT-OVERVIEW.md
│   ├── 01-FEATURES.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-TECHNOLOGY-STACK.md
│   ├── 04-PLATFORM-INTEGRATIONS.md
│   ├── 05-DATA-MODELS.md
│   ├── 06-API-DESIGN.md
│   ├── 07-SECURITY.md
│   ├── 08-TESTING-STRATEGY.md
│   ├── 09-DEPLOYMENT.md
│   ├── 10-UI-UX-DESIGN-SYSTEM.md
│   └── 11-BRAND-GUIDELINES.md
├── images/                 # Logo and brand assets
├── to-dos/                 # Development phase tasks
│   ├── PHASE-1-FOUNDATION.md
│   ├── PHASE-2-CORE-INFRASTRUCTURE.md
│   ├── PHASE-3-PLATFORM-ADAPTERS.md
│   ├── PHASE-4-REAL-TIME-FEATURES.md
│   ├── PHASE-5-POLISH-AND-TESTING.md
│   └── PHASE-6-LAUNCH.md
├── src/                    # Application source
│   ├── app/               # Next.js App Router pages
│   │   ├── (auth)/        # Authentication routes
│   │   ├── (dashboard)/   # Dashboard routes
│   │   ├── api/trpc/      # tRPC API handler
│   │   ├── api/webhook/   # Platform webhook handlers
│   │   └── layout.tsx     # Root layout with providers
│   ├── components/        # React components
│   │   ├── layout/        # Layout components (Header, Sidebar, etc.)
│   │   ├── maps/          # MapLibre map components
│   │   ├── ui/            # shadcn/ui components
│   │   └── providers/     # Context providers (Auth, Theme, tRPC)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configurations
│   │   ├── adapters/      # Platform adapter framework
│   │   ├── auth/          # NextAuth.js configuration
│   │   ├── db/            # Drizzle ORM schema and client
│   │   ├── encryption/    # AES-256-GCM token encryption
│   │   ├── maps/          # MapLibre configuration
│   │   ├── realtime/      # Redis pub/sub and Ably WebSockets
│   │   ├── trpc/          # tRPC initialization and client
│   │   └── utils/         # Helper utilities
│   ├── server/            # Server-side code
│   │   └── routers/       # tRPC routers (platform, delivery, etc.)
│   ├── stores/            # Zustand stores
│   └── types/             # TypeScript type definitions
├── drizzle/               # Database migrations
├── tests/                  # Test files
└── public/                 # Static assets
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](./docs/00-PROJECT-OVERVIEW.md) | Vision, goals, and high-level architecture |
| [Features](./docs/01-FEATURES.md) | Detailed feature specifications |
| [Architecture](./docs/02-ARCHITECTURE.md) | System and component architecture |
| [Technology Stack](./docs/03-TECHNOLOGY-STACK.md) | Technology decisions and rationale |
| [Platform Integrations](./docs/04-PLATFORM-INTEGRATIONS.md) | Per-platform integration details |
| [Data Models](./docs/05-DATA-MODELS.md) | Database schema and data models |
| [API Design](./docs/06-API-DESIGN.md) | tRPC router and API specifications |
| [Security](./docs/07-SECURITY.md) | Security architecture and practices |
| [Testing Strategy](./docs/08-TESTING-STRATEGY.md) | Testing approach and coverage targets |
| [Deployment](./docs/09-DEPLOYMENT.md) | Deployment and CI/CD configuration |
| [UI/UX Design System](./docs/10-UI-UX-DESIGN-SYSTEM.md) | Complete design system |
| [Brand Guidelines](./docs/11-BRAND-GUIDELINES.md) | Brand identity and usage guidelines |

---

## Roadmap

Development is organized into 6 phases with 1,516 total tasks:

| Phase | Name | Status | Tasks |
|-------|------|--------|-------|
| 1 | [Foundation](./to-dos/PHASE-1-FOUNDATION.md) | **Complete** | 172 |
| 2 | [Core Infrastructure](./to-dos/PHASE-2-CORE-INFRASTRUCTURE.md) | **Complete** | 153 |
| 3 | [Platform Adapters](./to-dos/PHASE-3-PLATFORM-ADAPTERS.md) | **Complete** | 330 |
| 4 | [Real-Time Features](./to-dos/PHASE-4-REAL-TIME-FEATURES.md) | Planned | 270 |
| 5 | [Polish & Testing](./to-dos/PHASE-5-POLISH-AND-TESTING.md) | Planned | 302 |
| 6 | [Launch](./to-dos/PHASE-6-LAUNCH.md) | Planned | 289 |

**Target Launch:** Q2 2026

---

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting a pull request.

See also:
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- [OpenFreeMap](https://openfreemap.org/) for free map tiles
- [MapLibre](https://maplibre.org/) for open-source mapping
- [shadcn/ui](https://ui.shadcn.com/) for accessible components
- [Vercel](https://vercel.com/) for Next.js and hosting infrastructure

---

<p align="center">
  <img src="./images/DropDeck-icon-simple.svg" alt="DropDeck Icon" width="48">
  <br>
  <strong>DropDeck</strong> - Every drop. One deck.
</p>
