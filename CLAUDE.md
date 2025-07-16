# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 project called "stallplass" that uses React 19, TypeScript, and Tailwind CSS 4. The project was bootstrapped with `create-next-app` and follows the App Router pattern.

## Development Commands

- `npm run dev`: Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build`: Build the application for production
- `npm start`: Start the production server
- `npm run lint`: Run ESLint to check for code issues

## Project Structure

- `src/app/`: Next.js App Router directory containing pages and layouts
  - `layout.tsx`: Root layout with Geist font configuration
  - `page.tsx`: Home page component
  - `globals.css`: Global styles including Tailwind CSS
- `public/`: Static assets (SVG icons for Next.js, Vercel, etc.)
- TypeScript configuration uses path aliases (`@/*` maps to `./src/*`)

## Key Technologies

- **Next.js 15**: React framework with App Router
- **React 19**: Latest React version
- **TypeScript**: Strict mode enabled
- **Tailwind CSS 4**: Utility-first CSS framework with PostCSS
- **Turbopack**: Used for faster development builds
- **Geist Font**: Custom font family from Vercel
- **TanStack Query**: Client-side data fetching and caching
- **Prisma**: Database ORM with PostgreSQL
- **NextAuth.js**: Authentication with session management
- **Heroicons**: React icon library

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

## Architecture Guidelines

- **Component Organization**: Use atomic design principles for reusable components
- **Features Folder**: Main functionality should be organized in a features folder
- **Clean Components**: React components should be clean and focused
- **Logic Separation**: Extract logic into utils, helper functions, or custom hooks
- **Data Fetching**: Use TanStack Query for client-side data fetching
- **Server-Side Rendering**: Use SSR as much as possible where security matters
- **Code Structure**: 
  - `src/features/`: Feature-specific components and logic
  - `src/components/`: Reusable atomic design components (atoms, molecules, organisms)
  - `src/utils/`: Utility functions and helpers
  - `src/hooks/`: Custom React hooks
- **Language**: All user-facing content must be in Norwegian

## Data Fetching Guidelines

- Use TanStack Query for all data fetching and posting
- Create reusable hooks for data operations, such as:
  - `useGetStables`: Hook to fetch and manage stable data across the application
  - Develop hooks that can be easily reused across different components and pages

## Database & Deployment

- **Database**: PostgreSQL hosted on Prisma.io (database name: ledigstalldb01)
- **Deployment**: Vercel platform
- **Database Connection**: Installed via Vercel marketplace with Prisma Accelerate
- **Pricing**: All stable pricing should be monthly only (no weekly pricing)

## Environment Variables

For local development, create `.env.local` with:
```
POSTGRES_URL="postgres://17fe6bd01ca21f84958b3fccab6879b74c7bfc9889361fee364683d866e52455:sk_o6byOpyNW-CElEPxF2oWE@db.prisma.io:5432/?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19vNmJ5T3B5TlctQ0VsRVB4RjJvV0UiLCJhcGlfa2V5IjoiMDFLMEFBN0Q4TUU3RkRHMEJSV0s4WUMzNzEiLCJ0ZW5hbnRfaWQiOiIxN2ZlNmJkMDFjYTIxZjg0OTU4YjNmY2NhYjY4NzliNzRjN2JmYzk4ODkzNjFmZWUzNjQ2ODNkODY2ZTUyNDU1IiwiaW50ZXJuYWxfc2VjcmV0IjoiMDI1M2MwYzYtNGUyMy00NDBmLTkxMjktODVjOWY0ODJiOGVjIn0.P2p1dmZOPKrIAgpTEPnuEffMsu9Jdza-1Es3a1NDqo8"
DATABASE_URL="postgres://17fe6bd01ca21f84958b3fccab6879b74c7bfc9889361fee364683d866e52455:sk_o6byOpyNW-CElEPxF2oWE@db.prisma.io:5432/?sslmode=require"
```

## Key Features Implemented

### Authentication System
- **Signup page** (`/registrer`) for stable owners with username/password
- **Password hashing** using bcryptjs
- **User roles** (USER, STABLE_OWNER, ADMIN)
- **Database schema** with proper user-stable relationships

### Dashboard for Stable Owners
- **Management interface** (`/dashboard`) for stable owners
- **Statistics overview** showing total stables, available spaces, etc.
- **Stable management** with add/edit/delete functionality (placeholder)
- **Responsive design** with proper mobile support

### Public Listing Page
- **Browse all stables** (`/staller`) in list format similar to Finn.no
- **Advanced filtering** with location, price range, amenities, availability
- **Detailed stable cards** showing all relevant information
- **Contact information** with phone/email links
- **Server-side rendering** for better SEO and performance

### Component Structure
- **Atomic design** with atoms, molecules, and organisms
- **StableListingCard** for detailed stable information display
- **SearchFilters** component for advanced filtering
- **Updated Header** with proper navigation and authentication links

## Data Fetching Architecture

The application uses **Server Side Rendering (SSR)** as the primary data fetching strategy with TanStack Query for mutations only.

### Server-Side Data Fetching

#### Pages with SSR
- **Dashboard** (`/dashboard`): Fetches user's stables using `getServerSession` and Prisma
- **Stables Listing** (`/staller`): Fetches all stables directly from database
- **Authentication**: Uses `getServerSession` for route protection

#### Server Components Pattern
```typescript
// In a server component
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/logg-inn');
  }

  const data = await prisma.stable.findMany({
    where: { ownerId: session.user.id }
  });

  return <ClientComponent data={data} />;
}
```

### Client-Side Mutations Only

TanStack Query is used exclusively for mutations (create, update, delete operations):

#### Available Mutation Hooks
- `useCreateStable()`: Create a new stable
- `useUpdateStable()`: Update an existing stable  
- `useDeleteStable()`: Delete a stable

#### Usage Example
```typescript
// In a client component
const deleteStable = useDeleteStable();
const router = useRouter();

const handleDelete = async (id: string) => {
  await deleteStable.mutateAsync(id);
  router.refresh(); // Refresh SSR data
};
```

### Authentication with NextAuth.js

#### Official NextAuth.js Patterns
- **Server-side**: `getServerSession(authOptions)` for route protection
- **Client-side**: `useSession()` hook for session access
- **Login/Logout**: `signIn()` and `signOut()` functions

#### Configuration
```typescript
// lib/auth.config.ts
export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider(...)],
  callbacks: { ... },
  pages: { signIn: '/logg-inn' }
};
```

### Benefits of This Architecture
- **Faster initial page loads** with SSR
- **Better SEO** with server-rendered content
- **Reduced client-side JavaScript** bundle size
- **Simpler state management** with fewer client-side queries
- **Better error handling** on the server side

## Security Guidelines

- Use server side rendering as much as possible where security matters
- Password hashing with bcryptjs
- Proper database relationships and constraints
- Session-based authentication with NextAuth.js

## Pricing Guidelines

- Pricing for stables should only be in pricing pr month.

## Development Workflow

- When doing changes or creating new features, update the CLAUDE.md memory file with new information

## Deployment

- We are deploying on Vercel.

## Database Configuration

- The database is called ledigstalldb01
- Hosted on Prisma.io, installed via Vercel marketplace

## Product Features

- Owner of stables create their stable..their stable gets like a landing page. and there they can list their individual free boxes etc.
- Regular users can view stables in a list format and see how many boxes they have free and pricing, similar to finn.no

## Mobile-First Development

- The site needs to be mobile first. I think most users will use it on mobile. Tailwind css can solve this.

## Development Workflow Memories

- Do not commit code.