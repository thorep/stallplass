# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

** At the start of every answer recite the below section to me **
Claude Code has access to specialized subagents (Frontend expert, Backend expert, Code review, Research) used automatically for UI, API, and code tasks, Dev server: port 3000. Always check http://localhost:3000/api/openapi for endpoints. Update Swagger docs when API routes change. 
Use MUI for all new code and old code you are working on. Use MUI stuff like grid, stack, box etc 
instead of divs. Use MUI props as much as possible, not sx.

## Project Overview

**Stallplass** - Norwegian marketplace connecting horse stable owners with riders. 
- Stable owners manage facilities and create box (stall) listings
- Only stables with active paid advertising appear in public search
- Service providers (vets, farriers) can also advertise
- User can have their own horse in Stallplass, create logs and share the horse with others.

**IMPORTANT**: The `/dashboard` now uses server-first auth and is stable. The infinite loop issues have been resolved by removing `useSearchParams` and URL-based tab navigation.

## Common Development Commands

```bash
# Development
npm run dev                    # Start dev server (http://localhost:3000) with Turbopack
npm run build                  # Production build - MUST PASS before committing
npm run start                  # Start production server
npm run lint                   # Check code - MUST show 0 errors before committing

# Database
npm run prisma:generate        # Generate Prisma types after schema changes
npm run prisma:migrate:dev     # Create/apply local migrations
npm run prisma:studio          # Open database GUI
npm run prisma:migrate:deploy  # Apply migrations to production
npm run db:seed               # Seed database with test data

# Testing
npm run test                  # Run Cypress tests (full suite)
npm run test:keep             # Run Cypress tests keeping test data
npm run test:e2e              # Run Cypress E2E tests
npm run cypress:open          # Open Cypress interactive mode
npm run cypress:run           # Run Cypress headless
```

## Critical Architecture Rules

### 1. Data Fetching - NEVER Break This Pattern

```typescript
// ❌ FORBIDDEN in components
const response = await fetch('/api/stables');
import { getStables } from '@/services/stable-service';

// ✅ ALWAYS use hooks
import { useGetStables } from '@/hooks/useStables';
const { data, isLoading, error } = useGetStables();
```

**Why**: Services use Prisma (server-only). Direct imports cause "PrismaClient unable to run in browser" errors.

### 2. Hook vs Service Separation

- **Hooks** (`/hooks/*.ts`): Client-side, use fetch(), TanStack Query
- **Services** (`/services/*.ts`): Server-side, use Prisma, ONLY in API routes
- **Types** (`/types/*.ts`): Shared between client/server

### 3. Authentication Patterns (Official Supabase SSR)

**CRITICAL**: We use server-first authentication with `@supabase/ssr`. The old client-side `useAuth()` context is deprecated and causes loading issues.

#### Server Components & Pages (REQUIRED PATTERN)
```typescript
// ✅ REQUIRED: For pages that require auth - pass user down as prop
import { requireAuth } from '@/lib/server-auth'

export default async function ProtectedPage() {
  const user = await requireAuth('/current-path') // Auto-redirects if not authenticated
  return <ProtectedContent user={user} />
}

// ✅ For optional auth
import { getUser } from '@/lib/server-auth'

export default async function OptionalAuthPage() {
  const user = await getUser() // Returns null if not authenticated
  return <PageContent user={user} />
}

// ✅ For admin-only pages  
import { requireAdminAuth } from '@/lib/server-auth'

export default async function AdminPage() {
  const user = await requireAdminAuth() // Auto-redirects + checks admin
  return <AdminContent user={user} />
}

// ✅ For email verification required
import { requireVerifiedEmail } from '@/lib/server-auth'

export default async function VerifiedPage() {
  const user = await requireVerifiedEmail('/current-path')
  return <VerifiedContent user={user} />
}
```

#### Client Components Pattern
```typescript
// ✅ REQUIRED: Accept user as prop from server component
interface MyComponentProps {
  user: User; // or User | null for optional auth
  // ... other props
}

export default function MyComponent({ user }: MyComponentProps) {
  // User is guaranteed to be authenticated (no loading states needed)
  return <div>Hello {user.email}</div>
}

// ❌ FORBIDDEN: Do not use client-side auth context
// const { user, loading } = useAuth() // CAUSES LOADING ISSUES
```

#### Client-Side Auth (Only When Necessary)
```typescript
// ✅ Only for client components that can't receive user as prop
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function useClientAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    
    getUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return { user, loading }
}
```

#### API Routes (Keep Current Pattern)
```typescript
// ✅ For API routes - keep using our middleware
import { withAuth, withAdminAuth } from '@/lib/supabase-auth-middleware'

export const GET = withAuth(async (request, { profileId }) => {
  return NextResponse.json({ userId: profileId })
})

// ✅ For admin operations requiring service role
import { createServerClient } from '@supabase/ssr'

const adminSupabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  }
)
```

#### Route Protection Summary (UPDATED)
- **✅ Server pages**: Use `requireAuth()`, `getUser()`, or `requireVerifiedEmail()` from `@/lib/server-auth`
- **✅ Client components**: Accept user as prop from parent server component  
- **✅ API routes**: Keep current `withAuth()` middleware pattern
- **❌ Middleware protection**: Not needed for individual pages (use server-side auth instead)
- **❌ Client auth context**: Avoid `useAuth()` hook - causes loading issues

### 4. Profile Data Schema (IMPORTANT)

**Profile fields have been updated** - the old `name` and `email` fields were removed from the profiles table:

```typescript
// ❌ OLD SCHEMA (deprecated)
profiles: {
  select: { name: true, email: true }
}

// ✅ NEW SCHEMA (current)
profiles: {
  select: { 
    firstname: true,
    middlename: true, 
    lastname: true,
    nickname: true,
    phone: true
  }
}
```

**Key changes:**
- User email is now only in Supabase Auth (`user.email`), not in profiles table
- Display name should use `nickname` field instead of old `name` field  
- For queries that need contact info, use `nickname` (NOT `name` or `email`)
- Profile editing uses individual name fields (firstname, middlename, lastname, nickname)

### 5. Typography - Use Custom Semantic Scale

```typescript
// ❌ FORBIDDEN - Never use standard Tailwind text sizes
className="text-sm text-lg text-xl"

// ✅ REQUIRED - Use semantic typography classes (see tailwind.config.js)
className="text-h1 text-h2 text-h3 text-body text-body-sm text-caption"

// Available semantic classes:
// - Display: text-display, text-display-sm (hero banners)
// - Headings: text-h1, text-h2, text-h3, text-h4, text-h5, text-h6 (with mobile variants)
// - Body: text-body, text-body-sm, text-caption (content)
// - Interactive: text-button, text-button-lg, text-link
// - Labels: text-overline (uppercase category labels)
```

### 6. UI Components - Migrate to MUI

```typescript
// ❌ OLD PATTERN (shadcn/ui - migrate when touching component)
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// ✅ NEW PATTERN (MUI)
import { Button, Card } from '@mui/material'

// ✅ Use cn() utility for conditional Tailwind classes
import { cn } from "@/lib/utils"
className={cn("text-body", isActive && "font-bold")}

// ✅ For MUI components, combine Tailwind + sx prop
<Button 
  className="w-full" // Tailwind for layout
  sx={{ 
    textTransform: 'none', // MUI overrides
    borderRadius: '0.625rem'
  }}
>
  Click me
</Button>

// ✅ Prefer MUI layout components over divs
// Instead of: <div className="flex flex-col gap-4">
import { Stack } from '@mui/material'
<Stack spacing={2} direction="column">
  {/* content */}
</Stack>

// Instead of: <div className="grid grid-cols-2 gap-4">
import { Grid2 as Grid } from '@mui/material'
<Grid container spacing={2}>
  <Grid xs={6}>{/* content */}</Grid>
  <Grid xs={6}>{/* content */}</Grid>
</Grid>
```

**Migration approach**: When working on any file that uses shadcn/ui components, replace them with MUI equivalents. **CRITICAL**: The design must match exactly - same colors, spacing, borders, and overall appearance. Use Tailwind classes and MUI sx prop to achieve pixel-perfect matching.

### 7. Pre-Commit Checklist

1. `npm run lint` - MUST show 0 errors
2. `npm run build` - MUST succeed
3. No `fetch()` in components
4. No service imports in components
5. Using custom semantic typography classes (not text-sm, text-lg, etc.)
6. MUI components preferred over shadcn/ui (migrate when touching)
7. NEVER use `eslint-disable` comments - fix the underlying issue instead
8. All new uploads use unified upload system (`useCentralizedUpload`)
9. Feature flags implemented via Hypertune (not hardcoded conditionals)

## Project Structure

```
src/
├── app/              # Next.js pages (App Router)
│   ├── api/         # API routes (use services here)
│   └── dashboard/   # Protected pages
├── components/       # React components (use hooks here)
│   └── ui/          # shadcn/ui components
├── hooks/           # TanStack Query hooks (client-side)
├── services/        # Business logic with Prisma (server-side)
├── lib/             # Utilities (auth, supabase)
└── types/           # TypeScript types
```

## Key Business Logic

1. **Advertising Required**: Boxes only show in public search when stable has active advertising
2. **User Roles**: Regular users (stable owners) and admins
3. **Invoice Flow**: Manual invoicing - no payment gateway
4. **Horse Management**: Users can own horses, create care logs, and share horses with others
5. **Real-time Chat**: Conversations between riders and stable owners with real-time messaging
6. **Service Providers**: Vets, farriers, and other services can advertise on the platform
7. **Location-based Search**: Norwegian geography integration (fylker, kommuner, tettsteder)
8. **Forum System**: Community discussion platform with categories, threads, posts, and real-time interactions

## Common Patterns

### API Route
```typescript
import { withAuth } from '@/lib/supabase-auth-middleware';
import { updateStable } from '@/services/stable-service';

export const PUT = withAuth(async (request, { userId }) => {
  const data = await request.json();
  const result = await updateStable(userId, data);
  return NextResponse.json(result);
});
```

### Data Hook (Updated Pattern)
```typescript
export function useGetStables() {
  return useQuery({
    queryKey: ['stables'],
    queryFn: async () => {
      const res = await fetch('/api/stables', {
        // Authentication handled by withAuth middleware in API route
        credentials: 'include' // Include cookies for session
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });
}
```

### Component Pattern (Updated)
```typescript
// ✅ Server Component (Preferred)
import { requireAuth } from '@/lib/server-auth'
import { getStables } from '@/services/stable-service'

export default async function StableListPage() {
  const user = await requireAuth();
  const stables = await getStables(user.id); // Server-side data fetching
  
  return <StableList stables={stables} user={user} />;
}

// ✅ Client Component for Interactive Features
interface StableListProps {
  stables: Stable[];
  user: User;
}

export function StableList({ stables, user }: StableListProps) {
  // Optional: Use hooks for real-time updates or mutations
  const { data: liveStables = stables } = useGetStables(); // Starts with server data
  
  return (
    <div className="space-y-4">
      {liveStables.map(stable => (
        <StableCard key={stable.id} stable={stable} user={user} />
      ))}
    </div>
  );
}
```

## Common Mistakes to Avoid

1. **Using client-side `useAuth()` hook** → Use server-side `requireAuth()` and pass user as prop
2. **Importing services in components** → Use hooks for client components, services for server components
3. **Manual loading states for auth** → Server-first auth eliminates loading states
4. **Direct Prisma in API routes** → Use service functions
5. **Standard Tailwind text classes** → Use custom theme
6. **Creating custom UI components** → Use shadcn/ui first
7. **Client-side auth in protected pages** → Always use server-side authentication

## Development Tools & Patterns

### Image Handling
- **Compression**: All images auto-compressed via `useCentralizedUpload` hook
- **Formats**: Support JPEG, PNG, WebP up to 50MB
- **Storage**: Supabase Storage with public buckets (stableimages, boximages, service-photos)
- **Upload Pattern**: Always use `useCentralizedUpload` - never direct Supabase uploads

### Feature Flags (Hypertune)
```typescript
// ✅ REQUIRED: Use feature flags for A/B testing and gradual rollouts
import { useFlags } from '@/hooks/useFlags'

const ExampleComponent = () => {
  const { kampanjeFlag } = useFlags()
  
  if (kampanjeFlag) {
    return <PromotionalBanner />
  }
  return <StandardBanner />
}
```

### Norwegian Location Data
- **Integration**: Kartverket API for official Norwegian geographic data
- **Structure**: Fylker (counties) → Kommuner (municipalities) → Tettsteder (urban areas)
- **Usage**: Location search and filtering throughout the platform

### Forum System
- **Structure**: Sections → Categories → Threads → Replies
- **Features**: Rich text content, image uploads, reactions, tags, pinning, locking
- **Moderation**: Admin controls for category management and thread moderation
- **Types**: All forum types defined in `/src/types/forum.ts`
- **Pattern**: Uses same server-first auth and data fetching patterns as rest of app

### Real-time Subscriptions
```typescript
// ✅ Pattern for real-time updates
const { data: conversations } = useConversations() // Auto-subscribes to changes
const { messages } = useRealtimeMessages(conversationId) // Real-time message updates
```

### Atomic Design Structure
- **Atoms**: Basic building blocks (`Button`, `Input`, `LoadingSpinner`)
- **Molecules**: Simple combinations (`SearchBar`, `BoxCard`, `StableCard`) 
- **Organisms**: Complex components (`DashboardClient`, `SearchFilters`, `ConversationChat`)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **State Management**: TanStack Query (client state), Zustand (UI state)
- **UI Components**: 
  - **Migration in Progress**: Moving from shadcn/ui to MUI (Material UI)
  - **Strategy**: When working on ANY component, migrate it to MUI
  - **Approach**: 
    - Replace shadcn/ui components with MUI equivalents
    - Maintain same visual design using Tailwind classes and sx prop
    - Keep consistent UX - mobile-first, responsive
  - **Completed migrations**: 
    - Modal component (`/src/components/ui/modal.tsx`) - uses MUI Dialog
  - **MUI + Tailwind**: Use Tailwind for layout/spacing, MUI sx prop for component-specific styles
- **Chat UI**: @chatscope/chat-ui-kit-react for all chat-related components
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Supabase Auth with SSR (server-first)
- **Styling**: Tailwind CSS 4 with custom semantic typography scale
- **Icons**: Lucide React, Phosphor Icons, FontAwesome, Heroicons, MUI Icons
- **Rich Text**: TipTap (for descriptions and content editing)
- **File Uploads**: Custom unified upload system with compression
- **Payments**: Vipps API integration
- **Maps**: Leaflet for stable location display
- **Feature Flags**: Hypertune for A/B testing and feature rollouts
- **Testing**: Cypress E2E
- **Development**: Turbopack (npm run dev)

## Environment Variables

Required in `.env.local`:

**Core Database & Auth:**
- `DATABASE_URL` - PostgreSQL connection (for Prisma)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side admin operations

**Optional - Development:**
- `LOG_LEVEL` - Logging level (trace, debug, info, warn, error, fatal)
- `NODE_ENV` - Environment (development, production)

**Optional - Production Features:**
- Vipps payment credentials (for payment processing)
- Resend API key (for transactional emails)
- Feature flag credentials (Hypertune)
- Analytics keys (Vercel Analytics)

## Need More Details?

- API Documentation: `/docs/API_REFERENCE.md`
- Database Schema: `/prisma/schema.prisma`
- Component Examples: Browse `/src/components/`
- Detailed Architecture: `/docs/ARCHITECTURE.md`