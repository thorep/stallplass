# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stallplass is a Norwegian marketplace platform for horse stable rentals and equestrian services. Built with Next.js 15, TypeScript, Prisma, and PostgreSQL, it connects stable owners with horse owners looking for boarding facilities.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint checks
- `npx tsc --noEmit` - Type check without building

### Database Commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate:dev` - Run database migrations in development
- `npm run prisma:studio` - Open Prisma Studio for database inspection
- `npm run db:seed` - Seed database with test data

### Testing Commands
- `npm test` - Run Cypress E2E tests (Chrome)
- `npm run cypress:open` - Open Cypress test runner
- `npm run test:e2e` - Run E2E tests in headless mode

## Architecture

### Tech Stack
- **Frontend**: Next.js 15.4.1 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS v4, MUI components, Radix UI primitives
- **Database**: PostgreSQL with Prisma ORM (v6.12.0)
- **State Management**: Zustand, React Query (Tanstack Query v5)
- **Authentication**: Supabase Auth with cookie-based sessions (@supabase/ssr)
- **Real-time**: Supabase Realtime for chat and live updates
- **File Storage**: Supabase Storage for images
- **Analytics**: PostHog, Vercel Analytics

### Directory Structure
- `/src/app/` - Next.js app router pages and API routes
- `/src/components/` - React components (atoms, molecules, organisms pattern)
- `/src/hooks/` - Custom React hooks for data fetching and mutations
- `/src/services/` - Business logic and database operations
- `/src/lib/` - Utility functions and configurations
- `/prisma/` - Database schema and migrations

### Key API Patterns
All API routes follow RESTful conventions:
- GET/POST `/api/[resource]` - List/Create
- GET/PUT/DELETE `/api/[resource]/[id]` - Read/Update/Delete
- Special endpoints use descriptive paths (e.g., `/api/boxes/[id]/availability`)

### Database Schema Key Models
- `profiles` - User accounts
- `stables` - Stable facilities
- `boxes` - Individual horse stalls/boxes
- `services` - Equestrian services
- `conversations` & `messages` - Messaging system
- `horses` & related tables - Horse management
- `forum_*` tables - Community forum

### Custom Hooks Pattern
The codebase uses React Query for all data fetching:
- `use[Resource]()` - Query hooks (e.g., `useBoxes()`)
- `use[Resource]Mutations()` - Mutation hooks (e.g., `useBoxMutations()`)
- Hooks are centralized in `/src/hooks/` and re-exported from `index.ts`

### Service Layer Pattern
Business logic is separated into service files:
- Services handle Prisma operations and complex business logic
- API routes are thin controllers that call service methods
- Services are located in `/src/services/`

### Image Handling
- Images uploaded to Supabase Storage
- Centralized upload through `/api/upload` endpoint
- Next.js Image component with optimization configured in `next.config.ts`
- Multiple remote patterns configured for development and production

### Environment Variables
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database URL for migrations
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key for server operations
- Various API keys for integrations (see `.env.example`)

### Supabase Configuration
Required Supabase setup:
- **Realtime enabled** on `messages` and `conversations` tables
- **Database indexes** applied from `database-indexes.sql` script
- **Authentication** configured with cookie-based sessions
- **Storage** configured for image uploads

## Important Conventions

### TypeScript
- Strict mode enabled
- Path alias `@/*` maps to `./src/*`
- Avoid `any` types - use proper typing

### Component Patterns
- Use existing UI components from `/src/components/ui/`
- Follow atoms/molecules/organisms pattern for new components
- Client components must have `"use client"` directive

### Authentication Pattern
Uses Supabase Auth with cookie-based sessions:
```typescript
// Server-side auth check (API routes)
import { requireAuth } from '@/lib/auth';
const authResult = await requireAuth();
if (authResult instanceof NextResponse) return authResult;
const user = authResult;

// Client-side requests (hooks)
fetch('/api/endpoint', {
  credentials: 'include' // Always include cookies
});
```

### API Response Pattern
All API routes should return consistent response format:
```typescript
// Success
return NextResponse.json({ data: result })

// Error
return NextResponse.json({ error: "Message" }, { status: 400 })
```

### Soft Delete Pattern
Most models use soft delete with `deletedAt` timestamp instead of hard delete.

### Real-time Features
- **Chat/Messaging**: Uses Supabase Realtime with `useRealtimeMessages` hook
- **Conversations**: Real-time updates via `useRealtimeConversations` hook
- **No Polling**: All real-time features use Supabase subscriptions, not polling
- **Optimistic Updates**: Used for forum and immediate user interactions

## Common Development Tasks

### Adding a New API Endpoint
1. Create route file in `/src/app/api/[resource]/route.ts`
2. Implement service logic in `/src/services/[resource]-service.ts`
3. Create hooks in `/src/hooks/use[Resource].ts`
4. Add types in `/src/types/[resource].ts`

### Working with Database
1. Modify schema in `/prisma/schema.prisma`
2. Run `npm run prisma:migrate:dev` to create migration
3. Run `npm run prisma:generate` to update client

### Testing Locally
1. Ensure PostgreSQL is running
2. Set up `.env.local` with required variables
3. Run `npm run dev`
4. Access at `http://localhost:3000`

### Performance Setup
1. Run `database-indexes.sql` script in Supabase SQL Editor
2. Enable Realtime on `messages` and `conversations` tables in Supabase
3. Verify no polling is occurring in browser Network tab
4. Check React Query DevTools for efficient cache patterns

## Critical Areas

### Performance Considerations
- **Image Optimization**: Configured with 31-day cache, WebP/AVIF formats, optimized sizes
- **React Query Caching**: Uses surgical cache invalidation patterns, avoid broad `.all` invalidations
- **Component Performance**: Key listing components use React.memo for render optimization
- **Database**: Optimized with performance indexes (run `database-indexes.sql` in Supabase)
- **Real-time Efficiency**: Uses Supabase Realtime instead of polling (95% fewer requests)
- **N+1 Query Prevention**: Box amenity filtering uses optimized SQL with GROUP BY/HAVING

### Security
- API routes check authentication where required
- Soft delete preserves data integrity
- Input validation on all user inputs
- Never expose sensitive data in API responses

### Mobile Responsiveness
- All components should be mobile-first
- Test on various screen sizes
- Use Tailwind responsive utilities