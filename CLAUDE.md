# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stallplass is a Norwegian platform for horse stable management and discovery, connecting stable owners with horse riders. The codebase is fully in English with Norwegian UI localization.

**Core Features:**
- Stable listings and search with map integration
- Real-time messaging between stable owners and riders
- Individual box/stall management
- Vipps payment processing for advertisements
- Two-way review system
- Admin dashboard for stable management

## Technology Stack

**Framework:** Next.js 15 with App Router, React 19, TypeScript
**Database:** Supabase (PostgreSQL) with real-time subscriptions
**Styling:** Tailwind CSS 4
**State Management:** TanStack Query + Zustand
**Testing:** Jest, React Testing Library, Playwright
**Payments:** Vipps API (Norwegian mobile payments)
**Maps:** Leaflet for location features

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run lint             # ESLint checking
npx tsc --noEmit         # TypeScript error checking (run before builds)

# Database (Supabase)
npm run db:start         # Start local Supabase stack
npm run db:stop          # Stop local Supabase
npm run db:reset         # Reset DB and apply all migrations
npm run db:up            # Apply only new migrations (preserves data)
npm run db:migrate       # Create new migration
npm run db:types         # Generate TypeScript types from schema
npm run db:studio        # Access Supabase Studio at http://localhost:54323

# Testing
npm run test             # Unit tests with Jest
npm run test:watch       # Jest in watch mode
npm run test:e2e         # Playwright E2E tests
npm run test:all         # Run all tests
```

## Architecture Overview

**Component Organization (Atomic Design):**
- `src/components/atoms/`: Basic building blocks (Button, ResponsiveImage)
- `src/components/molecules/`: Simple combinations (StableCard, MessageThread, SearchBar)
- `src/components/organisms/`: Complex components (AdminDashboard, StableGrid, MessagingClient)

**Data Layer:**
- `src/services/`: Business logic for each domain (stable-service, chat-service, payment-service)
- `src/hooks/`: Custom React hooks including real-time subscriptions
- `src/types/`: TypeScript definitions with Supabase-generated types as foundation

**Real-time Features:**
- Custom connection management in `src/lib/realtime/`
- Real-time hooks for chat, stable updates, and rental tracking
- Optimistic UI updates for smooth user experience

## Database Schema (English)

**Core Tables:**
- `stables`: Horse stable listings
- `boxes`: Individual stall/box listings within stables  
- `users`: User accounts
- `conversations`/`messages`: Real-time chat system
- `rentals`: Rental agreements between owners and riders
- `reviews`: Two-way rating system
- `payments`: Vipps payment processing records
- `stable_amenities`/`box_amenities`: Facility features

**Critical Migration Workflow:**
1. `npm run db:migrate "feature_name"` - Create migration file
2. Edit SQL file in `supabase/migrations/`
3. `npm run db:up` - Apply to local (preserves data) OR `npm run db:reset` (fresh start)
4. **ALWAYS** run `npm run db:types` after schema changes
5. Test locally, commit both migration and updated types
6. Production: `supabase db push` then deploy app

## Type System Rules

**Primary Source:** Supabase-generated types in `src/types/supabase.ts`
**Extended Types:** Create custom types by extending Supabase types for API responses with relations
**Naming Convention:** Database uses snake_case, TypeScript uses camelCase for computed properties

```typescript
// ✅ Correct - Use Supabase types as foundation
import { Tables } from '@/types/supabase';
type User = Tables<'users'>;

// ✅ Extend when needed for relations/computed properties
type StableWithBoxes = Stable & {
  boxes: Box[];
  totalBoxes: number; // computed
};

// ❌ Avoid - Don't duplicate Supabase table structure
interface MyStable { id: string; name: string; } // Wrong
```

## Norwegian Route Structure

**App Router uses Norwegian paths:**
- `/staller` - Browse all stables
- `/staller/[id]` - Individual stable page
- `/bokser/[id]` - Individual box page
- `/dashboard` - Stable owner management
- `/meldinger` - Messaging interface
- `/leieforhold` - Rental agreements

## Real-time System

**Connection Management:** Centralized in `src/lib/realtime/connection-manager.ts`
**Real-time Hooks:** `useRealTimeChat`, `useRealTimeStables`, `useRealTimeRentals`
**Subscription Cleanup:** Automatic cleanup on component unmount and route changes

## Critical Development Rules

1. **Always commit code after completing tasks**
2. **Run `npx tsc --noEmit` before builds to catch all TypeScript errors**
3. **Generate types after ANY schema change: `npm run db:types`**
4. **Use English terminology throughout codebase (database already migrated)**
5. **Test both unit and E2E before commits**
6. **Database migrations are separate from app deployment**
- **Always write tests for new functionality unless told not to. Create tests for happy paths and edge cases.**
- **Always run a build before creating a PR to ensure that the app builds. If it does not fix the errors.**

## Environment Requirements

**Required for local development:**
- Node.js 22.x
- Docker (for Supabase)
- Supabase CLI

**Environment Variables:**
- Supabase: URL, anon key, service role key
- Vipps: Client ID, secret, subscription key
- Firebase: API key, auth domain, project ID (legacy)

## Testing Strategy

**Unit Tests:** Components and utilities with Jest + React Testing Library
**E2E Tests:** User flows with Playwright across multiple browsers
**API Testing:** Mock APIs with MSW for isolated component testing

## Git Workflow Best Practices

- Always use the gh cli tool to create a new branch when working on stuff. After you are done create a pull request.
```