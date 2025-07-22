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


## Critical Development Rules

1. **ALWAYS commit code after completing tasks - this is mandatory**
2. **Run `npx tsc --noEmit` before builds to catch all TypeScript errors**
3. **Generate types after ANY schema change: `npm run db:types`**
4. **Use English terminology throughout codebase (database already migrated)**
5. **Database migrations are separate from app deployment**
6. **After making any code changes, you MUST create a git commit with proper message**

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


```