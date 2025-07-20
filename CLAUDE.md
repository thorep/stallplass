This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 project called "stallplass" that uses React 19, TypeScript, and Tailwind CSS 4. The project was bootstrapped with `create-next-app` and follows the App Router pattern.

## Development Commands

- `npm run dev`: Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check for code issues

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

## Testing Requirements

- **CRITICAL: ALWAYS UPDATE TESTS when changing application functionality.**
- **If you modify a component, API route, or user flow, you MUST update the corresponding tests.**
- **For unit tests**: Update Jest tests in `src/__tests__/` when changing components or services.
- **For E2E tests**: Update Playwright tests in `tests/e2e/` when changing user workflows or UI.
- **When adding new features**: Create new test files to cover the functionality.
- **When fixing bugs**: Add regression tests to prevent the bug from reoccurring.
- **Test types to maintain**:
  - Unit tests for components, services, and utilities
  - Integration tests for API routes
  - E2E tests for complete user journeys
- **Always run tests before committing**: `npm run test` and `npm run test:e2e`

## Database Management (Supabase)

This project uses **Supabase** for database management, replacing the previous Prisma setup. All database operations now use Supabase's JavaScript client with real-time capabilities.

### Local Development Setup

1. **Start Supabase locally**: `supabase start`
   - API URL: http://127.0.0.1:54321
   - Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
   - Studio URL: http://127.0.0.1:54323

2. **Database migrations**: All schema changes are managed through Supabase migrations in `supabase/migrations/`
   - Create new migration: `supabase migration new <name>`
   - Apply migrations: `supabase db reset` (includes seeding)
   - Generate TypeScript types: `supabase gen types typescript --local > src/types/supabase.ts`

3. **Real-time features**: The project includes real-time chat functionality using Supabase subscriptions
   - Messages and conversations update in real-time
   - Uses `useRealTimeChat` hook for chat components
   - Subscriptions are automatically managed for optimal performance

### Supabase Services

- **User Service** (`src/services/user-service.ts`): User CRUD operations
- **Chat Service** (`src/services/chat-service.ts`): Real-time messaging with subscriptions
- **Supabase Client** (`src/lib/supabase.ts`): Centralized client configuration with TypeScript types

### Migration from Prisma

- All Prisma models have been converted to Supabase SQL schema
- TypeScript types are auto-generated from the database schema
- Row Level Security (RLS) is enabled for data protection
- Real-time subscriptions are enabled for chat functionality
- All services have been updated to use the Supabase client

### Environment Variables

Required for production deployment:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for server-side operations

### Database Commands

- `supabase start`: Start local Supabase stack
- `supabase stop`: Stop local Supabase stack
- `supabase db reset`: Reset database and apply all migrations
- `supabase migration new <name>`: Create new migration file
- `supabase gen types typescript --local`: Generate TypeScript types