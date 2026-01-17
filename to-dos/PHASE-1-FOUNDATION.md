# Phase 1: Foundation

**Duration:** 3 weeks (Weeks 1-3)
**Objective:** Establish core infrastructure, authentication, and UI foundation

---

## Phase Overview

```mermaid
gantt
    title Phase 1: Foundation
    dateFormat  YYYY-MM-DD
    section Sprint 1.1
    Project scaffolding     :s1a, 2026-02-01, 2d
    TypeScript configuration :s1b, after s1a, 1d
    Biome setup             :s1c, after s1b, 1d
    Environment setup       :s1d, after s1c, 1d
    section Sprint 1.2
    Database setup          :s2a, 2026-02-06, 2d
    Drizzle schema          :s2b, after s2a, 2d
    Migrations              :s2c, after s2b, 1d
    section Sprint 1.3
    NextAuth configuration  :s3a, 2026-02-11, 2d
    OAuth providers         :s3b, after s3a, 2d
    Session management      :s3c, after s3b, 1d
    section Sprint 1.4
    UI library setup        :s4a, 2026-02-16, 2d
    Component system        :s4b, after s4a, 2d
    Theme implementation    :s4c, after s4b, 1d
```

---

## Sprint 1.1: Project Setup

**Duration:** 5 days
**Complexity:** Medium
**Dependencies:** None

### Objectives
- Initialize Next.js 15 project with App Router
- Configure TypeScript with strict settings
- Set up Bun runtime and package management
- Configure Biome for linting and formatting
- Establish project structure

### Tasks

#### Project Initialization
- [ ] Create new Next.js 15 project with Bun
  ```bash
  bunx create-next-app@latest dropdeck --typescript --tailwind --app --src-dir
  ```
- [ ] Verify Bun is set as default runtime
- [ ] Create initial directory structure per architecture spec
- [ ] Add `.nvmrc` with Node.js version fallback
- [ ] Create `README.md` with setup instructions

#### TypeScript Configuration
- [ ] Configure `tsconfig.json` with strict mode
- [ ] Set up path aliases (`@/*` for `./src/*`)
- [ ] Enable strict null checks
- [ ] Configure module resolution for Bun

#### Biome Setup
- [ ] Install Biome: `bun add -D @biomejs/biome`
- [ ] Create `biome.json` configuration
- [ ] Configure import sorting
- [ ] Set up pre-commit hooks with Husky
- [ ] Add lint and format scripts to `package.json`

#### Environment Configuration
- [ ] Create `.env.example` with all required variables
- [ ] Create `.env.local` for development
- [ ] Implement environment validation with Zod
- [ ] Add environment loading to `next.config.ts`

#### Git Setup
- [ ] Initialize git repository (if not already)
- [ ] Create `.gitignore` for Next.js/Bun
- [ ] Set up branch protection rules
- [ ] Create PR template
- [ ] Configure Husky pre-commit hooks

### Acceptance Criteria
- [ ] Project builds successfully with `bun run build`
- [ ] Dev server starts with `bun run dev`
- [ ] TypeScript compilation passes with no errors
- [ ] Biome lint passes with no errors
- [ ] Environment variables load correctly
- [ ] Directory structure matches architecture spec

### Technical Notes
- Use `bunx` for one-off commands instead of `npx`
- Ensure `turbopack` is enabled for dev server
- Test that hot reload works correctly

---

## Sprint 1.2: Database Setup

**Duration:** 5 days
**Complexity:** Medium
**Dependencies:** Sprint 1.1

### Objectives
- Set up Neon PostgreSQL database
- Configure Drizzle ORM
- Create initial database schema
- Implement migrations workflow

### Tasks

#### Neon Database Setup
- [ ] Create Neon project and database
- [ ] Generate connection strings (pooled and direct)
- [ ] Add connection strings to environment variables
- [ ] Test database connectivity
- [ ] Configure connection pooling settings

#### Drizzle ORM Setup
- [ ] Install Drizzle dependencies:
  ```bash
  bun add drizzle-orm @neondatabase/serverless
  bun add -D drizzle-kit
  ```
- [ ] Create `drizzle.config.ts`
- [ ] Create database client (`lib/db/client.ts`)
- [ ] Test connection with simple query

#### Schema Definition
- [ ] Create `lib/db/schema.ts` with all tables:
  - [ ] `users` table
  - [ ] `accounts` table (NextAuth)
  - [ ] `sessions` table (NextAuth)
  - [ ] `verification_tokens` table (NextAuth)
  - [ ] `platform_connections` table
  - [ ] `user_preferences` table
  - [ ] `delivery_cache` table
  - [ ] `delivery_history` table
- [ ] Define all enums (platform, status, theme, etc.)
- [ ] Set up table relations
- [ ] Add indexes for common queries

#### Migrations
- [ ] Generate initial migration: `bun run db:generate`
- [ ] Review generated SQL
- [ ] Apply migration: `bun run db:push`
- [ ] Verify tables created correctly
- [ ] Create seed script for development data

### Acceptance Criteria
- [ ] Database connection works in dev and production mode
- [ ] All tables created with correct schema
- [ ] Indexes exist for foreign keys and common queries
- [ ] Drizzle Studio accessible: `bun run db:studio`
- [ ] Seed data loads successfully

### Technical Notes
```typescript
// Connection configuration for serverless
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

---

## Sprint 1.3: Authentication

**Duration:** 5 days
**Complexity:** High
**Dependencies:** Sprint 1.2

### Objectives
- Configure NextAuth.js v5
- Implement Google and GitHub OAuth
- Set up session management
- Create login/logout UI

### Tasks

#### NextAuth Configuration
- [ ] Install NextAuth: `bun add next-auth@beta @auth/drizzle-adapter`
- [ ] Create `auth.ts` configuration file
- [ ] Configure Drizzle adapter
- [ ] Set up JWT strategy with 30-day sessions
- [ ] Configure secure cookie settings

#### OAuth Providers
- [ ] Set up Google OAuth:
  - [ ] Create Google Cloud Console project
  - [ ] Configure OAuth consent screen
  - [ ] Generate client ID and secret
  - [ ] Add callback URL
- [ ] Set up GitHub OAuth:
  - [ ] Create GitHub OAuth App
  - [ ] Generate client ID and secret
  - [ ] Add callback URL
- [ ] Add providers to NextAuth config

#### Session Management
- [ ] Implement session callbacks (jwt, session)
- [ ] Add user ID to session
- [ ] Create `getSession` helper function
- [ ] Implement session refresh logic
- [ ] Add session invalidation endpoint

#### Auth UI Components
- [ ] Create login page (`app/(auth)/login/page.tsx`)
- [ ] Create OAuth button components
- [ ] Add loading states
- [ ] Create error page (`app/(auth)/error/page.tsx`)
- [ ] Implement redirect after login

#### Auth Middleware
- [ ] Create middleware for route protection
- [ ] Configure public routes (login, callback)
- [ ] Configure protected routes (dashboard, settings)
- [ ] Add redirect logic for unauthenticated users

### Acceptance Criteria
- [ ] Users can sign in with Google
- [ ] Users can sign in with GitHub
- [ ] Session persists across page reloads
- [ ] Protected routes redirect to login
- [ ] Logout clears session completely
- [ ] Session refreshes automatically

### Technical Notes
```typescript
// Middleware configuration
export { auth as middleware } from '@/lib/auth/config';

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Sprint 1.4: UI Foundation

**Duration:** 5 days
**Complexity:** Medium
**Dependencies:** Sprint 1.1

### Objectives
- Set up Tailwind CSS 4.x
- Install and configure shadcn/ui
- Create base component library
- Implement theme system (light/dark/system)

### Tasks

#### Tailwind Configuration
- [ ] Verify Tailwind 4.x is installed
- [ ] Create custom color palette in CSS variables
- [ ] Add platform brand colors
- [ ] Configure responsive breakpoints
- [ ] Set up typography plugin

#### shadcn/ui Setup
- [ ] Initialize shadcn/ui: `bunx shadcn@latest init`
- [ ] Configure component location (`src/components/ui`)
- [ ] Install base components:
  - [ ] `button`
  - [ ] `card`
  - [ ] `dialog`
  - [ ] `dropdown-menu`
  - [ ] `input`
  - [ ] `select`
  - [ ] `skeleton`
  - [ ] `switch`
  - [ ] `toast`
  - [ ] `tooltip`

#### Layout Components
- [ ] Create root layout (`app/layout.tsx`)
- [ ] Create dashboard layout (`app/(dashboard)/layout.tsx`)
- [ ] Create `Header` component
- [ ] Create `Sidebar` component (collapsible)
- [ ] Create `MobileNav` component
- [ ] Implement responsive navigation

#### Theme System
- [ ] Install next-themes: `bun add next-themes`
- [ ] Create `ThemeProvider` component
- [ ] Implement theme toggle (light/dark/system)
- [ ] Persist theme preference to localStorage
- [ ] Add CSS transitions for theme changes

#### Provider Setup
- [ ] Create `Providers` wrapper component
- [ ] Add TanStack Query provider
- [ ] Add theme provider
- [ ] Add toast provider
- [ ] Add tRPC provider (placeholder)

### Acceptance Criteria
- [ ] All shadcn/ui components render correctly
- [ ] Theme toggles between light/dark/system
- [ ] Theme persists across page reloads
- [ ] Layout is responsive at all breakpoints
- [ ] Sidebar collapses on mobile
- [ ] Toast notifications work

### Technical Notes
```typescript
// Theme provider setup
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange={false}
>
  {children}
</ThemeProvider>
```

---

## Phase 1 Completion Checklist

### Technical Verification
- [ ] `bun run build` completes without errors
- [ ] `bun run dev` starts successfully
- [ ] `bun run lint` passes
- [ ] `bun run test` (unit tests if any) passes
- [ ] Database migrations applied successfully
- [ ] Authentication flow works end-to-end
- [ ] Theme switching works correctly

### Documentation
- [ ] README.md updated with setup instructions
- [ ] Environment variables documented
- [ ] API documentation started

### Code Quality
- [ ] No TypeScript errors
- [ ] No Biome warnings
- [ ] Consistent code formatting
- [ ] Proper error handling in place

---

## Dependencies for Phase 2

Phase 1 completion enables:
- **Sprint 2.1**: tRPC setup requires auth context
- **Sprint 2.2**: Platform adapters require database schema
- **Sprint 2.3**: Real-time infrastructure requires session management
- **Sprint 2.4**: MapLibre requires UI foundation

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Neon connection issues | Low | High | Test pooling settings, have fallback |
| NextAuth v5 breaking changes | Medium | Medium | Pin to specific version |
| Tailwind 4.x compatibility | Low | Low | Fallback to 3.x if needed |
| OAuth setup complexity | Medium | Medium | Allow extra time, document process |

---

*Phase 1 Est. Completion: Week 3 | Total Tasks: 68*
