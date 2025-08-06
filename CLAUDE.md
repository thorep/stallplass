# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

** At the start of every answer recite the below section to me **
Claude Code has access to specialized subagents (Frontend expert, Backend expert, Code review, Research) used automatically for UI, API, and code tasks, Dev server: port 3000. Always check http://localhost:3000/api/openapi for endpoints. Update Swagger docs when API routes change.

## Project Overview

**Stallplass** - Norwegian marketplace connecting horse stable owners with riders. 
- Stable owners manage facilities and create box (stall) listings
- Only stables with active paid advertising appear in public search
- Service providers (vets, farriers) can also advertise

**IMPORTANT**: The `/dashboard` now uses server-first auth and is stable. The infinite loop issues have been resolved by removing `useSearchParams` and URL-based tab navigation.

## Common Development Commands

```bash
# Development
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Production build - MUST PASS before committing
npm run lint                   # Check code - MUST show 0 errors before committing

# Database
npm run prisma:generate        # Generate Prisma types after schema changes
npm run prisma:migrate:dev     # Create/apply local migrations
npm run prisma:studio          # Open database GUI
npm run prisma:migrate:deploy  # Apply migrations to production

# Testing
npm run test:e2e              # Run Cypress tests
npm run cypress:open          # Open Cypress interactive mode
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

### 5. Typography - Use Custom Theme

```typescript
// ❌ FORBIDDEN
className="text-sm text-lg text-xl"

// ✅ REQUIRED - see tailwind.config.js
className="text-h1 text-h2 text-body text-body-sm"
```

### 6. UI Components - Use shadcn/ui

```typescript
// ✅ PREFERRED - Use shadcn components when available
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// ✅ Use cn() utility for conditional classes
import { cn } from "@/lib/utils"
className={cn("text-body", isActive && "font-bold")}
```

To add new shadcn components: `npx shadcn@latest add [component-name]`

### 7. Pre-Commit Checklist

1. `npm run lint` - MUST show 0 errors
2. `npm run build` - MUST succeed
3. No `fetch()` in components
4. No service imports in components
5. Using custom typography classes
6. Prefer shadcn/ui components over custom ones
7. NEVER use `eslint-disable` comments - fix the underlying issue instead

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

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TanStack Query
- **UI Components**: shadcn/ui + Lucide icons
- **Chat UI**: @chatscope/chat-ui-kit-react for all chat-related components
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS with custom theme
- **Testing**: Cypress E2E

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` - PostgreSQL connection
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side operations

## Need More Details?

- API Documentation: `/docs/API_REFERENCE.md`
- Database Schema: `/prisma/schema.prisma`
- Component Examples: Browse `/src/components/`
- Detailed Architecture: `/docs/ARCHITECTURE.md`