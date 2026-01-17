# DropDeck: Deployment Guide

## Overview

This document covers the deployment architecture, CI/CD pipeline configuration, environment setup, and monitoring for DropDeck.

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph GitHub["GitHub"]
        Repo[Repository]
        Actions[GitHub Actions]
        Secrets[GitHub Secrets]
    end

    subgraph Vercel["Vercel Platform"]
        Preview[Preview Deployments]
        Production[Production]
        Edge[Edge Network]
        KV[Vercel KV]
    end

    subgraph External["External Services"]
        Neon[(Neon PostgreSQL)]
        Upstash[(Upstash Redis)]
        Ably[Ably Realtime]
        Sentry[Sentry]
        PostHog[PostHog]
    end

    Repo -->|Push/PR| Actions
    Actions -->|Deploy| Vercel
    Secrets -->|Inject| Actions

    Vercel --> Edge
    Edge --> Neon
    Edge --> Upstash
    Edge --> Ably

    Production --> Sentry
    Production --> PostHog
```

---

## Infrastructure Providers

| Service | Provider | Plan | Purpose |
|---------|----------|------|---------|
| **Hosting** | Vercel | Pro | Next.js hosting, Edge functions |
| **Database** | Neon | Scale | Serverless PostgreSQL |
| **Cache/Pub-Sub** | Upstash | Pro | Redis, real-time events |
| **WebSockets** | Ably | Free/Growth | Real-time client connections |
| **Error Tracking** | Sentry | Team | Error monitoring, performance |
| **Analytics** | PostHog | Free | Product analytics |
| **Email** | Resend | Free | Transactional emails |

---

## Environment Variables

### Required Variables

```bash
# .env.local (development)
# .env.production (production)

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL="https://dropdeck.app"
NEXT_PUBLIC_APP_NAME="DropDeck"

# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:pass@host:5432/dropdeck?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@host:5432/dropdeck?sslmode=require"

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL="https://dropdeck.app"
NEXTAUTH_SECRET="<32+ character random string>"

# Google OAuth
AUTH_GOOGLE_ID="<google-client-id>"
AUTH_GOOGLE_SECRET="<google-client-secret>"

# GitHub OAuth
AUTH_GITHUB_ID="<github-client-id>"
AUTH_GITHUB_SECRET="<github-client-secret>"

# ============================================
# ENCRYPTION
# ============================================
TOKEN_ENCRYPTION_KEY="<64 hex characters (256 bits)>"

# ============================================
# REDIS / CACHE
# ============================================
UPSTASH_REDIS_REST_URL="https://<region>.upstash.io"
UPSTASH_REDIS_REST_TOKEN="<upstash-token>"

# ============================================
# REAL-TIME
# ============================================
ABLY_API_KEY="<ably-api-key>"
NEXT_PUBLIC_ABLY_KEY="<ably-client-key>"

# ============================================
# PLATFORM API KEYS
# ============================================
# Instacart
INSTACART_CLIENT_ID="<instacart-client-id>"
INSTACART_CLIENT_SECRET="<instacart-client-secret>"
INSTACART_WEBHOOK_SECRET="<instacart-webhook-secret>"

# DoorDash
DOORDASH_DEVELOPER_ID="<doordash-developer-id>"
DOORDASH_KEY_ID="<doordash-key-id>"
DOORDASH_SIGNING_SECRET="<doordash-signing-secret>"
DOORDASH_WEBHOOK_SECRET="<doordash-webhook-secret>"

# Uber Eats
UBER_CLIENT_ID="<uber-client-id>"
UBER_CLIENT_SECRET="<uber-client-secret>"

# Amazon
AMAZON_SELLER_ID="<amazon-seller-id>"
AMAZON_CLIENT_ID="<amazon-client-id>"
AMAZON_CLIENT_SECRET="<amazon-client-secret>"

# ============================================
# MONITORING
# ============================================
SENTRY_DSN="https://<key>@sentry.io/<project>"
NEXT_PUBLIC_SENTRY_DSN="https://<key>@sentry.io/<project>"
SENTRY_AUTH_TOKEN="<sentry-auth-token>"
SENTRY_ORG="<sentry-org>"
SENTRY_PROJECT="dropdeck"

NEXT_PUBLIC_POSTHOG_KEY="<posthog-project-key>"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### Environment Validation

```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']),

  // Database
  DATABASE_URL: z.string().startsWith('postgresql://'),

  // Auth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_ID: z.string(),
  AUTH_GOOGLE_SECRET: z.string(),

  // Encryption
  TOKEN_ENCRYPTION_KEY: z.string().length(64).regex(/^[0-9a-fA-F]+$/),

  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),

  // Ably
  ABLY_API_KEY: z.string(),
});

export const env = envSchema.parse(process.env);
```

---

## Vercel Configuration

### vercel.json

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/webhook/**/*.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/app",
      "destination": "/",
      "permanent": true
    }
  ]
}
```

### Next.js Production Config

```typescript
// next.config.ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      { protocol: 'https', hostname: '*.instacart.com' },
      { protocol: 'https', hostname: '*.doordash.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(config, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  # ============================================
  # LINT & TYPE CHECK
  # ============================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run Biome lint
        run: bun run lint

      - name: Run type check
        run: bun run typecheck

  # ============================================
  # UNIT TESTS
  # ============================================
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: dropdeck_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run database migrations
        run: bun run db:push
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dropdeck_test

      - name: Run tests with coverage
        run: bun run test --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dropdeck_test
          TOKEN_ENCRYPTION_KEY: ${{ secrets.TEST_ENCRYPTION_KEY }}
          NEXTAUTH_SECRET: test-secret

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

  # ============================================
  # E2E TESTS
  # ============================================
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Install Playwright browsers
        run: bunx playwright install --with-deps chromium

      - name: Run E2E tests
        run: bun run test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          NEXTAUTH_SECRET: test-secret

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # ============================================
  # SECURITY SCAN
  # ============================================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # ============================================
  # BUILD
  # ============================================
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, e2e]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Build application
        run: bun run build
        env:
          NEXT_PUBLIC_APP_URL: https://dropdeck.app
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next/

  # ============================================
  # DEPLOY PREVIEW
  # ============================================
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Preview
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$url" >> $GITHUB_OUTPUT

      - name: Comment PR with Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed to: ${{ steps.deploy.outputs.url }}'
            })

  # ============================================
  # DEPLOY PRODUCTION
  # ============================================
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://dropdeck.app
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm i -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Create Sentry Release
        uses: getsentry/action-release@v1
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: dropdeck
        with:
          environment: production
```

---

## Database Migrations

### Migration Script

```typescript
// scripts/migrate.ts
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { db } from '@/lib/db/client';

async function runMigrations() {
  console.log('Running migrations...');

  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "bun run scripts/migrate.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "bun run scripts/seed.ts"
  }
}
```

---

## Monitoring & Observability

### Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
});
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { redis } from '@/lib/realtime/redis';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Database check
  try {
    await db.execute('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // Redis check
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: allOk ? 200 : 503 }
  );
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] No security vulnerabilities (Snyk clean)
- [ ] Environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] Sentry project configured
- [ ] DNS records pointing to Vercel

### Post-Deployment

- [ ] Health check endpoint responding
- [ ] Authentication flow working
- [ ] Platform connections functional
- [ ] Real-time updates working
- [ ] Error tracking receiving events
- [ ] Analytics tracking page views

### Rollback Procedure

```bash
# List recent deployments
vercel list

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or promote a specific deployment
vercel promote <deployment-url>
```

---

## Scaling Considerations

### Vercel Limits (Pro Plan)

| Resource | Limit |
|----------|-------|
| Serverless Functions | 30s timeout |
| Edge Functions | 25ms CPU time |
| Bandwidth | 1TB/month |
| Builds | 6000/month |
| Concurrent Builds | 12 |

### Database Scaling (Neon)

| Tier | Connections | Storage | Compute |
|------|-------------|---------|---------|
| Free | 100 | 0.5GB | 0.25 vCPU |
| Launch | 500 | 10GB | 1 vCPU |
| Scale | 1000+ | 50GB+ | 2+ vCPU |

### Redis Scaling (Upstash)

| Tier | Commands/day | Storage | Connections |
|------|--------------|---------|-------------|
| Free | 10K | 256MB | 100 |
| Pay-as-you-go | Unlimited | 10GB | 1000 |

---

*Document Version: 1.0 | Last Updated: January 2026*
