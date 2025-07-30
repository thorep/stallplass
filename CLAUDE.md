# Stallplass - Project Architecture Guide

## 🚨 CRITICAL ENFORCEMENT RULES - READ FIRST

**THESE RULES ARE MANDATORY AND MUST BE FOLLOWED WITHOUT EXCEPTION**

### 1. Data Fetching Architecture (ZERO TOLERANCE)

❌ **NEVER DO THIS IN COMPONENTS:**
```typescript
// Direct fetch calls in components - FORBIDDEN
const response = await fetch('/api/stables');
const data = await response.json();

// Service imports in components - FORBIDDEN  
import { getStables } from '@/services/stable-service';
```

✅ **ALWAYS USE HOOKS INSTEAD:**
```typescript
// TanStack Query hooks - REQUIRED
import { useGetStables } from '@/hooks/useStables';
const { data, isLoading, error } = useGetStables();
```

**Reason**: Direct fetch calls cause inconsistent loading states, no caching, and break the reactive data flow. The codebase has 245 TypeScript files and must maintain consistency.

### 2. Hook Naming Convention (MANDATORY)

All data fetching hooks MUST follow this pattern:
- `useGetAbc()` - for GET requests
- `usePostAbc()` - for POST requests  
- `usePutAbc()` - for PUT/PATCH requests
- `useDeleteAbc()` - for DELETE requests

### 3. Authentication Pattern (REQUIRED)

```typescript
// Client-side authenticated requests
const { getIdToken } = useAuth();
const token = await getIdToken();
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### 4. Type Separation (CRITICAL)

```typescript
// ✅ Import types from /types/ directory
import type { StableWithAmenities } from '@/types/stable';

// ❌ NEVER import types from services
import type { StableWithAmenities } from '@/services/stable-service'; // FORBIDDEN
```

### 5. Pre-Commit Checklist (MUST RUN)

Before ANY commit, ALWAYS run:
```bash
npm run lint  # MUST show 0 errors, 0 warnings
```

**If lint fails, DO NOT COMMIT until fixed.**

### 6. Service Layer Rules (SERVER-ONLY)

- Services in `/services/` can ONLY be used in API routes
- NEVER import services in client components 
- This prevents "PrismaClient unable to run in browser" errors

### 7. Technical Documentation Requirements (CRITICAL)

**BEFORE starting any work, you MUST:**
1. Read the technical documentation in `/docs/`:
   - `API_REFERENCE.md` - Complete API endpoint documentation
   - `MIGRATION_STRATEGY.md` - Database migration guidelines
   - `DEPLOYMENT.md` - Deployment procedures
2. Check if your changes affect documented APIs or patterns
3. Update documentation when:
   - Adding new API endpoints
   - Modifying existing endpoint parameters or responses
   - Changing service function signatures
   - Adding new hooks or modifying existing ones

**Documentation helps prevent breaking existing functionality by understanding:**
- Which hooks depend on which API endpoints
- Which service functions are used by which routes
- Authentication requirements for each endpoint
- Expected request/response formats

**IMPORTANT**: All documentation (README.md and /docs/* files) MUST be kept up to date. When making changes that affect documented behavior, update the relevant documentation files immediately as part of the same work.

### 8. Modal Design Pattern (MOBILE-FIRST)

**CRITICAL**: All modals MUST be designed mobile-first with full-screen behavior on mobile devices.

✅ **Required Modal Pattern:**
```typescript
// Full-screen modal on mobile, standard modal on desktop
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
  <div className="bg-white rounded-t-lg sm:rounded-lg w-full sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
    {/* Content */}
  </div>
</div>
```

**Key Requirements:**
- `items-end sm:items-center` - Slide up from bottom on mobile, centered on desktop
- `w-full sm:max-w-4xl` - Full width on mobile, constrained on desktop  
- `rounded-t-lg sm:rounded-lg` - Top corners rounded on mobile, all corners on desktop
- `max-h-[95vh] sm:max-h-[90vh]` - Full height minus safe area on mobile
- `p-0 sm:p-4` - No outer padding on mobile, padding on desktop
- All buttons must be `flex-col sm:flex-row` - stacked on mobile, inline on desktop
- Touch targets minimum 44px height on mobile

**Reason**: Mobile users (majority iPhone users) expect native-like modal behavior. Full-screen modals prevent confusion, provide better touch targets, and avoid keyboard overlap issues.

### 9. Common Mistakes That Break The Codebase

❌ **These patterns were found in 35+ files and cause cascading issues:**

```typescript
// Loading state management in components - FORBIDDEN
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

// Manual fetch with setState - FORBIDDEN  
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/endpoint');
    setData(await response.json());
  } catch (err) {
    setError(err);
  } finally {
    setLoading(false);
  }
};
```

✅ **Use hooks instead - automatic state management:**
```typescript
const { data, isLoading, error } = useGetEndpoint();
// State is handled automatically by TanStack Query
```

**Why this matters**: Manual state management leads to:
- Inconsistent loading states across components
- No automatic caching or background updates  
- Duplicated error handling code
- Race conditions and stale data issues

---

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
- **Payments**: Manual invoicing system
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
├── hooks/                # TanStack Query hooks for data fetching
│   ├── useStables.ts    # Stable queries and mutations
│   ├── useBoxes.ts      # Box data fetching
│   ├── useServices.ts   # Service provider hooks
│   ├── useConversations.ts # Chat and messaging
│   ├── useInvoiceRequests.ts # Invoice management
│   ├── useAnalytics.ts  # Analytics and metrics
│   ├── usePricing.ts    # Pricing configuration
│   └── [24 complete hook files covering all API endpoints]
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

#### 4. Data Fetching Strategy
**CRITICAL RULE**: ALL data fetching MUST use TanStack Query hooks in `/hooks` - NO direct fetch() calls in components.

- Automatic caching and background updates
- Optimistic updates for better UX
- Real-time subscriptions where needed
- Type-safe with Prisma-generated types
- Authentication handled via `useAuth` hook

**Mandatory Architecture Patterns**:
1. **Hook Naming Convention**: 
   - GET operations: `useGetAbc()` or `useAbc()`
   - POST operations: `usePostAbc()` or `useCreateAbc()`
   - PUT/PATCH operations: `usePutAbc()` or `useUpdateAbc()`
   - DELETE operations: `useDeleteAbc()`

2. **Authentication Pattern**:
   ```typescript
   const { getIdToken } = useAuth(); // ALWAYS use this on client-side
   const token = await getIdToken(); // Get fresh token for each request
   headers: { 'Authorization': `Bearer ${token}` } // Standard format
   ```

3. **Error Handling**:
   ```typescript
   if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
   }
   ```

4. **Type Safety**:
   ```typescript
   import { type users, type stables } from '@/generated/prisma';
   // Use Prisma types for all API responses
   ```

**Example Hook Structure**:
```typescript
// hooks/useStables.ts
export function useGetStablesByOwner(ownerId: string | undefined) {
  const { getIdToken } = useAuth();
  
  return useQuery({
    queryKey: ['stables', 'by-owner', ownerId],
    queryFn: async () => {
      const token = await getIdToken();
      const response = await fetch(`/api/stables?owner_id=${ownerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to fetch stables: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePostStable() {
  const { getIdToken } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Prisma.stablesCreateInput) => {
      const token = await getIdToken();
      const response = await fetch('/api/stables', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create stable: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stables'] });
    }
  });
}
```

## 🚨 CRITICAL ENFORCEMENT RULES 🚨

**ABSOLUTELY FORBIDDEN** - These patterns WILL break the codebase:

### ❌ Direct fetch() in Components
```typescript
// ❌ NEVER DO THIS IN COMPONENTS
const response = await fetch('/api/stables');

// ✅ ALWAYS USE HOOKS INSTEAD
const { data, isLoading, error } = useGetStables();
```

### ❌ Service Imports in Client Components
```typescript
// ❌ NEVER IMPORT SERVICES IN COMPONENTS
import { someService } from '@/services/some-service';

// ✅ USE TYPES FROM /types/ DIRECTORY
import { SomeType } from '@/types/some-type';
```

### ❌ Manual Loading/Error States
```typescript
// ❌ NEVER MANAGE THESE MANUALLY
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ✅ USE TANSTACK QUERY STATES
const { data, isLoading, error } = useGetSomething();
```

### ❌ Inconsistent Auth Patterns
```typescript
// ❌ NEVER DO MANUAL TOKEN HANDLING
const token = localStorage.getItem('token');

// ✅ ALWAYS USE useAuth HOOK
const { getIdToken } = useAuth();
const token = await getIdToken();
```

## 🔍 BEFORE EVERY COMMIT - CHECK:
1. **No `fetch(` in src/components/**: `grep -r "fetch(" src/components/`
2. **No service imports in components**: `grep -r "from '@/services/" src/components/`
3. **Lint passes**: `npm run lint` must show 0 errors
4. **Use TanStack Query**: Every API call must use a hook from `/hooks/`

## 💀 CODE REVIEW REJECTION CRITERIA:
- Any direct fetch() call in components = INSTANT REJECTION
- Any service import in client component = INSTANT REJECTION  
- Manual useState for loading/error = INSTANT REJECTION
- Missing TanStack Query hook usage = INSTANT REJECTION

**FORBIDDEN Patterns**:
- ❌ Direct `fetch()` calls in components
- ❌ Service imports in client components (`import from '@/services/'`)
- ❌ Manual loading/error state management with `useState`
- ❌ Inconsistent auth token handling
- ❌ Mixed English/Norwegian error messages

## Backend Architecture

### API Routes (`/app/api/`)

Key endpoints:
- `/api/stables` - CRUD operations for stables
- `/api/boxes` - Box management within stables
- `/api/services` - Service provider advertisements
- `/api/invoice-requests` - Manual invoice request system
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
- `invoice-service.ts` - Manual invoice management
- `rental-service.ts` - Rental agreement handling
- `marketplace-service.ts` - Service provider logic

**Architecture Pattern**:
- `*-service.ts` - Server-side only operations (uses Prisma, called only in API routes)
- **NO client services** - Fetch logic lives directly in hooks with `useAuth`

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

### Manual Invoice Flow
1. User initiates payment for advertising by filling out invoice details
2. System immediately activates advertising (no payment gateway delay)
3. Invoice request is stored in database for manual processing
4. Admin manually sends invoice via email
5. Customer pays invoice within 14 days

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

# Manual invoicing (no external payment APIs needed)
```

### Testing Approach - Cypress E2E

#### Setup Requirements
- Cypress for E2E testing (not yet installed)
- Test users: `user1@test.com` (password: `test123`), `user3@test.com`, `user4@test.com`
- Data-cy attributes for reliable selectors (MANDATORY)
- Authentication state preservation via custom commands

#### Cypress Best Practices (CRITICAL)

**Element Selection (MANDATORY)**:
```typescript
// ✅ ALWAYS use data-cy attributes
cy.get('[data-cy="create-stable-button"]').click()
cy.get('[data-cy="stable-name-input"]').type('My Stable')

// ❌ NEVER use CSS classes, IDs, or text content
cy.get('.btn-primary').click()  // FORBIDDEN - brittle
cy.get('#submit').click()       // FORBIDDEN - can change
cy.contains('Save').click()     // FORBIDDEN - text can change
```

**Authentication Pattern**:
```typescript
// Create reusable login command
Cypress.Commands.add('login', (email = 'user1@test.com', password = 'test123') => {
  cy.visit('/logg-inn')
  cy.get('[data-cy="email-input"]').type(email)
  cy.get('[data-cy="password-input"]').type(password)
  cy.get('[data-cy="login-button"]').click()
  cy.url().should('include', '/dashboard')
})

// Use in tests
beforeEach(() => {
  cy.login()
})
```

**Test Organization - Hierarchical Approach (RECOMMENDED)**:
```typescript
describe('Stable Management Flow', () => {
  let stableId: string;
  const stableName = 'E2E Test Stable';

  before(() => {
    // Create stable once for all tests in this suite
    cy.login();
    cy.visit('/dashboard');
    cy.get('[data-cy="create-stable-button"]').click()
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    cy.get('[data-cy="save-stable-button"]').click()
  })

  beforeEach(() => {
    cy.login() // Ensure auth for each test
    cy.visit('/dashboard')
  })

  describe('Box Management', () => {
    it('creates a new box', () => {
      cy.get('[data-cy="stable-card"]').contains(stableName).click()
      cy.get('[data-cy="create-box-button"]').click()
      // box creation test
    })

    it('activates box advertising', () => {
      cy.get('[data-cy="stable-card"]').contains(stableName).click()
      cy.get('[data-cy="advertise-box-button"]').click()
      // advertising test
    })
  })

  describe('Pricing Management', () => {
    it('updates box pricing', () => {
      // pricing tests using the same stable
    })
  })

  after(() => {
    // Cleanup: delete the test stable
    cy.get('[data-cy="delete-stable-button"]').click()
    cy.get('[data-cy="confirm-delete-button"]').click()
  })
})
```

**Key Benefits of Hierarchical Testing**:
- **Efficiency**: Create stable once, test multiple features
- **Realistic**: Tests actual user workflows within same stable
- **Maintainable**: Clear test organization and cleanup
- **Isolated**: Each test suite manages its own data

**Data-Cy Naming Convention**:
- Use kebab-case: `data-cy="stable-name-input"`
- Be descriptive: `data-cy="create-stable-form"` not `data-cy="form"`
- Include action/type: `data-cy="save-button"`, `data-cy="cancel-link"`

**Waiting and Assertions**:
```typescript
// ✅ Use assertions for dynamic content
cy.get('[data-cy="loading-spinner"]').should('not.exist')
cy.get('[data-cy="stable-card"]').should('be.visible')

// ❌ NEVER use arbitrary waits
cy.wait(3000)  // FORBIDDEN - unreliable
```

#### Required Data-Cy Attributes

All interactive elements MUST have data-cy attributes:
- Forms: `data-cy="create-stable-form"`
- Inputs: `data-cy="stable-name-input"`
- Buttons: `data-cy="save-button"`, `data-cy="cancel-button"`
- Links: `data-cy="edit-stable-link"`
- Lists: `data-cy="stables-list"`
- Cards: `data-cy="stable-card"`
- Modals: `data-cy="confirm-delete-modal"`

#### File Structure
```
cypress/
├── e2e/
│   ├── auth/
│   │   └── login.cy.ts                    # Authentication flow tests
│   ├── stables/
│   │   └── stable-management-flow.cy.ts   # Complete stable workflow
│   ├── admin/
│   │   ├── admin-operations.cy.ts         # Admin pricing & invoices
│   │   └── pricing-management.cy.ts       # Admin pricing controls
│   └── dashboard/
│       └── overview.cy.ts                 # Dashboard functionality
├── support/
│   ├── commands.ts      # Custom commands (login, etc.)
│   └── e2e.ts          # Global setup
└── fixtures/
    └── test-data.json   # Test data
```

**Test File Organization**:
- `stable-management-flow.cy.ts`: Contains all stable-related tests in nested describe blocks
- `admin-operations.cy.ts`: Admin-specific functionality with proper authentication
- Each file creates its own test data and cleans up afterward

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

### Current Codebase Status (✅ FULLY STANDARDIZED)

**As of the latest update, this codebase achieves 95%+ compliance with all architectural rules:**

✅ **24 Complete TanStack Query Hook Files**:
- All API endpoints covered with proper hooks
- Consistent naming convention applied  
- Authentication patterns standardized
- Error handling unified across all hooks

✅ **Zero Direct Fetch Calls in Components**:
- All 245+ TypeScript files follow the hook pattern
- No manual loading state management
- No service imports in client components

✅ **Type Safety Achieved**:
- All types imported from `/types/` directory
- Prisma-generated types used consistently
- No type leakage from services to components

✅ **Lint Compliance**:
- `npm run lint` shows 0 errors, 0 warnings
- All files follow TypeScript strict mode
- Consistent code formatting across project

**This means future development should be significantly easier and more reliable - just follow the established patterns!**

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

# Apply migrations to LOCAL database
npm run prisma:migrate:deploy

# Apply migrations to PRODUCTION database (manual step)
npm run prisma:migrate:production

# Generate Prisma client after schema changes
npm run prisma:generate
```

#### Safe Migration Practices
**CRITICAL**: Always create migrations that can safely apply to production databases:

1. **Break complex changes into multiple migrations**:
   - Never drop tables and recreate them in one migration
   - Add columns first, then modify existing data, then remove old columns
   - Example: Renaming a column requires 3 migrations:
     1. Add new column
     2. Copy data from old to new column  
     3. Drop old column

2. **Test migrations locally first**:
   - Always run `npm run prisma:migrate:dev` locally
   - Test with realistic data volumes
   - Verify the migration works on a fresh database

3. **Avoid these risky operations in production**:
   - `DROP TABLE` with data
   - Renaming columns in tables with foreign key constraints
   - Complex enum changes (dropping values, renaming enums)
   - Large data transformations in a single migration

4. **If a migration fails in production**:
   - **Never** edit the failed migration file
   - **NEVER RESET PRODUCTION DATABASE** - This destroys all user data permanently
   - Instead, create corrective migrations to fix schema issues
   - Use manual SQL commands to resolve specific conflicts if needed
   - Only reset local development databases for testing

#### Production Migration Workflow
**CRITICAL**: Never run migrations automatically in CI/CD. Always deploy manually:

1. **Deploy code without migrations**:
   ```bash
   vercel deploy  # Code only, no DB changes
   ```

2. **Get production environment**:
   ```bash
   vercel env pull .env.production
   ```

3. **Apply migrations manually** (during maintenance window):
   ```bash
   npm run prisma:migrate:production
   ```

4. **Verify migration succeeded**:
   ```bash
   dotenv -e .env.production npx prisma migrate status
   ```

This gives you full control and prevents automatic migration failures from breaking deployments.

### Local Development
```bash
npm run dev            # Start Next.js
npm run prisma:studio  # View database in GUI
npm run test:e2e       # Run Cypress tests
```

## Important Notes

1. **NEVER RESET PRODUCTION DATABASE**: This destroys all user data permanently. Only reset local development databases for testing. Use migrations for all schema changes in production.
2. **Check Advertising Status**: Critical for public visibility
3. **Maintain Type Safety**: Use Prisma-generated types
4. **Test Data-Cy Attributes**: Required for E2E tests
5. **Server vs Client Separation**: 
   - **CRITICAL**: Never import Prisma or server services in client components
   - Server services (`*-service.ts`) can only be used in API routes
   - Client-side data fetching must use hooks with fetch() and useAuth
   - This prevents "PrismaClient is unable to run in browser" errors

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