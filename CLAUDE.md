This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 project called "stallplass" that uses React 19, TypeScript, and Tailwind CSS 4. The project was bootstrapped with `create-next-app` and follows the App Router pattern.

## Development Commands

- `npm run dev`: Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check for code issues
- `npx tsc --noEmit`: Check all TypeScript errors without compilation (recommended before builds)

## Testing Commands

- `npm run test`: Run unit tests with Jest
- `npm run test:watch`: Run unit tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:e2e`: Run end-to-end tests with Playwright
- `npm run test:e2e:debug`: Run E2E tests in debug mode
- `npm run test:e2e:ui`: Run E2E tests with UI mode
- `npm run test:all`: Run all tests (unit + e2e)

## Project Structure

- `src/app/`: Next.js App Router directory containing pages and layouts
  - `layout.tsx`: Root layout with Geist font configuration
  - `page.tsx`: Home page component
  - `globals.css`: Global styles including Tailwind CSS
- `src/components/`: React components organized by atomic design
  - `atoms/`: Basic building blocks
  - `molecules/`: Simple component combinations
  - `organisms/`: Complex component combinations
- `src/hooks/`: Custom React hooks
- `src/services/`: Business logic and API integration
- `src/lib/`: Utility libraries and configurations
- `src/__tests__/`: Unit and integration tests
- `tests/e2e/`: End-to-end tests with Playwright
- `public/`: Static assets
- TypeScript configuration uses path aliases (`@/*` maps to `./src/*`)

## Key Technologies

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React version
- **TypeScript**: Strict mode enabled
- **Tailwind CSS 4**: Utility-first CSS framework with PostCSS
- **Turbopack**: Used for faster development builds
- **Geist Font**: Custom font family from Vercel
- **TanStack Query**: Client-side data fetching and caching
- **Supabase**: Database (PostgreSQL) with real-time subscriptions and built-in authentication
- **Firebase**: Authentication service (legacy, being phased out in favor of Supabase Auth)
- **Heroicons**: React icon library
- **Zustand**: Lightweight state management (only when needed)

## Testing Technologies

- **Jest**: Unit testing framework with jsdom environment
- **React Testing Library**: Component testing utilities
- **Playwright**: End-to-end testing framework
- **MSW**: API mocking for tests

## Product Concept

Stallplass is a Norwegian platform for horse stable management and discovery:
- **Stable owners** can create profiles with detailed listings of available spaces
- **Individual stable landing pages** with detailed information about each stable
- **Box management** - owners can list individual available boxes/spaces
- **Regular users** can browse stables in list format (similar to Finn.no)
- **Two-way rating system** between stables and horse owners
- **Authentication system** with username/password for stable owners
- **Dashboard** for stable owners to manage their listings
- **Public listing page** for browsing all available stables
- Fully localized in Norwegian
- Target audience: Horse owners and stable managers in Norway

## Development Workflow Memories

- **Always check how things are solved previously in the project so you don't make mistakes that could be avoided.**
- **CRITICAL: ALWAYS COMMIT YOUR CODE after completing any task or making any changes.**
- **NEVER finish a task without committing the changes to git.**
- **Commit early and commit often - after every feature, fix, or significant change.**
- **Use descriptive commit messages that explain what was changed and why.**
- **IMPORTANT: Run `npx tsc --noEmit` before `npm run build` to catch ALL TypeScript errors at once instead of fixing them one by one during compilation.**

## Testing Requirements

- **Write tests for all new features** unless explicitly yold not to
- **Run tests before comitting** to ensure code quality and functionality
- use : `npm run test` and `npm run test:e2e` to veryify all tests pass befor making commits.
- Tests should cover both happy path and edge cases for new functionality

## Database Management (Supabase)

This project uses **Supabase** for database management.

### Local Development Setup

1. **Start Supabase locally**: `supabase start`
   - API URL: http://127.0.0.1:54321
   - Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
   - Studio URL: http://127.0.0.1:54323

2. **Database migrations**: All schema changes are managed through Supabase migrations in `supabase/migrations/`
   - Create new migration: `supabase migration new <name>`
   - Apply migrations: `supabase db reset` (includes seeding)
   - Generate TypeScript types: `supabase gen types typescript --local > src/types/supabase.ts`

3. **Real-time features of Supabase**:
   - use realtime of asked to have this component or data update on changes, otherwise not. 

### Supabase Services

- **User Service** (`src/services/user-service.ts`): User CRUD operations
- **Chat Service** (`src/services/chat-service.ts`): Real-time messaging with subscriptions
- **Supabase Client** (`src/lib/supabase.ts`): Client-side configuration with TypeScript types
- **Server-side Client** (`src/lib/supabase-server.ts`): Server-side operations with elevated permissions

### Client-side vs Server-side Usage

**Client-side (Browser)**:
- Uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, safe to expose)
- Respects Row Level Security (RLS) policies
- Used in React components, hooks, and client-side logic
- Limited to operations allowed by RLS policies

**Server-side (API Routes)**:
- Uses `SUPABASE_SERVICE_ROLE_KEY` (secret, never expose to client)
- Bypasses Row Level Security policies
- Used in API routes, server actions, and background jobs
- Full database access - use with caution

### When to Use Server-side Client

Use the server-side client for:
- **Admin operations**: User management, data cleanup, analytics
- **Payment processing**: Creating/updating payment records securely
- **System operations**: Automated tasks, batch operations
- **Complex queries**: Operations that need to access multiple user's data
- **Data validation**: Server-side validation before saving to database

### Security Best Practices

- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- **Always** validate user permissions in API routes before using service role
- **Prefer** client-side operations when possible (better for real-time features)
- **Use** server-side for sensitive operations that require elevated permissions

### Environment Variables

**Required for production deployment:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (client & server)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key (client-side)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side operations - **required**)

**Note**: The `SUPABASE_SERVICE_ROLE_KEY` is required for:
- Admin dashboard operations
- Payment processing
- Analytics and reporting
- System maintenance tasks
- Any server-side API routes that need elevated permissions

### Database Commands

**Local Development:**
- `supabase start`: Start local Supabase stack
- `supabase stop`: Stop local Supabase stack
- `supabase migration new <name>`: Create new migration file
- `supabase migration up`: Apply only new migrations to local DB (preserves data)
- `supabase db reset`: Reset local DB and apply ALL migrations (wipes all data)
- `supabase gen types typescript --local`: Generate TypeScript types

**Production Deployment:**
- `supabase link --project-ref <your-ref>`: Link to production project (one-time)
- `supabase db push`: Apply new migrations to production (safe)
- `supabase gen types typescript --project-ref <your-ref>`: Generate types from production

### Migration Workflow

**Local Development:**
1. `supabase migration new "feature_name"` - Create migration
2. Edit the `.sql` file in `supabase/migrations/`
3. `supabase migration up` - Apply only new migrations (preserves test data)
4. `supabase gen types typescript --local > src/types/supabase.ts` - **CRITICAL: Update types**
5. Test changes locally with updated types
6. Commit migration files AND updated types to git

**Note:** Use `supabase migration up` instead of `supabase db reset` to preserve your test data. Only use `supabase db reset` when you need a completely fresh database or when troubleshooting migration issues.

### Local Development Best Practices

**Daily Development Workflow:**
1. `npm run db:start` - Start local Supabase
2. `npm run db:migrate "feature_name"` - Create migration when **needed**
3. `npm run db:up` - Apply new migrations (preserves data)
4. `npm run db:types` - **ALWAYS** update TypeScript types after schema changes
5. Test your changes with existing data
6. Commit both migration files AND updated types

**When to Use Each Command:**
- **`npm run db:up`** (supabase migration up): Normal development - preserves all test data
- **`npm run db:reset`** (supabase db reset): Only when you need a fresh start or have migration conflicts

**Benefits of Using `migration up`:**
- ✅ Keeps all your test users, stables, conversations, etc.
- ✅ Faster development - no need to recreate test scenarios
- ✅ More realistic testing with accumulated data
- ✅ Safer - matches production behavior (incremental updates)

**CRITICAL: Always Generate Types After Schema Changes**
- ❗ **ALWAYS** run `npm run db:types` after any migration
- ❗ **ALWAYS** commit the updated `src/types/supabase.ts` file
- ❗ Without updated types, your TypeScript code will be out of sync with the database
- ❗ Type mismatches cause runtime errors and broken functionality

**Production Deployment:**
1. `supabase link --project-ref your-ref` (one-time setup)
2. `supabase db push` - Safely apply only NEW migrations
3. `supabase gen types typescript --project-ref your-ref > src/types/supabase.ts` - **Update types from production**
4. Commit updated types if different from local
5. Deploy app to Vercel (migrations are separate from app deployment)

**Important:** Always ensure your TypeScript types match your production schema **before** deploying.

### TypeScript Type Usage Guidelines

**CRITICAL: Supabase Types Are The Primary Source of Truth**

Supabase-generated types (`src/types/supabase.ts`) are the foundation of our type system. They represent the actual database schema and must be used as the base for all data types.

**Core Principles:**
- 🎯 **Supabase types are the main types** - Always start with Supabase-generated types

### **CRITICAL: Database Schema is Fully Standardized to English**

**All database tables and fields use English names with snake_case convention.**

**⚠️ IMPORTANT: This codebase has been fully migrated from Norwegian to English terminology.**

**Table Names (All English):**
- `stables` (horse stables)
- `boxes` (stable boxes/stalls - equivalent to "stallplasser")
- `users` (all users)
- `conversations` (chat conversations)
- `messages` (chat messages)
- `rentals` (rental agreements - equivalent to "utleie")
- `reviews` (user reviews - equivalent to "anmeldelser")
- `payments` (payment records)
- `stable_amenities` (stable facilities)
- `box_amenities` (box facilities)

**Field Names (All English snake_case):**
- `start_date` NOT `startDate` or `start_dato`
- `monthly_price` NOT `monthlyPrice` or `månedspris`
- `is_indoor` NOT `isIndoor` or `er_innendørs`
- `has_window` NOT `hasWindow` or `har_vindu`
- `has_electricity` NOT `hasElectricity` or `har_strøm`
- `has_water` NOT `hasWater` or `har_vann`
- `is_available` NOT `isAvailable` or `er_tilgjengelig`
- `is_admin` NOT `isAdmin` or `er_admin`
- `owner_id` NOT `ownerId` or `eier_id`
- `owner_name` NOT `ownerName` or `eier_navn`
- `created_at` NOT `createdAt` or `opprettet_dato`
- `updated_at` NOT `updatedAt` or `oppdatert_dato`
- `stable_id` NOT `stableId` or `stall_id`
- `box_id` NOT `boxId` or `stallplass_id`
- `rider_id` NOT `riderId` or `rytter_id`

**Always check the generated TypeScript types in `src/types/supabase.ts` for the correct field names.**
- 🚀 **Extend when needed** - Create custom types by extending Supabase types for specific use cases
- 🛡️ **Type safety first** - Never bypass TypeScript with unsafe assertions
- 🔄 **Keep types synchronized** - Always run `supabase gen types` after schema changes

### **CRITICAL: English-Only Codebase Policy**

**This codebase has been fully migrated to English terminology. All Norwegian terms have been removed.**

**✅ USE ENGLISH EVERYWHERE:**
- Function names: `getStables()` NOT `hentStaller()`
- Variable names: `stableId` NOT `stallId`
- Interface names: `StableWithBoxes` NOT `StallMedStallplasser`
- Type definitions: `CreateStableData` NOT `OpprettStallData`
- Service functions: `createRental()` NOT `opprettUtleie()`
- Hook names: `useStables()` NOT `useStaller()`
- Component names: `StableList` NOT `StallListe`

**❌ NO NORWEGIAN TERMS:**
- No Norwegian variable names (`staller`, `stallplasser`, `utleier`, `leietaker`)
- No Norwegian function names (`hent`, `opprett`, `oppdater`, `slett`)
- No Norwegian type names (`Stall`, `Stallplass`, `Utleie`, `Anmeldelse`)
- No Norwegian field names in interfaces (use Supabase snake_case)
- No Norwegian comments or documentation (English only)

**🔧 Code Standards:**
1. **Database Access**: Always use English table names (`stables`, `boxes`, `rentals`, `reviews`)
2. **Type Safety**: Use Supabase-generated types as the source of truth
3. **Naming Convention**: 
   - Database fields: `snake_case` (from Supabase)
   - TypeScript: `camelCase` for variables, `PascalCase` for types
   - Components: `PascalCase`
4. **Legacy Support**: Some backward compatibility wrappers may exist but should be phased out

**📝 Migration Notes:**
- Database was migrated via `supabase/migrations/20250121_standardize_to_english.sql`
- All existing Norwegian function names are deprecated
- Types have been regenerated to match English schema
- Real-time subscriptions updated to use English table names
- All service files updated to use English terminology

**Type Usage Hierarchy:**

1. **Primary (Always use first)**: Supabase-generated types
   ```typescript
   import { Database } from '@/types/supabase';
   
   // Direct usage for database operations
   type Stable = Database['public']['Tables']['stables']['Row'];
   type StableInsert = Database['public']['Tables']['stables']['Insert'];
   type StableUpdate = Database['public']['Tables']['stables']['Update'];
   ```

2. **Secondary (When needed)**: Extended types for API responses with relations
   ```typescript
   // When fetching data with joins/relations
   type StableWithBoxes = Stable & {
     boxes: Box[];
     amenities: { amenity: StableAmenity }[];
   };
   ```

3. **Tertiary (Special cases)**: Custom types for UI/business logic
   ```typescript
   // Only for computed properties or UI-specific needs
   type StableWithStats = StableWithBoxes & {
     totalBoxes: number;        // computed
     availableBoxes: number;    // computed
     occupancyRate: number;     // computed
   };
   ```

**❌ NEVER DO THIS:**
```typescript
// Don't create interfaces that duplicate Supabase tables
interface MyStable {
  id: string;
  name: string;
  // ... duplicating what's already in Supabase types
}

// Don't use unsafe type assertions
return data as unknown as CustomType;

// Don't manually write database types
type User = { id: string; email: string; ... }
```

**✅ ALWAYS DO THIS:**
```typescript
// Use Supabase types directly or as a base
import { Tables } from '@/types/supabase';
type User = Tables<'users'>;

// Extend Supabase types when needed
type UserWithStables = User & {
  stables: Stable[];
};

// Handle nullable fields properly
if (stable.images) {
  // TypeScript knows images is not null here
}
```

**When to Create Custom Types:**
- ✅ Combining data from multiple tables (joins)
- ✅ Adding computed/derived properties
- ✅ Frontend-specific transformations (e.g., form data)
- ✅ API response wrappers
- ❌ NOT for duplicating database structure
- ❌ NOT for "simplifying" Supabase types

**Important Notes:**
- Database fields use **snake_case** (e.g., `owner_name`, `is_available`)
- Computed properties can use **camelCase** (e.g., `totalBoxes`, `occupancyRate`)
- Always handle nullable fields - many Supabase fields can be `null`
- Run `npm run db:types` after any database migration

### Supabase Studio Access

When `supabase start` is running, Supabase Studio (the database dashboard) is automatically available at:
**http://localhost:54323**

No additional commands are needed - just navigate to this URL in your browser to access the graphical database interface.