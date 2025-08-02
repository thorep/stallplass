# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: Claude Code has access to specialized subagents for specific tasks (UI development, code review, API development, etc.). These will be used automatically for appropriate tasks to provide focused expertise.

## Project Overview

**Stallplass** - Norwegian marketplace connecting horse stable owners with riders. 
- Stable owners manage facilities and create box (stall) listings
- Only stables with active paid advertising appear in public search
- Service providers (vets, farriers) can also advertise

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

### 3. Authentication Pattern

- API routes: Use `withAuth()` or `withAdminAuth()` from `supabase-auth-middleware.ts`
- Client: Use `useAuth()` hook and `getIdToken()` for requests
- Never store tokens manually

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

### Data Hook
```typescript
export function useGetStables() {
  const { getIdToken } = useAuth();
  
  return useQuery({
    queryKey: ['stables'],
    queryFn: async () => {
      const token = await getIdToken();
      const res = await fetch('/api/stables', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    }
  });
}
```

### Component
```typescript
export function StableList() {
  const { data: stables, isLoading } = useGetStables();
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="space-y-4">
      {stables.map(stable => (
        <StableCard key={stable.id} stable={stable} />
      ))}
    </div>
  );
}
```

## Common Mistakes to Avoid

1. **Importing services in components** → Use hooks instead
2. **Manual loading states** → TanStack Query handles this
3. **Direct Prisma in API routes** → Use service functions
4. **Standard Tailwind text classes** → Use custom theme
5. **Creating custom UI components** → Use shadcn/ui first
6. **Forgetting auth headers** → Always include Bearer token

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