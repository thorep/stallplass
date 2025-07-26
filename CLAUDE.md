# Stallplass - Project Architecture Guide

## Overview

Stallplass is a Norwegian platform connecting stable owners with horse riders. Stable owners can manage their facilities, create individual box listings, and advertise them. Service providers (veterinarians, farriers, trainers) can also create service advertisements.

**Key Business Model**: Stables and boxes only appear in public search results when the stable has active paid advertising. Service providers also pay for their service listings.

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: Supabase Auth
- **ORM**: Prisma with type-safe database access
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (for data fetching), Zustand (for UI state)
- **Payments**: Vipps (Norwegian mobile payment system)
- **Maps**: Leaflet
- **Testing**: Cypress (E2E)

## Frontend Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard page
│   ├── logg-inn/         # Login page with server actions
│   ├── staller/          # Public stable browsing
│   └── tjenester/        # Service provider listings
├── components/            # React components (Atomic Design)
│   ├── atoms/            # Basic components (Button, Input)
│   ├── molecules/        # Compound components (Cards, Forms)
│   └── organisms/        # Complex components (Header, SearchFilters)
├── hooks/                # Custom React hooks (to be implemented)
│   └── [TanStack Query hooks will be created here]
├── lib/                  # Core utilities and configurations
│   ├── supabase/        # Supabase client setup (for auth & realtime)
│   └── logger.ts        # Pino logging configuration
├── prisma/              # Prisma schema and migrations
│   ├── schema.prisma    # Database schema definition
│   └── migrations/      # Migration files
├── generated/prisma/    # Generated Prisma client (gitignored)
├── services/            # Business logic and API calls
├── types/               # TypeScript type definitions
└── utils/               # Helper functions

```

### Key Frontend Features

#### 1. Authentication Flow
- Server-side auth check in middleware (`src/middleware.ts`)
- Redirects authenticated users from `/logg-inn` to `/dashboard`
- Protects `/dashboard` routes for authenticated users only

#### 2. Dashboard (`/dashboard`)
- **Overview Tab**: Statistics and quick metrics
- **Mine staller Tab**: Stable management with CRUD operations
- **Leieforhold Tab**: Rental relationship management
- **Tjenester Tab**: Service advertisement management
- **Analyse Tab**: View analytics and metrics

#### 3. Public Search (`/staller`)
- Filter by location, price, amenities
- Map view integration
- **Critical**: Only shows boxes with `is_active = true` in the database.
- Box search with detailed filtering options
- Stables will show up in search, they require no advertising, its just the boxes that require it.

#### 4. Data Fetching Strategy (To Be Implemented)
All data fetching will use TanStack Query hooks in `/hooks`:
- Automatic caching and background updates
- Optimistic updates for better UX
- Real-time subscriptions where needed
- Type-safe with Prisma-generated types

Example structure:
```typescript
// hooks/useStables.ts
export function useStables() {
  return useQuery({
    queryKey: ['stables'],
    queryFn: fetchStables,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Backend Architecture

### API Routes (`/app/api/`)

Key endpoints:
- `/api/stables` - CRUD operations for stables
- `/api/boxes` - Box management within stables
- `/api/services` - Service provider advertisements
- `/api/payments` - Vipps payment integration
- `/api/conversations` - Messaging between users
- `/api/rentals` - Rental agreement management

### Database & ORM

#### Prisma Setup

This project uses Prisma as the ORM with PostgreSQL. The database schema is managed through Prisma migrations.

**Key Files**:
- `prisma/schema.prisma` - Database schema definition
- `prisma/migrations/` - Migration files
- `src/generated/prisma/` - Generated Prisma client (auto-generated, in .gitignore)

**Development Commands**:
```bash
# Generate Prisma client
npm run prisma:generate

# Create migration from schema changes
npm run prisma:migrate:dev

# View database in Prisma Studio
npm run prisma:studio

# Deploy migrations to production
npm run prisma:migrate:deploy
```

**Production Deployment**:
- Vercel automatically runs `prisma generate && prisma migrate deploy && next build`
- Migrations are applied before each build
- Set `DATABASE_URL` and `DIRECT_URL` in Vercel environment variables

#### Database Schema

**Core Tables** (now in camelCase via Prisma):
- `users` - User accounts (synced with Supabase Auth)
- `stables` - Stable listings with location and amenities
- `boxes` - Individual box/stall listings within stables
- `payments` - Payment records for advertising
- `conversations` & `messages` - In-app messaging
- `rentals` - Rental agreements between owners and riders

**Critical Business Rules**:
1. **Advertising Requirement**: 
   - `stables.advertisingActive` must be `true` for public visibility
   - `stables.advertisingEndDate` must be in the future
   - Enforced in `searchBoxes()` function

2. **User ID Synchronization**:
   - Database `users.firebaseId` MUST match Supabase Auth user ID
   - Mismatched IDs cause authentication failures

### Service Layer (`/services/`)

Business logic is organized by domain:
- `stable-service.ts` - Stable CRUD and search logic
- `box-service.ts` - Box management and filtering
- `payment-service.ts` - Vipps integration
- `rental-service.ts` - Rental agreement handling
- `marketplace-service.ts` - Service provider logic

**Server vs Client Services**:
- `*-service.ts` - Server-side operations (uses service role)
- `*-service-client.ts` - Client-side operations (respects RLS)

### Authentication & Security

1. **Middleware Protection** (`src/middleware.ts`):
   - Checks session server-side
   - Redirects based on auth status
   - Protects dashboard routes

2. **Data Access Control**:
   - Enforced through API routes and service layer
   - Users can only modify their own data
   - Public data filtered by advertising status
   - Prisma handles all database queries

3. **API Route Protection**:
   - Bearer token validation
   - User context verification
   - Admin-only endpoints

## Payment Integration

### Vipps Flow
1. User initiates payment for advertising
2. Create payment request via Vipps API
3. User completes payment in Vipps app
4. Callback updates advertising status
5. Stable/service becomes publicly visible

### Advertising States
- `advertising_active`: Boolean flag for visibility
- `advertising_end_date`: Expiration timestamp
- `is_sponsored`: Premium placement flag (boxes)

## Development Guidelines

### Environment Variables
Required in `.env.local`:
```
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stallplass_dev
DIRECT_URL=postgresql://user:password@localhost:5432/stallplass_dev

# Supabase (for auth & realtime)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vipps
VIPPS_CLIENT_ID=
VIPPS_CLIENT_SECRET=
VIPPS_SUBSCRIPTION_KEY=
```

### Testing Approach
- E2E tests with Cypress
- Test users: `user3@test.com` and `user4@test.com`
- Data-cy attributes for reliable selectors
- Authentication state preservation

### Code Standards
- TypeScript strict mode
- Atomic Design for components
- Server/client separation for Supabase
- Norwegian UI text, English code/comments
- Comprehensive error handling
- **CRITICAL**: Always run `npm run lint` before committing - must show 0 errors and 0 warnings

### Development Workflow

After making code changes:

1. **Commit the code** with a descriptive commit message
2. **Document what needs to be tested**:
   - If testable in browser: Specify the URL path and actions to test
   - If not testable in browser: Write "Not testable in browser" and explain why
3. **Use the code review agent** to review your changes
4. The code review agent will automatically analyze:
   - Code quality and best practices
   - Potential bugs or issues
   - Alignment with project architecture
   - Security concerns

## Common Development Tasks

### Adding a New Feature
1. Update schema in `prisma/schema.prisma` if needed
2. Run migrations: `npm run prisma:migrate:dev`
3. Create service functions in `/services/`
4. Implement TanStack Query hooks in `/hooks/`
5. Build UI components following atomic design
6. Add data-cy attributes for testing
7. Write Cypress tests

### Database Migrations
```bash
# Create a new migration after schema changes
npm run prisma:migrate:dev -- --name feature_name

# Apply migrations to production
npm run prisma:migrate:deploy

# Generate Prisma client after schema changes
npm run prisma:generate
```

### Local Development
```bash
npm run dev            # Start Next.js
npm run prisma:studio  # View database in GUI
npm run test:e2e       # Run Cypress tests
```

## Important Notes

1. **Never Reset Database**: Use migrations for schema changes
2. **Check Advertising Status**: Critical for public visibility
3. **Maintain Type Safety**: Use Prisma-generated types
4. **Test Data-Cy Attributes**: Required for E2E tests
5. **Server vs Client**: Never mix Supabase clients

## Type System

The project uses Prisma-generated types for type-safe database access:

**Type Usage**:
```typescript
import { users, stables, boxes, Prisma } from '@/generated/prisma'

// Entity types
type User = users
type Stable = stables
type Box = boxes

// Input types for mutations
type CreateStableData = Prisma.stablesCreateInput
type UpdateBoxData = Prisma.boxesUpdateInput

// Example usage
const user: User = { 
  id: 'uuid', 
  email: 'user@example.com',
  createdAt: new Date(),
  firebaseId: 'auth-id'
}
```

**Field Naming Convention**:
All database fields use camelCase:
- `createdAt`, `updatedAt` (timestamps)
- `stableId`, `boxId` (foreign keys)  
- `isAvailable`, `isActive` (booleans)
- `advertisingActive`, `advertisingEndDate` (business fields)

This architecture supports a scalable marketplace with secure payments, real-time features, and comprehensive stable management capabilities.