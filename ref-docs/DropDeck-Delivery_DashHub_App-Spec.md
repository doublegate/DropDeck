# DropDeck: Multi-Platform Delivery Tracking Aggregator

## Specification & Implementation Planning Document

**Version:** 1.0  
**Date:** January 16, 2026  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Platform Integration Analysis](#2-platform-integration-analysis)
3. [Technical Architecture](#3-technical-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Feature Specifications](#5-feature-specifications)
6. [UI/UX Design Specifications](#6-uiux-design-specifications)
7. [Authentication & Security](#7-authentication--security)
8. [Data Architecture](#8-data-architecture)
9. [API Design](#9-api-design)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Risk Analysis & Mitigations](#11-risk-analysis--mitigations)
12. [Legal Considerations](#12-legal-considerations)

---

## 1. Executive Overview

### 1.1 Project Vision

DropDeck is a responsive web application designed to aggregate and display real-time delivery tracking information from multiple delivery platforms in a unified, intuitive interface. Users can view driver locations, estimated delivery times, and order status across all their active deliveries simultaneously.

### 1.2 Target Platforms

| Platform | Category | Primary Use |
|----------|----------|-------------|
| **Instacart** | Grocery | Full-service grocery shopping & delivery |
| **DoorDash** | Food/Convenience | Restaurant & convenience delivery |
| **Uber Eats** | Food/Grocery | Restaurant & grocery delivery |
| **Amazon Fresh / Whole Foods** | Grocery | Amazon grocery fulfillment |
| **Walmart+** | Grocery/General | Walmart delivery subscription |
| **Shipt** | Grocery | Target-owned grocery delivery |
| **Drizly** | Alcohol | Beer, wine, spirits delivery |
| **Total Wine** | Alcohol | Alcohol retail delivery |
| **Costco** | Wholesale | Warehouse club delivery |
| **Sam's Club** | Wholesale | Warehouse club delivery |
| **Amazon** | General | Standard Amazon package delivery |

### 1.3 Core Value Proposition

- **Unified Dashboard**: Single view of all active deliveries across platforms
- **Real-time Tracking**: Live driver location updates with accurate ETAs
- **Platform Agnostic**: Seamlessly integrates multiple delivery services
- **Persistent Sessions**: OAuth tokens persist across browser sessions
- **Responsive Design**: Optimal experience across desktop, tablet, and mobile

---

## 2. Platform Integration Analysis

### 2.1 API Availability Assessment

Based on comprehensive research, delivery platform APIs fall into three categories regarding consumer-facing integration capabilities:

#### 2.1.1 Platforms with Consumer/Partner APIs

| Platform | API Type | Access Level | Notes |
|----------|----------|--------------|-------|
| **Uber Eats** | Consumer Delivery API | Early Access (case-by-case) | Order status, tracking URL, courier location |
| **Instacart** | Developer Platform API | Partner/Retailer only | Connect APIs for order tracking (retailer-restricted) |
| **DoorDash** | Drive API | Business/Merchant | Webhooks for delivery status, dasher location |
| **Amazon** | Shipping API v2 | Seller/Business | Tracking status, GPS coordinates, photo on delivery |

#### 2.1.2 Platforms with Limited/No Public APIs

| Platform | Current Status | Integration Strategy |
|----------|----------------|---------------------|
| **Walmart+** | Marketplace API (seller-only) | OAuth + Authenticated Session Proxy |
| **Shipt** | No public API | OAuth + Session-based polling |
| **Drizly** | Legacy API (2014), now Uber-owned | May integrate via Uber infrastructure |
| **Total Wine** | No public API | Session-based tracking |
| **Costco** | Uses Instacart for delivery | Instacart integration pathway |
| **Sam's Club** | No public API | Session-based tracking |

### 2.2 Integration Architecture Patterns

Given the heterogeneous API landscape, DropDeck employs three primary integration strategies:

#### Pattern A: Direct API Integration
For platforms with official consumer/partner APIs (Uber Eats, potentially Instacart):
```
User → DropDeck Backend → Platform API → Real-time Data
```

#### Pattern B: OAuth Session Proxy
For platforms supporting OAuth but without tracking APIs:
```
User → Platform OAuth → DropDeck (stores tokens) → Authenticated Session Requests
```

#### Pattern C: Embedded WebView with Message Bridge
For platforms without APIs, leveraging the user's authenticated session:
```
User → Platform Login (in iframe/webview) → PostMessage Bridge → DropDeck UI
```

### 2.3 Data Extraction Capabilities by Platform

| Platform | Driver Location | ETA | Order Status | Live Map |
|----------|-----------------|-----|--------------|----------|
| Instacart | ✓ (Post-checkout API) | ✓ | ✓ | ✓ (hosted page) |
| DoorDash | ✓ (lat/lng in webhooks) | ✓ | ✓ | ✓ (tracking URL) |
| Uber Eats | ✓ (courier_trips) | ✓ | ✓ | ✓ (tracking URL) |
| Amazon | ✓ (delivery photo GPS) | ✓ | ✓ | ✓ (map tracking) |
| Walmart+ | Limited | ✓ | ✓ | Partial |
| Shipt | Session-dependent | ✓ | ✓ | Session-dependent |
| Drizly | ✓ (app feature) | ✓ | ✓ | ✓ |
| Total Wine | Limited | ✓ | ✓ | Limited |
| Costco | Via Instacart | Via Instacart | Via Instacart | Via Instacart |
| Sam's Club | Limited | ✓ | ✓ | Limited |

---

## 3. Technical Architecture

### 3.1 High-Level System Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                  │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 15 App Router                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ React 19     │  │ MapLibre GL  │  │  TanStack Query          │   │   │
│  │  │ Components   │  │ Maps         │  │  (Real-time state)       │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │ WebSocket / REST
┌───────────────────────────────────▼────────────────────────────────────────┐
│                              API LAYER                                     │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js API Routes / tRPC                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ Auth Routes  │  │ Platform     │  │  WebSocket Server        │   │   │
│  │  │ (NextAuth)   │  │ Aggregator   │  │  (Socket.io/Ably)        │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────────┐
│                           SERVICE LAYER                                    │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐    │
│  │ Instacart   │ │ DoorDash    │ │ Uber Eats   │ │ Amazon             │    │
│  │ Adapter     │ │ Adapter     │ │ Adapter     │ │ Adapter            │    │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └─────────┬──────────┘    │
│         │               │               │                  │               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────────────┐    │
│  │ Walmart+    │ │ Shipt       │ │ Drizly      │ │ Session Manager    │    │
│  │ Adapter     │ │ Adapter     │ │ Adapter     │ │ (Cookie/Token)     │    │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────────────┘    │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────────┐
│                           DATA LAYER                                       │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐    │
│  │ PostgreSQL          │  │ Redis               │  │ Encrypted        │    │
│  │ (User data, prefs)  │  │ (Session cache,     │  │ Token Store      │    │
│  │                     │  │  real-time state)   │  │                  │    │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘    │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── callback/[platform]/
│   ├── (dashboard)/              # Main app route group
│   │   ├── page.tsx              # Dashboard home
│   │   └── settings/
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── platforms/
│   │   │   ├── [platform]/
│   │   │   │   ├── connect/
│   │   │   │   ├── disconnect/
│   │   │   │   └── orders/
│   │   └── webhook/
│   │       └── [platform]/
│   └── layout.tsx
├── components/
│   ├── dashboard/
│   │   ├── DeliveryGrid.tsx      # Main grid container
│   │   ├── DeliveryPane.tsx      # Individual platform pane
│   │   └── PaneControls.tsx      # Sort/filter controls
│   ├── maps/
│   │   ├── MapContainer.tsx      # MapLibre wrapper
│   │   ├── DriverMarker.tsx      # Animated driver icon
│   │   ├── DestinationMarker.tsx
│   │   └── RoutePolyline.tsx
│   ├── platform/
│   │   ├── PlatformIcon.tsx      # Brand icons
│   │   ├── ConnectionStatus.tsx
│   │   └── LoginModal.tsx
│   └── ui/                       # shadcn/ui components
├── hooks/
│   ├── useDeliveries.ts          # TanStack Query hook
│   ├── useRealTimeLocation.ts    # WebSocket subscription
│   ├── usePlatformAuth.ts        # OAuth flow management
│   └── usePreferences.ts         # User settings
├── lib/
│   ├── adapters/                 # Platform adapters
│   │   ├── base.ts               # Abstract adapter class
│   │   ├── instacart.ts
│   │   ├── doordash.ts
│   │   ├── ubereats.ts
│   │   ├── amazon.ts
│   │   ├── walmart.ts
│   │   ├── shipt.ts
│   │   ├── drizly.ts
│   │   ├── totalwine.ts
│   │   ├── costco.ts
│   │   └── samsclub.ts
│   ├── auth/
│   │   ├── providers.ts          # NextAuth provider configs
│   │   └── token-encryption.ts
│   ├── db/
│   │   ├── schema.ts             # Drizzle ORM schema
│   │   └── client.ts
│   └── utils/
│       ├── geo.ts                # Coordinate utilities
│       └── time.ts               # ETA calculations
├── stores/
│   └── delivery-store.ts         # Zustand global state
└── types/
    ├── delivery.ts               # Unified delivery types
    └── platform.ts               # Platform-specific types
```

### 3.3 Real-Time Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME UPDATE FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────┐
                    │     Platform Event Sources      │
                    │  • Webhook callbacks            │
                    │  • Polling intervals            │
                    │  • WebSocket streams            │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │       Event Normalizer          │
                    │  • Standardize payload format   │
                    │  • Extract location data        │
                    │  • Calculate unified ETA        │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │         Redis Pub/Sub           │
                    │  Channel: user:{userId}:updates │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │     WebSocket Server            │
                    │  • Maintain client connections  │
                    │  • Push to subscribed clients   │
                    └───────────────┬─────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │       React Client              │
                    │  • TanStack Query cache update  │
                    │  • Map marker animation         │
                    │  • ETA countdown refresh        │
                    └─────────────────────────────────┘
```

---

## 4. Technology Stack

### 4.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | Full-stack React framework with App Router |
| **React** | 19.x | UI component library |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **shadcn/ui** | Latest | Accessible component library |
| **MapLibre GL JS** | 4.x | Open-source map rendering (Mapbox alternative) |
| **TanStack Query** | 5.x | Server state management & caching |
| **Zustand** | 5.x | Client state management |
| **Framer Motion** | 11.x | Smooth animations |
| **React Hook Form** | 7.x | Form handling |
| **Zod** | 3.x | Runtime schema validation |

### 4.2 Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.x | Serverless API endpoints |
| **tRPC** | 11.x | End-to-end typesafe APIs |
| **NextAuth.js** | 5.x | Authentication framework |
| **Drizzle ORM** | 0.35.x | TypeScript ORM |
| **PostgreSQL** | 16.x | Primary database |
| **Redis** | 7.x | Caching & real-time pub/sub |
| **Ably** | Latest | Managed WebSocket infrastructure |

### 4.3 Infrastructure & DevOps

| Technology | Purpose |
|------------|---------|
| **Vercel** | Next.js hosting & edge functions |
| **Neon** | Serverless PostgreSQL |
| **Upstash** | Serverless Redis |
| **Resend** | Transactional email |
| **Sentry** | Error monitoring |
| **Posthog** | Product analytics |

### 4.4 Development Tools

| Tool | Purpose |
|------|---------|
| **Bun** | Fast JavaScript runtime & package manager |
| **Biome** | Linting & formatting (ESLint/Prettier alternative) |
| **Playwright** | End-to-end testing |
| **Vitest** | Unit testing |
| **Storybook** | Component development & documentation |

---

## 5. Feature Specifications

### 5.1 Core Features

#### F1: Multi-Platform Authentication

**Description**: Users can connect/disconnect individual delivery platform accounts using OAuth 2.0 or session-based authentication.

**Acceptance Criteria**:
- [ ] Support OAuth 2.0 Authorization Code flow for platforms that offer it
- [ ] Secure credential storage with AES-256 encryption at rest
- [ ] Token refresh handling with automatic re-authentication prompts
- [ ] Clear visual indication of connection status per platform
- [ ] Graceful handling of authentication failures

**Technical Notes**:
```typescript
interface PlatformConnection {
  platformId: string;
  userId: string;
  accessToken: string | null;      // Encrypted
  refreshToken: string | null;     // Encrypted
  sessionCookies: string | null;   // Encrypted, for session-based
  expiresAt: Date | null;
  lastSyncAt: Date;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
}
```

#### F2: Real-Time Delivery Map Display

**Description**: Display driver location on an interactive map with smooth animations and ETA countdown.

**Acceptance Criteria**:
- [ ] MapLibre GL rendering with custom tile source
- [ ] Driver marker with platform-specific icon overlay
- [ ] Smooth interpolation between location updates (60fps target)
- [ ] Route polyline from driver to destination
- [ ] Destination marker with delivery address
- [ ] Real-time ETA countdown (updates every second)
- [ ] Map auto-centers on active delivery area

**Technical Notes**:
```typescript
interface DeliveryLocation {
  deliveryId: string;
  platform: Platform;
  driver: {
    lat: number;
    lng: number;
    heading?: number;      // For rotated marker
    speed?: number;        // For interpolation
    lastUpdate: Date;
  };
  destination: {
    lat: number;
    lng: number;
    address: string;
  };
  eta: {
    minutes: number;
    updatedAt: Date;
    confidence?: 'high' | 'medium' | 'low';
  };
}
```

#### F3: Responsive Grid Layout

**Description**: Dynamic grid layout that optimally arranges delivery panes based on viewport size and number of active deliveries.

**Acceptance Criteria**:
- [ ] Borderless pane design with minimal visual separation
- [ ] Auto-responsive: 1 column (mobile) → 2 columns (tablet) → 3-4 columns (desktop)
- [ ] Maintains aspect ratio for map legibility
- [ ] Smooth resize transitions
- [ ] Empty state for platforms with no active deliveries

**Layout Algorithm**:
```typescript
function calculateGridLayout(
  viewportWidth: number,
  viewportHeight: number,
  activeDeliveries: number
): GridLayout {
  const minPaneWidth = 320;   // Minimum for readable map
  const minPaneHeight = 240;
  
  const maxCols = Math.floor(viewportWidth / minPaneWidth);
  const cols = Math.min(maxCols, activeDeliveries, 4);
  const rows = Math.ceil(activeDeliveries / cols);
  
  return {
    columns: cols,
    rows: rows,
    paneWidth: viewportWidth / cols,
    paneHeight: viewportHeight / rows,
  };
}
```

#### F4: Platform Toggle Controls

**Description**: Enable/disable visibility of specific platforms from the dashboard.

**Acceptance Criteria**:
- [ ] Toggle switch per platform in settings panel
- [ ] Platforms can be hidden even when connected
- [ ] Toggle state persists in user preferences
- [ ] Visual feedback when platform is toggled off

#### F5: Sorting & Organization

**Description**: Multiple sorting options for delivery pane arrangement.

**Sort Options**:
| Sort Mode | Description |
|-----------|-------------|
| **Alphabetical** | Platform name A-Z |
| **Time to Delivery** | Nearest ETA first |
| **Most Recent** | Last updated first |
| **Manual** | Drag-and-drop order (persisted) |

**Acceptance Criteria**:
- [ ] Sort selector in toolbar
- [ ] Instant re-ordering with animation
- [ ] Manual sort persists to user preferences
- [ ] Default sort: Time to Delivery

#### F6: Theme Support

**Description**: Light, dark, and system-preference theme modes.

**Acceptance Criteria**:
- [ ] Three-way toggle: Auto (system) / Light / Dark
- [ ] Instant theme switching without page reload
- [ ] Theme affects map styling (MapLibre dark style for dark mode)
- [ ] Preference persists via localStorage and syncs to account

**Implementation**:
```typescript
const themes = {
  light: {
    mapStyle: 'https://tiles.openfreemap.org/styles/liberty',
    background: '#ffffff',
    foreground: '#0a0a0a',
  },
  dark: {
    mapStyle: 'https://tiles.openfreemap.org/styles/dark',
    background: '#0a0a0a',
    foreground: '#fafafa',
  },
};
```

#### F7: Session Persistence

**Description**: Connected platform accounts and user preferences persist across browser sessions.

**Acceptance Criteria**:
- [ ] OAuth tokens stored encrypted in database
- [ ] Session cookies stored encrypted for session-based platforms
- [ ] Automatic token refresh on app load
- [ ] "Remember me" functionality (30-day sessions)
- [ ] Preferences sync across devices when logged in

### 5.2 Additional Features

#### F8: Push Notifications (PWA)

**Description**: Browser push notifications for delivery status changes.

**Notifications**:
- Driver assigned
- Order picked up / out for delivery
- Arriving soon (5 min warning)
- Delivered
- Delivery issue/delay

#### F9: Delivery History

**Description**: View past deliveries with completion timestamps and details.

#### F10: Quick Actions

**Description**: Common actions accessible from each delivery pane.

**Actions**:
- Contact driver (where available)
- View full tracking page (opens platform app/site)
- Report issue
- Share ETA

---

## 6. UI/UX Design Specifications

### 6.1 Visual Design Principles

1. **Borderless Panes**: Delivery panes use subtle elevation/shadow rather than visible borders
2. **Platform Identity**: Each pane displays recognizable platform branding (icon + color accent)
3. **Information Hierarchy**: ETA prominently displayed, followed by status, then map
4. **Minimal Chrome**: Focus on delivery information, not app UI
5. **Smooth Animations**: 60fps transitions for grid changes and map updates

### 6.2 Component Specifications

#### Delivery Pane Layout (or something similar)

```
┌─────────────────────────────────────────┐
│ [Platform Icon] DoorDash        14 min  │ ← Header: Icon, Name, ETA
├─────────────────────────────────────────┤
│                                         │
│              ┌──────┐                   │
│              │ 📍🚗  │←──────────        │ ← Map with driver marker
│              └──────┘                   │
│                    ↓                    │
│                    📍                   │ ← Destination marker
│                                         │
├─────────────────────────────────────────┤
│ Out for delivery • 2.3 mi away          │ ← Status bar
└─────────────────────────────────────────┘
```

#### Platform Icons & Colors

| Platform | Icon | Primary Color |
|----------|------|---------------|
| Instacart | 🥕 (carrot) | #43B02A |
| DoorDash | 🔴 | #FF3008 |
| Uber Eats | 🟢 | #06C167 |
| Amazon Fresh | 🟠 | #FF9900 |
| Walmart+ | 🔵 | #0071DC |
| Shipt | 🟢 | #00A651 |
| Drizly | 🍺 | #2D2D2D |
| Total Wine | 🍷 | #8B0000 |
| Costco | 🔴 | #E31837 |
| Sam's Club | 🔵 | #0067A0 |
| Amazon | 📦 | #FF9900 |

### 6.3 Responsive Breakpoints

| Breakpoint | Width | Columns | Behavior |
|------------|-------|---------|----------|
| Mobile | < 640px | 1 | Stack vertically, swipeable |
| Tablet | 640-1024px | 2 | Side-by-side |
| Desktop | 1024-1440px | 3 | Optimal viewing |
| Wide | > 1440px | 4 | Max columns |

### 6.4 Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all controls
- Screen reader announcements for ETA updates
- High contrast mode support
- Reduced motion preference respected

---

## 7. Authentication & Security

### 7.1 Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │     │   DropDeck   │     │   Platform   │
│   Browser    │     │   Backend    │     │   (OAuth)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ 1. Click "Connect Instacart"            │
       │───────────────────>│                    │
       │                    │                    │
       │ 2. Redirect to OAuth                    │
       │<───────────────────│                    │
       │                    │                    │
       │ 3. Login & Authorize                    │
       │────────────────────────────────────────>│
       │                    │                    │
       │ 4. Redirect with auth code              │
       │<────────────────────────────────────────│
       │                    │                    │
       │ 5. Code exchange                        │
       │───────────────────>│ 6. Token request   │
       │                    │───────────────────>│
       │                    │                    │
       │                    │ 7. Access + Refresh tokens
       │                    │<───────────────────│
       │                    │                    │
       │                    │ 8. Encrypt & Store │
       │                    │ ────────┐          │
       │                    │         │          │
       │                    │ <───────┘          │
       │                    │                    │
       │ 9. Success         │                    │
       │<───────────────────│                    │
```

### 7.2 Token Security

**Encryption at Rest**:
```typescript
// Token encryption using AES-256-GCM
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY; // 32 bytes

function encryptToken(token: string): EncryptedToken {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}
```

### 7.3 Security Considerations

| Threat | Mitigation |
|--------|------------|
| Token theft | AES-256-GCM encryption, secure httpOnly cookies |
| XSS attacks | CSP headers, sanitized inputs, React auto-escaping |
| CSRF attacks | SameSite cookies, CSRF tokens |
| Session hijacking | Short-lived JWTs, secure refresh rotation |
| API abuse | Rate limiting, request signing |
| Data breach | Encryption at rest, minimal data retention |

---

## 8. Data Architecture

### 8.1 Database Schema (Drizzle ORM)

```typescript
// schema.ts
import { pgTable, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const platformConnections = pgTable('platform_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  platform: text('platform').notNull(),
  accessTokenEncrypted: jsonb('access_token_encrypted'),
  refreshTokenEncrypted: jsonb('refresh_token_encrypted'),
  sessionDataEncrypted: jsonb('session_data_encrypted'),
  expiresAt: timestamp('expires_at'),
  lastSyncAt: timestamp('last_sync_at'),
  status: text('status').default('connected'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').references(() => users.id).primaryKey(),
  theme: text('theme').default('system'),
  sortOrder: text('sort_order').default('eta'),
  enabledPlatforms: jsonb('enabled_platforms').default([]),
  manualPlatformOrder: jsonb('manual_platform_order'),
  notificationsEnabled: boolean('notifications_enabled').default(true),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const deliveryCache = pgTable('delivery_cache', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  platform: text('platform').notNull(),
  externalOrderId: text('external_order_id'),
  deliveryData: jsonb('delivery_data'),
  driverLocation: jsonb('driver_location'),
  etaMinutes: integer('eta_minutes'),
  status: text('status'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  expiresAt: timestamp('expires_at'),
});
```

### 8.2 Unified Delivery Data Model

```typescript
// types/delivery.ts

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
  id: string;
  platform: Platform;
  externalOrderId: string;
  
  status: DeliveryStatus;
  statusLabel: string;              // Human-readable status
  statusUpdatedAt: Date;
  
  driver?: {
    name?: string;
    photo?: string;
    phone?: string;                 // Masked
    vehicle?: {
      make?: string;
      model?: string;
      color?: string;
      licensePlate?: string;        // Partial
    };
    location?: {
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      timestamp: Date;
    };
  };
  
  destination: {
    address: string;
    lat: number;
    lng: number;
    instructions?: string;
  };
  
  eta: {
    estimatedArrival: Date;
    minutesRemaining: number;
    distanceRemaining?: {
      value: number;
      unit: 'miles' | 'km';
    };
    trafficConditions?: 'light' | 'moderate' | 'heavy';
  };
  
  order: {
    itemCount: number;
    totalAmount?: number;
    currency?: string;
    items?: Array<{
      name: string;
      quantity: number;
      imageUrl?: string;
    }>;
  };
  
  tracking: {
    url?: string;                   // Platform tracking page
    mapAvailable: boolean;
    liveUpdates: boolean;
  };
  
  timestamps: {
    ordered: Date;
    confirmed?: Date;
    preparing?: Date;
    readyForPickup?: Date;
    pickedUp?: Date;
    delivered?: Date;
  };
  
  meta: {
    lastFetchedAt: Date;
    nextFetchAt?: Date;
    fetchMethod: 'api' | 'webhook' | 'polling' | 'embedded';
  };
}
```

---

## 9. API Design

### 9.1 tRPC Router Structure

```typescript
// server/routers/index.ts
import { router } from '../trpc';
import { platformRouter } from './platform';
import { deliveryRouter } from './delivery';
import { preferenceRouter } from './preference';

export const appRouter = router({
  platform: platformRouter,
  delivery: deliveryRouter,
  preference: preferenceRouter,
});

export type AppRouter = typeof appRouter;
```

### 9.2 Platform Router

```typescript
// server/routers/platform.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';

export const platformRouter = router({
  // Get connection status for all platforms
  getConnections: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.query.platformConnections.findMany({
        where: eq(platformConnections.userId, ctx.session.user.id),
      });
    }),
  
  // Initiate OAuth flow for a platform
  initiateOAuth: protectedProcedure
    .input(z.object({ platform: z.enum(PLATFORMS) }))
    .mutation(async ({ ctx, input }) => {
      const adapter = getAdapter(input.platform);
      const authUrl = await adapter.getOAuthUrl(ctx.session.user.id);
      return { authUrl };
    }),
  
  // Handle OAuth callback
  handleCallback: protectedProcedure
    .input(z.object({
      platform: z.enum(PLATFORMS),
      code: z.string(),
      state: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adapter = getAdapter(input.platform);
      const tokens = await adapter.exchangeCode(input.code);
      
      // Encrypt and store tokens
      await ctx.db.insert(platformConnections).values({
        id: generateId(),
        userId: ctx.session.user.id,
        platform: input.platform,
        accessTokenEncrypted: encryptToken(tokens.accessToken),
        refreshTokenEncrypted: encryptToken(tokens.refreshToken),
        expiresAt: tokens.expiresAt,
        status: 'connected',
      });
      
      return { success: true };
    }),
  
  // Disconnect a platform
  disconnect: protectedProcedure
    .input(z.object({ platform: z.enum(PLATFORMS) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(platformConnections).where(
        and(
          eq(platformConnections.userId, ctx.session.user.id),
          eq(platformConnections.platform, input.platform)
        )
      );
      return { success: true };
    }),
});
```

### 9.3 Delivery Router

```typescript
// server/routers/delivery.ts
export const deliveryRouter = router({
  // Get all active deliveries for user
  getActive: protectedProcedure
    .query(async ({ ctx }) => {
      const connections = await ctx.db.query.platformConnections.findMany({
        where: eq(platformConnections.userId, ctx.session.user.id),
      });
      
      const deliveries: UnifiedDelivery[] = [];
      
      for (const conn of connections) {
        if (conn.status !== 'connected') continue;
        
        const adapter = getAdapter(conn.platform);
        const platformDeliveries = await adapter.getActiveDeliveries(conn);
        deliveries.push(...platformDeliveries);
      }
      
      return deliveries;
    }),
  
  // Get single delivery details
  getById: protectedProcedure
    .input(z.object({
      platform: z.enum(PLATFORMS),
      deliveryId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const conn = await ctx.db.query.platformConnections.findFirst({
        where: and(
          eq(platformConnections.userId, ctx.session.user.id),
          eq(platformConnections.platform, input.platform)
        ),
      });
      
      if (!conn) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const adapter = getAdapter(input.platform);
      return adapter.getDeliveryDetails(conn, input.deliveryId);
    }),
  
  // Subscribe to real-time updates (via WebSocket)
  onUpdate: protectedProcedure
    .subscription(({ ctx }) => {
      return observable<UnifiedDelivery>((emit) => {
        const channel = `user:${ctx.session.user.id}:deliveries`;
        
        const handleMessage = (delivery: UnifiedDelivery) => {
          emit.next(delivery);
        };
        
        redis.subscribe(channel, handleMessage);
        
        return () => {
          redis.unsubscribe(channel, handleMessage);
        };
      });
    }),
});
```

### 9.4 Webhook Handlers

```typescript
// app/api/webhook/[platform]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { platform } = params;
  const body = await req.json();
  
  // Verify webhook signature
  const signature = req.headers.get('x-webhook-signature');
  const adapter = getAdapter(platform);
  
  if (!adapter.verifyWebhook(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Normalize the delivery update
  const delivery = adapter.normalizeWebhookPayload(body);
  
  // Publish to Redis for real-time distribution
  await redis.publish(`user:${delivery.userId}:deliveries`, delivery);
  
  // Update cache
  await updateDeliveryCache(delivery);
  
  return NextResponse.json({ received: true });
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)

**Objective**: Core infrastructure and authentication framework

| Task | Duration | Deliverable |
|------|----------|-------------|
| Project scaffolding | 2 days | Next.js 15 + TypeScript setup |
| Database schema | 2 days | PostgreSQL + Drizzle ORM |
| Authentication system | 3 days | NextAuth.js + session management |
| UI component library | 3 days | shadcn/ui customization |
| Basic responsive layout | 2 days | Grid system + breakpoints |
| Theme implementation | 1 day | Light/dark/system toggle |

### Phase 2: Platform Adapters (Weeks 4-7)

**Objective**: Build adapters for all target platforms

| Task | Duration | Notes |
|------|----------|-------|
| Base adapter interface | 2 days | Abstract class + types |
| Uber Eats adapter | 3 days | Consumer API integration |
| DoorDash adapter | 3 days | Drive API + webhooks |
| Amazon adapter | 3 days | Shipping API v2 |
| Instacart adapter | 4 days | Developer Platform API |
| Session-based adapters | 5 days | Walmart, Shipt, Drizly, Total Wine, Sam's Club |
| Costco adapter | 1 day | Instacart proxy |

### Phase 3: Real-Time Features (Weeks 8-9)

**Objective**: Live location tracking and updates

| Task | Duration | Deliverable |
|------|----------|-------------|
| WebSocket infrastructure | 2 days | Ably integration |
| Redis pub/sub | 2 days | Real-time event distribution |
| MapLibre integration | 3 days | Map rendering + markers |
| Location interpolation | 2 days | Smooth marker animation |
| ETA calculations | 1 day | Live countdown |

### Phase 4: Polish & Testing (Weeks 10-11)

**Objective**: Production readiness

| Task | Duration | Deliverable |
|------|----------|-------------|
| E2E testing | 3 days | Playwright test suite |
| Performance optimization | 2 days | Bundle size, lazy loading |
| Accessibility audit | 2 days | WCAG 2.1 AA compliance |
| Error handling | 2 days | Graceful degradation |
| Documentation | 1 day | API docs + README |

### Phase 5: Beta Launch (Week 12)

**Objective**: Limited user testing

| Task | Duration | Deliverable |
|------|----------|-------------|
| Deployment pipeline | 1 day | Vercel + GitHub Actions |
| Monitoring setup | 1 day | Sentry + Posthog |
| Beta user onboarding | 3 days | Feedback collection |

---

## 11. Risk Analysis & Mitigations

### 11.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Platform API changes** | High | High | Version pinning, adapter abstraction, monitoring |
| **Rate limiting** | Medium | Medium | Caching, request batching, user-level quotas |
| **Session expiration** | High | Medium | Proactive refresh, clear re-auth prompts |
| **Real-time reliability** | Medium | High | Fallback polling, offline indicators |
| **Map tile costs** | Low | Medium | OpenFreeMap tiles, caching, usage caps |

### 11.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Platform blocks integration** | Medium | Critical | Multiple integration methods, legal review |
| **Terms of Service violations** | Medium | Critical | Legal review, user consent, data minimization |
| **User adoption** | Medium | High | Intuitive UX, clear value proposition |
| **Competitor emergence** | Low | Medium | Feature differentiation, rapid iteration |

### 11.3 Security Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Credential theft** | Low | Critical | Encryption, secure storage, short-lived tokens |
| **Account takeover** | Low | Critical | 2FA, session monitoring, anomaly detection |
| **Data breach** | Low | Critical | Encryption at rest, minimal retention, SOC 2 |

---

## 12. Legal Considerations

### 12.1 Terms of Service Compliance

Each platform has specific terms regarding third-party integrations. Key considerations:

| Platform | ToS Considerations |
|----------|-------------------|
| **Instacart** | Developer Platform API permitted for approved partners |
| **DoorDash** | Drive API requires merchant partnership |
| **Uber Eats** | Consumer API in early access, case-by-case approval |
| **Amazon** | Buy with Prime API requires approval |
| **Walmart** | Marketplace API for approved sellers/providers |

### 12.2 Recommended Approach

1. **Partner API Path**: Apply for official partner/developer status with each platform
2. **User Consent**: Explicit consent for credential storage and data access
3. **Data Minimization**: Only fetch and store data necessary for functionality
4. **Transparent Operation**: Clear privacy policy explaining data handling
5. **Legal Review**: Engage counsel for ToS analysis before launch

### 12.3 Privacy Compliance

| Regulation | Requirements |
|------------|--------------|
| **GDPR** | Consent, data portability, right to deletion |
| **CCPA** | Disclosure, opt-out rights, data access |
| **SOC 2** | Security controls, auditing (future goal) |

---

## Appendix A: Platform Adapter Interface

```typescript
// lib/adapters/base.ts
export abstract class PlatformAdapter {
  abstract readonly platformId: Platform;
  abstract readonly displayName: string;
  abstract readonly iconUrl: string;
  abstract readonly primaryColor: string;
  
  // Authentication
  abstract supportsOAuth(): boolean;
  abstract getOAuthUrl(userId: string): Promise<string>;
  abstract exchangeCode(code: string): Promise<TokenSet>;
  abstract refreshToken(refreshToken: string): Promise<TokenSet>;
  
  // Delivery data
  abstract getActiveDeliveries(
    connection: PlatformConnection
  ): Promise<UnifiedDelivery[]>;
  
  abstract getDeliveryDetails(
    connection: PlatformConnection,
    deliveryId: string
  ): Promise<UnifiedDelivery>;
  
  // Webhooks (if supported)
  supportsWebhooks(): boolean { return false; }
  verifyWebhook(payload: unknown, signature: string | null): boolean { 
    return false; 
  }
  normalizeWebhookPayload(payload: unknown): UnifiedDelivery { 
    throw new Error('Not implemented'); 
  }
  
  // Polling (fallback)
  getPollingInterval(): number { return 30_000; } // 30 seconds default
}
```

---

## Appendix B: Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."

# Authentication
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Token Encryption
TOKEN_ENCRYPTION_KEY="..." # 32-byte hex

# Map Tiles
MAPTILER_API_KEY="..."

# Real-time
ABLY_API_KEY="..."

# Platform Credentials (per-platform OAuth)
INSTACART_CLIENT_ID="..."
INSTACART_CLIENT_SECRET="..."

DOORDASH_CLIENT_ID="..."
DOORDASH_CLIENT_SECRET="..."

UBER_CLIENT_ID="..."
UBER_CLIENT_SECRET="..."

# ... additional platforms
```

---

## Appendix C: References & Resources

### Official Documentation
- [Instacart Developer Platform](https://docs.instacart.com/developer_platform_api/)
- [DoorDash Developer Services](https://developer.doordash.com/)
- [Uber Developer](https://developer.uber.com/docs/deliveries)
- [Amazon Shipping API](https://developer-docs.amazon.com/amazon-shipping/)
- [Walmart Developer Portal](https://developer.walmart.com/)

### Technology Documentation
- [Next.js 15](https://nextjs.org/docs)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Drizzle ORM](https://orm.drizzle.team/)
- [NextAuth.js v5](https://authjs.dev/)

---

*Document prepared for DropDeck project planning. Last updated: January 2026.*
