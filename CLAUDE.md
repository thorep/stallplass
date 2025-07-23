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
- Admin interface for stable management

## Technology Stack

**Framework:** Next.js 15 with App Router, React 19, TypeScript
**Database:** Supabase (PostgreSQL) with real-time subscriptions
**Styling:** Tailwind CSS 4
**State Management:** TanStack Query + Zustand
**Payments:** Vipps API (Norwegian mobile payments)
**Maps:** Leaflet for location features

## MCP Browser Integration

**When to use MCP browser tools:**
- Debug UI issues and understand component behavior
- Test complex user interactions (forms, navigation, authentication)
- Investigate E2E test failures by reproducing user flows
- Understand actual DOM structure when selectors fail
- Verify application state during development

**MCP browser commands available:**
- `mcp__browser__browser_navigate` - Navigate to URLs
- `mcp__browser__browser_click` - Click elements 
- `mcp__browser__browser_type` - Fill form fields
- `mcp__browser__browser_snapshot` - Get page structure
- `mcp__browser__browser_screenshot` - Take screenshots

**Best practices:**
- Use MCP browser when traditional debugging methods are insufficient
- Always take snapshots to understand page structure before interacting
- Use browser tools to validate E2E test assumptions about UI elements

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run lint             # ESLint checking
npx tsc --noEmit         # TypeScript error checking (run before builds)

# Testing
npm run test:e2e         # Run E2E tests (headless, line reporter)
npm run test:e2e:ui      # Run E2E tests with HTML report
npm run test:e2e:debug   # Debug E2E tests with Playwright inspector

# Database (Supabase)
npm run db:start         # Start local Supabase stack
npm run db:stop          # Stop local Supabase
npm run db:reset         # Reset DB and apply all migrations
npm run db:up            # Apply only new migrations (preserves data)
npm run db:migrate       # Create new migration
npm run db:types         # Generate TypeScript types from schema
npm run db:studio        # Access Supabase Studio at http://localhost:54323

```

## Architecture Overview

**Component Organization (Atomic Design):**
- `src/components/atoms/`: Basic building blocks (Button, ResponsiveImage)
- `src/components/molecules/`: Simple combinations (StableCard, MessageThread, SearchBar)
- `src/components/organisms/`: Complex components (StallClient, StableGrid, MessagingClient)

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

**🚨 CRITICAL DATABASE MIGRATION RULES 🚨**

**GOLDEN RULE: NEVER BREAK THE DATABASE**
- Migrations must ALWAYS be additive and backwards-compatible
- NEVER create migrations that require dropping/recreating tables with existing data
- NEVER reset the database except in extreme emergencies with explicit user approval

**Migration Workflow (MANDATORY PROCESS):**
1. **Create migration:** `supabase migration new "descriptive_name"`
2. **Write SAFE SQL:** Only CREATE, ALTER ADD COLUMN, or CREATE INDEX operations
3. **Test migration:** `npm run db:up` (NEVER use db:reset)
4. **Generate types:** `npm run db:types` after schema changes
5. **Test application:** Ensure all code works with new schema
6. **Commit together:** Migration file + updated types in same commit
7. **Production deploy:** `supabase db push` then deploy application

**FORBIDDEN OPERATIONS:**
- ❌ `npm run db:reset` or `supabase db reset` (destroys all data)
- ❌ `DROP TABLE` statements in migrations
- ❌ `DROP COLUMN` without user permission
- ❌ Changing column types that could lose data
- ❌ Removing NOT NULL constraints without migration path

**SAFE MIGRATION PATTERNS:**
- ✅ `CREATE TABLE` for new tables
- ✅ `ALTER TABLE ADD COLUMN` for new columns
- ✅ `CREATE INDEX` for performance
- ✅ `CREATE TYPE` for new enums
- ✅ `ALTER TYPE ADD VALUE` for extending enums
- ✅ `CREATE FUNCTION` for new functions
- ✅ Adding RLS policies

**IF A MIGRATION FAILS:**
1. **DON'T RESET THE DATABASE**
2. Fix the migration SQL file directly
3. Run `npm run db:up` again
4. If still broken, create a NEW migration to fix the issue
5. Only as LAST RESORT: ask user permission to reset

**DATA PRESERVATION RULE:**
Every migration must preserve existing data. If you need to transform data:
1. Create new columns/tables alongside old ones
2. Migrate data with UPDATE statements
3. Only drop old structures after data is safely migrated

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
- `/stall` - Stable owner management
- `/meldinger` - Messaging interface
- `/leieforhold` - Rental agreements

## Real-time System

**Connection Management:** Centralized in `src/lib/realtime/connection-manager.ts`
**Real-time Hooks:** `useRealTimeChat`, `useRealTimeStables`, `useRealTimeRentals`
**Subscription Cleanup:** Automatic cleanup on component unmount and route changes


## Testing Guidelines

### E2E Testing with Playwright

**Test Structure:**
- Tests are organized in `e2e/tests/` directory
- Authentication handled via saved state (no repeated logins)
- Two test users: `user1@test.com` and `user2@test.com` (password: `test123`)

**Test Organization:**
- `*.spec.ts` - Public/login tests (no auth required)
- `*.user1.spec.ts` - Tests requiring user1 authentication
- `*.user2.spec.ts` - Tests requiring user2 authentication
- `auth.setup.ts` - Creates authentication state files

**Running Tests:**
```bash
npm run test:e2e              # Run all tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:debug        # Debug mode
npm run test:e2e -- --project=chromium-user1  # Run only user1 tests
```

**🚨 CRITICAL TESTING RULES 🚨**

1. **DESCRIPTIVE TEST NAMES ARE MANDATORY**
   - ❌ Bad: `"shows dashboard after login"`
   - ✅ Good: `"logged in user can access dashboard with stable management"`
   - Test names must clearly explain the user scenario and expected behavior

2. **NEVER MODIFY TESTS TO FIX FAILING CODE**
   - If tests fail after code changes, **fix the code, not the tests**
   - Tests represent expected user behavior and business requirements
   - **ALWAYS ask before changing any test** - failing tests indicate broken functionality

3. **TEST USER REQUIREMENTS**
   - Two users enable testing of interactive features (messaging, rentals, reviews)
   - user1@test.com and user2@test.com must exist in local Supabase
   - Both users have identical capabilities (can create stables, rent boxes, etc.)

4. **TEST CATEGORIES TO MAINTAIN**
   - Authentication flows (login/logout)
   - Public navigation (anonymous users)
   - Protected routes (authenticated users)
   - User interactions (messaging between users)
   - Core business flows (stable creation, rentals)

**Test Development Workflow:**
1. Write tests BEFORE implementing features when possible
2. Use descriptive test and describe block names
3. Test both happy path and error scenarios
4. Ensure tests are independent and can run in any order
5. Mock external services (Vipps payments) when needed

## Critical Development Rules

1. **ALWAYS commit code after completing tasks - this is mandatory**
2. **ALWAYS run all tests before committing code: `npm run test:e2e`**
3. **Run `npx tsc --noEmit` before builds to catch all TypeScript errors**
4. **Generate types after ANY schema change: `npm run db:types`**
5. **Use English terminology throughout codebase (database already migrated)**
6. **Database migrations are separate from app deployment**
7. **After making any code changes, you MUST create a git commit with proper message**
8. **NEVER modify tests without explicit permission - fix code to match tests**
9. **Use MCP browser tools to debug and understand the application when needed**

## Environment Requirements

**Required for local development:**
- Node.js 22.x
- Docker (for Supabase)
- Supabase CLI

**Environment Variables:**
- Supabase: URL, anon key, service role key
- Vipps: Client ID, secret, subscription key
- Firebase: API key, auth domain, project ID (legacy)

## Service Type System

The marketplace uses a centralized service type system for consistency and maintainability.

### Architecture
- **Database**: PostgreSQL ENUM `service_type` defines available service types
- **Frontend**: Centralized configuration in `src/lib/service-types.ts` for labels and colors
- **Type Safety**: TypeScript ensures frontend config matches database enum

### Current Service Types
- `veterinarian` → "Veterinær" (blue)
- `farrier` → "Hovslagere" (orange) 
- `trainer` → "Trenere" (green)
- `chiropractor` → "Kiropraktor" (purple)
- `saddlefitter` → "Saltilpasser" (yellow)
- `equestrian_shop` → "Hestebutikk" (red)

### Adding New Service Types

1. **Create migration:**
   ```bash
   npx supabase migration new "add_new_service_type"
   ```

2. **Add to database enum:**
   ```sql
   ALTER TYPE service_type ADD VALUE 'new_service_type';
   ```

3. **Update frontend config** in `src/lib/service-types.ts`:
   ```typescript
   export const serviceTypeConfig = {
     // ... existing types
     new_service_type: {
       label: 'Norwegian Label',
       color: 'bg-color-100 text-color-800'
     }
   };
   ```

4. **Apply migration and regenerate types:**
   ```bash
   npm run db:up
   npm run db:types
   ```

### Production Database Setup

If production database lacks the `service_type` enum, run this SQL:

```sql
-- Create complete service_type enum
CREATE TYPE service_type AS ENUM (
  'veterinarian',
  'farrier', 
  'trainer',
  'chiropractor',
  'saddlefitter',
  'equestrian_shop'
);
```

### Troubleshooting

- **TypeScript errors**: Run `npm run db:types` after database changes
- **Missing service types**: Check database enum with `SELECT unnest(enum_range(NULL::service_type));`
- **UI not updating**: Verify `src/lib/service-types.ts` includes all database enum values

## Critical Supabase Client/Server Architecture Rules

**🚨 NEVER MIX CLIENT AND SERVER SUPABASE CLIENTS 🚨**

### Golden Rules:
1. **Client-side code** (components, hooks, pages) can ONLY use `supabase` (regular client)
2. **Server-side code** (API routes, server actions) can use `supabaseServer` (service role)
3. **NEVER import supabaseServer in client-side code** - it will cause environment variable errors
4. **Service files** must be separated:
   - `*-service-client.ts` - for client-side operations (uses `supabase`)
   - `*-service.ts` - for server-side operations (uses `supabaseServer`)

### File Usage Patterns:
- **Client-side files** (`src/hooks/*`, `src/components/*`, pages with `'use client'`):
  - Import from `@/lib/supabase` (regular client)
  - Import from `*-service-client.ts` files
  - Respect Row Level Security (RLS)
  
- **Server-side files** (API routes, server components):
  - Import from `@/lib/supabase-server` (service role client)
  - Import from `*-service.ts` files
  - Can bypass RLS for admin operations

### When You Need Server Operations:
- Create API routes in `src/app/api/`
- Use server-side service functions in API routes
- Call API routes from client-side code via fetch/mutations

### Example Structure:
```
src/services/
├── stable-service.ts          # Server-side (uses supabaseServer)
├── stable-service-client.ts   # Client-side (uses supabase)
├── user-service.ts           # Server-side (uses supabaseServer)
└── user-service-client.ts    # Client-side (uses supabase)
```

**VIOLATION OF THESE RULES WILL CAUSE "Missing Supabase environment variables" ERRORS**

## Development Memories

- Always read the database schema to understand relationships between data models
- Development server is typically running on port 3000 (assume it's available unless told otherwise)
- Separate client-side and server-side Supabase operations to avoid environment variable conflicts