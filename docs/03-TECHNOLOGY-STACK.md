# DropDeck: Technology Stack

## Overview

This document provides a comprehensive breakdown of the technology choices for DropDeck, including rationale for each decision, version specifications, and configuration details.

---

## Stack Summary

| Category | Technology | Version |
|----------|------------|---------|
| **Framework** | Next.js | 15.x |
| **UI Library** | React | 19.x |
| **Language** | TypeScript | 5.x |
| **Runtime** | Bun | Latest |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | shadcn/ui | Latest |
| **Maps** | MapLibre GL JS | 4.x |
| **Server State** | TanStack Query | 5.x |
| **Client State** | Zustand | 5.x |
| **API Layer** | tRPC | 11.x |
| **Authentication** | NextAuth.js (Auth.js) | 5.x |
| **Database** | PostgreSQL | 16.x |
| **ORM** | Drizzle ORM | 0.35.x |
| **Cache** | Redis | 7.x |
| **Real-time** | Ably | Latest |
| **Testing** | Vitest + Playwright | Latest |
| **Linting** | Biome | Latest |

---

## Frontend Stack

### Next.js 15

**Version:** 15.x (App Router)
**Purpose:** Full-stack React framework

#### Rationale

- **App Router**: Server-first architecture with React Server Components
- **Streaming**: Progressive rendering with Suspense boundaries
- **Server Actions**: Simplified form handling and mutations
- **Middleware**: Edge-based request processing for auth and rate limiting
- **Built-in Optimizations**: Image, font, and script optimization
- **Vercel Integration**: Seamless deployment with edge functions

#### Key Configuration

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  images: {
    remotePatterns: [
      { hostname: '*.instacart.com' },
      { hostname: '*.doordash.com' },
      { hostname: '*.ubereats.com' },
    ],
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

export default config;
```

---

### React 19

**Version:** 19.x
**Purpose:** UI component library

#### Rationale

- **Server Components**: Native support for server-side rendering
- **Concurrent Features**: Improved performance with automatic batching
- **Suspense**: Built-in loading states and error boundaries
- **use() Hook**: Simplified async data handling
- **Actions**: Form handling with progressive enhancement

#### Key Patterns Used

```typescript
// Server Component (default)
async function DeliveryList() {
  const deliveries = await getActiveDeliveries();
  return <DeliveryGrid deliveries={deliveries} />;
}

// Client Component (opt-in)
'use client';
function ETACountdown({ targetTime }: { targetTime: Date }) {
  const [remaining, setRemaining] = useState(calculateRemaining(targetTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(calculateRemaining(targetTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return <span>{formatDuration(remaining)}</span>;
}
```

---

### TypeScript 5.x

**Version:** 5.x
**Purpose:** Type-safe development

#### Rationale

- **Type Safety**: Catch errors at compile time
- **IDE Support**: Excellent autocomplete and refactoring
- **Documentation**: Types serve as documentation
- **tRPC Integration**: End-to-end type safety with API layer

#### Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Tailwind CSS 4.x

**Version:** 4.x
**Purpose:** Utility-first CSS framework

#### Rationale

- **Utility-First**: Rapid prototyping with consistent design
- **CSS Variables**: Native theming with CSS custom properties
- **Dark Mode**: Built-in dark mode support
- **Performance**: Automatic purging of unused styles
- **Component Libraries**: Compatible with shadcn/ui

#### Configuration

```css
/* globals.css */
@import 'tailwindcss';

@theme {
  --color-primary: hsl(221 83% 53%);
  --color-secondary: hsl(210 40% 96%);
  --color-destructive: hsl(0 84% 60%);
  --color-muted: hsl(210 40% 96%);
  --color-accent: hsl(210 40% 96%);

  /* Platform colors */
  --color-instacart: #43B02A;
  --color-doordash: #FF3008;
  --color-ubereats: #06C167;
  --color-amazon: #FF9900;
  --color-walmart: #0071DC;
  --color-shipt: #00A651;
}
```

---

### shadcn/ui

**Version:** Latest
**Purpose:** Accessible component primitives

#### Rationale

- **Copy-Paste**: Components are copied into project, not imported
- **Customizable**: Full control over component code
- **Accessible**: Built on Radix UI primitives
- **Tailwind Native**: Styled with Tailwind classes
- **TypeScript**: Fully typed components

#### Components Used

| Component | Use Case |
|-----------|----------|
| `Button` | Actions, links |
| `Card` | Delivery panes |
| `Dialog` | Modals, confirmations |
| `DropdownMenu` | Sort options, user menu |
| `Select` | Platform selection |
| `Skeleton` | Loading states |
| `Switch` | Toggle settings |
| `Toast` | Notifications |
| `Tooltip` | Help text |

---

### MapLibre GL JS 4.x

**Version:** 4.x
**Purpose:** Interactive map rendering

#### Rationale

- **Open Source**: No vendor lock-in (Mapbox alternative)
- **Free Tiles**: Compatible with OpenFreeMap, MapTiler free tier
- **WebGL**: Smooth 60fps rendering
- **React Integration**: react-map-gl adapter available
- **Customization**: Full control over styling

#### Configuration

```typescript
// lib/maps/config.ts
export const mapConfig = {
  styles: {
    light: 'https://tiles.openfreemap.org/styles/liberty',
    dark: 'https://tiles.openfreemap.org/styles/dark',
  },
  defaults: {
    zoom: 15,
    minZoom: 10,
    maxZoom: 18,
    attributionControl: true,
    trackResize: true,
  },
  markers: {
    driver: {
      size: 40,
      anchor: 'center',
    },
    destination: {
      size: 32,
      anchor: 'bottom',
    },
  },
};

// Tile sources (alternatives)
export const tileSources = {
  openFreeMap: 'https://tiles.openfreemap.org/styles/{style}',
  mapTiler: 'https://api.maptiler.com/maps/{style}/style.json?key={key}',
  stadia: 'https://tiles.stadiamaps.com/styles/{style}.json',
};
```

---

### TanStack Query 5.x

**Version:** 5.x
**Purpose:** Server state management

#### Rationale

- **Caching**: Automatic request deduplication and caching
- **Background Updates**: Stale-while-revalidate pattern
- **Optimistic Updates**: Instant UI feedback
- **Suspense Support**: Native React Suspense integration
- **DevTools**: Powerful debugging tools

#### Configuration

```typescript
// lib/query/client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

### Zustand 5.x

**Version:** 5.x
**Purpose:** Client state management

#### Rationale

- **Minimal API**: Simple, hooks-based state management
- **No Boilerplate**: Less code than Redux
- **TypeScript**: Excellent type inference
- **Middleware**: Persist, devtools, immer support
- **Performance**: Selective re-rendering

#### Store Example

```typescript
// stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  sortOrder: 'eta' | 'alphabetical' | 'recent' | 'manual';
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSortOrder: (order: UIState['sortOrder']) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      sortOrder: 'eta',
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSortOrder: (sortOrder) => set({ sortOrder }),
    }),
    { name: 'dropdeck-ui' }
  )
);
```

---

## Backend Stack

### tRPC 11.x

**Version:** 11.x
**Purpose:** End-to-end typesafe APIs

#### Rationale

- **Type Safety**: Shared types between client and server
- **No Code Generation**: Types inferred automatically
- **Subscriptions**: WebSocket and SSE support
- **Batching**: Automatic request batching
- **React Query Integration**: Seamless with TanStack Query

#### Configuration

```typescript
// server/trpc/init.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type Context } from './context';
import superjson from 'superjson';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
    },
  });
});
```

---

### NextAuth.js 5.x (Auth.js)

**Version:** 5.x
**Purpose:** Authentication framework

#### Rationale

- **Multiple Providers**: 50+ OAuth providers supported
- **Database Adapters**: Drizzle adapter available
- **Edge Compatible**: Works with Next.js middleware
- **Session Strategies**: JWT and database sessions
- **Security**: CSRF protection, secure cookies

#### Configuration

```typescript
// lib/auth/config.ts
import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { db } from '@/lib/db/client';

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
```

---

### Drizzle ORM

**Version:** 0.35.x
**Purpose:** TypeScript ORM

#### Rationale

- **Type Safety**: Schema-first with full TypeScript support
- **SQL-Like**: Familiar syntax for SQL developers
- **Performance**: Lightweight, no query overhead
- **Migrations**: Built-in migration tooling
- **Zod Integration**: Schema validation with drizzle-zod

#### Schema Example

```typescript
// lib/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

// Modern identity columns (PostgreSQL 10+)
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});

export const platformConnections = pgTable('platform_connections', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: text('platform').notNull(),
  accessTokenEncrypted: jsonb('access_token_encrypted'),
  refreshTokenEncrypted: jsonb('refresh_token_encrypted'),
  sessionDataEncrypted: jsonb('session_data_encrypted'),
  expiresAt: timestamp('expires_at'),
  lastSyncAt: timestamp('last_sync_at'),
  status: text('status').default('connected').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdateFn(() => new Date()),
});
```

---

## Infrastructure

### PostgreSQL (Neon)

**Version:** 16.x
**Provider:** Neon
**Purpose:** Primary database

#### Rationale

- **Serverless**: Auto-scaling, pay-per-use
- **Branching**: Database branching for development
- **Pooling**: Built-in connection pooling
- **Cost**: Generous free tier
- **Compatibility**: Standard PostgreSQL

#### Connection

```typescript
// lib/db/client.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

---

### Redis (Upstash)

**Version:** 7.x
**Provider:** Upstash
**Purpose:** Caching, pub/sub, rate limiting

#### Rationale

- **Serverless**: HTTP-based, edge-compatible
- **Global**: Multi-region replication
- **Pub/Sub**: Real-time event distribution
- **Rate Limiting**: Built-in rate limiting SDK
- **Cost**: Pay-per-request pricing

#### Configuration

```typescript
// lib/realtime/redis.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Pub/sub for real-time updates
export async function publishDeliveryUpdate(
  userId: string,
  delivery: UnifiedDelivery
) {
  await redis.publish(`user:${userId}:deliveries`, JSON.stringify(delivery));
}
```

---

### Ably

**Provider:** Ably
**Purpose:** Managed WebSocket infrastructure

#### Rationale

- **Managed**: No WebSocket server to maintain
- **Scalable**: Handles millions of connections
- **Reliability**: 99.999% uptime SLA
- **Features**: Presence, history, push notifications
- **Edge**: Global edge network

#### Configuration

```typescript
// lib/realtime/ably.ts
import Ably from 'ably';

export const ably = new Ably.Realtime({
  key: process.env.ABLY_API_KEY!,
  clientId: 'dropdeck-server',
});

export function getAblyTokenRequest(userId: string) {
  return ably.auth.createTokenRequest({
    clientId: userId,
    capability: {
      [`user:${userId}:*`]: ['subscribe'],
      'system:status': ['subscribe'],
    },
  });
}
```

---

## Development Tools

### Bun

**Purpose:** JavaScript runtime and package manager

#### Rationale

- **Speed**: Fastest package installation
- **Runtime**: Drop-in Node.js replacement
- **Built-in**: Test runner, bundler included
- **TypeScript**: Native TypeScript execution

#### Scripts

```json
// package.json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

---

### Biome

**Purpose:** Linting and formatting

#### Rationale

- **Fast**: Written in Rust, extremely fast
- **All-in-One**: Replaces ESLint + Prettier
- **Zero Config**: Sensible defaults
- **TypeScript**: First-class TypeScript support

#### Configuration

```json
// biome.json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always"
    }
  }
}
```

---

### Vitest

**Purpose:** Unit and integration testing

#### Rationale

- **Fast**: Vite-powered, instant HMR
- **Compatible**: Jest-compatible API
- **TypeScript**: Native TypeScript support
- **UI**: Built-in UI for debugging

#### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
```

---

### Playwright

**Purpose:** End-to-end testing

#### Rationale

- **Cross-Browser**: Chrome, Firefox, Safari
- **Reliable**: Auto-wait, no flaky tests
- **Debugging**: Trace viewer, screenshots
- **TypeScript**: Full TypeScript support

#### Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Monitoring & Observability

### Sentry

**Purpose:** Error tracking and performance monitoring

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [Sentry.replayIntegration()],
});
```

### PostHog

**Purpose:** Product analytics

```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: false, // Manual capture for SPA
  });
}
```

---

## Dependency Summary

```json
// package.json (core dependencies)
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "next-auth": "^5.0.0",
    "drizzle-orm": "^0.35.0",
    "@neondatabase/serverless": "^0.10.0",
    "@upstash/redis": "^1.34.0",
    "ably": "^2.0.0",
    "maplibre-gl": "^4.0.0",
    "zustand": "^5.0.0",
    "zod": "^3.23.0",
    "tailwindcss": "^4.0.0",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.450.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@biomejs/biome": "^1.9.0",
    "vitest": "^2.0.0",
    "@playwright/test": "^1.48.0",
    "drizzle-kit": "^0.26.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0"
  }
}
```

---

*Document Version: 1.0 | Last Updated: January 2026*
