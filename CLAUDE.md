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
- **Firebase**: Authentication service only
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
- **Backend Logic Separation**: Extract server-side data operations into dedicated service files
- **Code Structure**: 
  - `src/features/`: Feature-specific components and logic
  - `src/components/`: Reusable atomic design components (atoms, molecules, organisms)
  - `src/services/`: Server-side business logic and data operations (Prisma queries, data transformations)
  - `src/utils/`: Utility functions and helpers
  - `src/hooks/`: Custom React hooks
  - `src/lib/`: Configuration files (Prisma, Firebase, etc.)
- **Language**: All user-facing content must be in Norwegian

### Server-Side Logic Organization

**Services Layer (`src/services/`):**
```typescript
// src/services/stable-service.ts
export async function getAllStables() {
  return await prisma.stable.findMany({
    include: { owner: true },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getStablesByOwner(ownerId: string) {
  return await prisma.stable.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' }
  });
}
```

**Usage in Pages:**
```typescript
// src/app/staller/page.tsx
import { getAllStables } from '@/services/stable-service';

export default async function StallersPage() {
  const stables = await getAllStables();
  return <StablesList stables={stables} />;
}
```

**Benefits:**
- **Separation of Concerns**: Business logic separate from UI components
- **Reusability**: Service functions can be used across multiple pages/API routes
- **Testability**: Easy to unit test business logic independently
- **Maintainability**: Clear organization makes codebase easier to understand and modify

## Data Fetching Guidelines

The application uses a hybrid data fetching approach optimized for performance and user experience:

### Server-Side Rendering (SSR)
- **Initial page loads**: Use Next.js SSR for fast initial renders and SEO
- **Server Components**: Fetch data directly in server components using service functions
- **Static generation**: Where appropriate for stable content

### Client-Side Data Fetching
- **TanStack Query**: For all client-side data fetching and mutations
- **Real-time updates**: Use TanStack Query for data that changes frequently
- **Caching**: Configure appropriate stale times and cache invalidation

### Current Hooks
- `useAllRentals(userId)`: Fetches both renter and owner rental data
- `useMyRentals(userId)`: Fetches boxes the user is renting
- `useStableRentals(userId)`: Fetches boxes the user's stables are renting out
- `useCreateStable()`: Mutation hook for creating new stables
- `useUpdateStable()`: Mutation hook for updating stables
- `useDeleteStable()`: Mutation hook for deleting stables

### Best Practices
- Always include `enabled: !!dependency` for conditional queries
- Set appropriate `staleTime` (5 minutes for rental data)
- Use React Suspense boundaries for loading states
- Implement proper error handling in all hooks

## Database & Deployment

- **Database**: PostgreSQL hosted on Prisma.io (database name: ledigstalldb01)
- **Authentication**: Firebase Authentication (email/password only)
- **Deployment**: Vercel platform
- **Database Connection**: Installed via Vercel marketplace with Prisma Accelerate
- **Pricing**: All stable pricing should be monthly only (no weekly pricing)

## Environment Variables

For local development, create `.env.local` with:
```
# Firebase Authentication (Client-side - these can be public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAWCAYl5Wkjau-N_I10zPrrpCZmCUobfeU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stallplass.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stallplass
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stallplass.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=349529769390
NEXT_PUBLIC_FIREBASE_APP_ID=1:349529769390:web:7ae0ac83d2e6d17b83743f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0V1896Z3PZ

# Firebase Admin (Server-side - private, for server-side auth verification if needed)
# FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-xxxxx@stallplass.iam.gserviceaccount.com"

# Prisma Database (Server-side - private)
POSTGRES_URL="postgres://17fe6bd01ca21f84958b3fccab6879b74c7bfc9889361fee364683d866e52455:sk_o6byOpyNW-CElEPxF2oWE@db.prisma.io:5432/?sslmode=require"
PRISMA_DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19vNmJ5T3B5TlctQ0VsRVB4RjJvV0UiLCJhcGlfa2V5IjoiMDFLMEFBN0Q4TUU3RkRHMEJSV0s4WUMzNzEiLCJ0ZW5hbnRfaWQiOiIxN2ZlNmJkMDFjYTIxZjg0OTU4YjNmY2NhYjY4NzliNzRjN2JmYzk4ODkzNjFmZWUzNjQ2ODNkODY2ZTUyNDU1IiwiaW50ZXJuYWxfc2VjcmV0IjoiMDI1M2MwYzYtNGUyMy00NDBmLTkxMjktODVjOWY0ODJiOGVjIn0.P2p1dmZOPKrIAgpTEPnuEffMsu9Jdza-1Es3a1NDqo8"
DATABASE_URL="postgres://17fe6bd01ca21f84958b3fccab6879b74c7bfc9889361fee364683d866e52455:sk_o6byOpyNW-CElEPxF2oWE@db.prisma.io:5432/?sslmode=require"
```

**Environment Variable Security:**
- `NEXT_PUBLIC_*`: Client-side variables that are bundled into the frontend (safe to be public)
- Private variables: Server-side only, never exposed to the client
- Firebase client config is designed to be public (protected by Firebase security rules)
- Database URLs and admin keys must remain private and server-side only

## Vercel Deployment

**Required Environment Variables for Vercel:**

Add these environment variables in your Vercel dashboard (Settings → Environment Variables):

```
# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAWCAYl5Wkjau-N_I10zPrrpCZmCUobfeU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stallplass.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stallplass
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stallplass.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=349529769390
NEXT_PUBLIC_FIREBASE_APP_ID=1:349529769390:web:7ae0ac83d2e6d17b83743f
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0V1896Z3PZ

# Prisma Database (automatically set via Vercel marketplace integration)
POSTGRES_URL=[automatically configured]
PRISMA_DATABASE_URL=[automatically configured] 
DATABASE_URL=[automatically configured]
```

**Note:** Make sure to set these for Production, Preview, and Development environments in Vercel. The Prisma database URLs are automatically configured through the Vercel marketplace integration.

## Key Features Implemented

### Authentication System
- **Firebase Authentication** with email/password
- **Signup page** (`/registrer`) for stable owners
- **Login page** (`/logg-inn`) with Firebase auth
- **User management** with Firebase User accounts

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

The application uses a **hybrid approach** combining Server-Side Rendering for initial page loads and TanStack Query for client-side data fetching and mutations.

### Server-Side Data Fetching

#### Pages with SSR
- **Dashboard** (`/dashboard`): Fetches user's stables server-side for initial render
- **Stables Listing** (`/staller`): Fetches all stables directly from database
- **Stable Details** (`/staller/[id]`): Fetches individual stable data
- **Authentication**: Uses Firebase authentication for route protection

#### Server Components Pattern
```typescript
// In a server component
import { getAllStables } from '@/services/stable-service';

export default async function Page() {
  // Server-side data fetching using service layer
  const stables = await getAllStables();
  
  return <ClientComponent stables={stables} />;
}
```

### Client-Side Data Fetching

TanStack Query is used for dynamic data that changes frequently:

#### Available Query Hooks
- `useAllRentals(userId)`: Fetches both renter and owner rental data
- `useMyRentals(userId)`: Fetches boxes the user is renting
- `useStableRentals(userId)`: Fetches boxes the user's stables are renting out

#### Available Mutation Hooks
- `useCreateStable()`: Create a new stable
- `useUpdateStable()`: Update an existing stable  
- `useDeleteStable()`: Delete a stable

#### Usage Example
```typescript
// In a client component
const { myRentals, stableRentals, isLoading } = useAllRentals(user?.uid);
const deleteStable = useDeleteStable();

const handleDelete = async (id: string) => {
  await deleteStable.mutateAsync(id);
  // TanStack Query automatically invalidates related queries
};
```

### Authentication with Firebase

#### Firebase Authentication Integration
- **Server-side**: Custom Firebase verification for route protection
- **Client-side**: `useAuth()` hook for session access
- **Login/Logout**: Firebase `signIn()` and `signOut()` functions

#### Configuration
```typescript
// lib/auth-context.tsx - Client-side Firebase auth
export const useAuth = () => {
  // Firebase auth state management
  // Returns: { user, signIn, signUp, logout }
};

// services/auth-service.ts - Server-side auth verification (if needed)
export async function verifyFirebaseToken(token: string) {
  // Server-side Firebase admin SDK verification
  // Used for protecting API routes
}
```

### Benefits of This Architecture
- **Faster initial page loads** with SSR
- **Better SEO** with server-rendered content
- **Reduced client-side JavaScript** bundle size
- **Simpler state management** with fewer client-side queries
- **Better error handling** on the server side

## Security Guidelines

- Use server side rendering as much as possible where security matters
- **Firebase Authentication** handles password hashing and security
- Proper database relationships and constraints with Prisma
- **Client-side route protection** using Firebase authentication context

## Pricing Guidelines

- Pricing for stables should only be in pricing pr month.

## Development Workflow

- When doing changes or creating new features, update the CLAUDE.md memory file with new information

## Deployment

- We are deploying on Vercel.

## Database Configuration

- The database is called ledigstalldb01
- Hosted on Prisma.io, installed via Vercel marketplace

## Firebase Configuration

- **Project ID**: stallplass
- **Authentication**: Email/password enabled (authentication only)
- **Storage**: Available but not currently used

## Product Features

- Owner of stables create their stable..their stable gets like a landing page. and there they can list their individual free boxes etc.
- Regular users can view stables in a list format and see how many boxes they have free and pricing, similar to finn.no

## Terminology

- **Public Stable Page**: The page that clients/users see when viewing a stable (/staller/[id]) - this is the public-facing stable details page
- **Dashboard Stable Page**: The management page that stable owners see in their dashboard for managing their stable

## Rental Workflow

The application supports a comprehensive rental workflow from browsing to booking:

### 1. **Browse and Discover**
- Users browse stables on `/staller` (main listing page)
- Each stable has a detailed landing page at `/staller/[id]`
- Stable pages show available boxes with pricing and details

### 2. **Contact and Rental Options**
Each available box has two contact options:
- **"Kontakt om denne boksen"** - Opens message modal for box-specific inquiries
- **"Lei denne boksen"** - Opens rental confirmation modal for immediate booking

### 3. **Box-Specific Messaging**
- Conversations are created with box context (`boxId` parameter)
- Messages include box information (name, price) in the conversation
- API endpoint: `POST /api/conversations` with `boxId` field

### 4. **Direct Rental Flow**
- Users can book boxes immediately through rental confirmation modal
- Process: Creates conversation → Confirms rental → Redirects to messages
- API endpoints: 
  - `POST /api/conversations` (create conversation)
  - `POST /api/conversations/[id]/confirm-rental` (confirm rental)

### 5. **Rental Confirmation**
- Either party (rider or stable owner) can confirm rentals
- Confirmation updates:
  - Box `isAvailable` set to `false`
  - Conversation status changed to `RENTAL_CONFIRMED`
  - Creates rental record with `ACTIVE` status
  - Generates system message in conversation

### 6. **Box Availability Management**
- Boxes have two states: `isActive` (advertised) and `isAvailable` (not rented)
- Only boxes that are both active and available are shown to users
- Rental confirmation automatically removes boxes from listings

### 7. **Messaging System**
- Comprehensive messaging system at `/meldinger`
- Real-time message polling with unread count badges
- Box-specific conversations with rental context
- Rental confirmation workflow within messages

### 8. **Notification System**
- Header shows unread message count with red notification badge
- Polling every 30 seconds for new messages
- Works on both desktop and mobile interfaces

## Mobile-First Development

**CRITICAL**: This application must be mobile-first. The majority of users will access the platform on mobile devices.

### Mobile-First Design Principles

1. **Start with Mobile Layout**: Always design and implement for mobile screens first, then enhance for larger screens
2. **Touch-First Interactions**: All buttons, links, and interactive elements must be optimized for touch (minimum 44px touch targets)
3. **Simplified Navigation**: Mobile navigation should be collapsible with a hamburger menu
4. **Vertical Layouts**: Stack content vertically on mobile, use horizontal layouts only on larger screens
5. **Readable Typography**: Use appropriate font sizes for mobile (minimum 16px for body text to prevent zoom)
6. **Thumb-Friendly Design**: Place primary actions within easy thumb reach

### Responsive Breakpoints (Tailwind CSS)

- **Mobile First**: Base styles (no prefix) - 0px and up
- **Small**: `sm:` - 640px and up
- **Medium**: `md:` - 768px and up  
- **Large**: `lg:` - 1024px and up
- **Extra Large**: `xl:` - 1280px and up

### Implementation Guidelines

**Component Structure**:
```tsx
// CORRECT: Mobile-first approach
<div className="p-4 sm:p-6 lg:p-8">
  <h1 className="text-2xl sm:text-3xl font-bold">Title</h1>
  <div className="flex flex-col md:flex-row gap-4">
    <!-- Mobile: stacked, Desktop: side-by-side -->
  </div>
</div>

// INCORRECT: Desktop-first approach
<div className="p-8 sm:p-4">
  <h1 className="text-3xl sm:text-2xl font-bold">Title</h1>
</div>
```

**Navigation**:
- Hide desktop navigation on mobile (`hidden md:flex`)
- Show mobile menu button on mobile (`md:hidden`)
- Full-width buttons on mobile (`w-full sm:w-auto`)

**Cards and Listings**:
- Stack content vertically on mobile
- Use full-width buttons on mobile
- Optimize spacing for touch interaction
- Show fewer amenities/features on mobile to avoid clutter

**Forms**:
- Larger input fields on mobile (`py-3 sm:py-2`)
- Full-width buttons on mobile
- Appropriate input types for mobile keyboards

**Images**:
- Always use Next.js Image component for optimization
- Provide appropriate sizes for different screen sizes
- Consider mobile data usage

### Testing Requirements

- Test on actual mobile devices, not just browser dev tools
- Ensure all functionality works with touch only
- Verify text is readable without zooming
- Check that buttons and links are easily tappable
- Confirm forms work well with mobile keyboards

### Performance Considerations

- Minimize initial bundle size for mobile users
- Use lazy loading for images
- Implement proper caching strategies
- Consider offline functionality for core features

This mobile-first approach is essential for user adoption in the Norwegian market where mobile usage is extremely high.

## Development Workflow Memories

- Do not commit code.

## Color System

The app uses a modern indigo-based color scheme with slate grays and equestrian accent colors.

### Primary Colors
- **Primary**: `#6366f1` (indigo) - Main brand color for buttons, links, and CTAs
- **Primary Hover**: `#4f46e5` (deeper indigo) - Hover states
- **Primary Light**: `#e0e7ff` (light indigo) - Backgrounds and subtle accents

### Secondary Colors
- **Secondary**: `#059669` (emerald) - Secondary actions and success states
- **Secondary Hover**: `#047857` (deeper emerald)
- **Secondary Light**: `#d1fae5` (light emerald)

### Accent Colors
- **Accent**: `#f59e0b` (amber) - Highlights and featured content
- **Accent Leather**: `#a56a32` - Equestrian warmth for pricing and categories
- **Accent Meadow**: `#4daa57` - Availability and positive metrics

### Semantic Colors
- **Success**: `#10b981` (green) - Available stalls, confirmations
- **Warning**: `#f59e0b` (amber) - Alerts and cautionary states
- **Error**: `#ef4444` (red) - Errors and unavailable states
- **Info**: `#3b82f6` (blue) - Informational content

### Neutral Scale (Slate)
- **Slate 50**: `#f8fafc` - App background
- **Slate 100**: `#f1f5f9` - Card backgrounds
- **Slate 200**: `#e2e8f0` - Borders and dividers
- **Slate 300**: `#cbd5e1` - Subtle borders
- **Slate 400**: `#94a3b8` - Muted text
- **Slate 500**: `#64748b` - Secondary text
- **Slate 600**: `#475569` - Labels
- **Slate 700**: `#334155` - Primary text
- **Slate 800**: `#1e293b` - Headings
- **Slate 900**: `#0f172a` - High contrast text

### Dark Mode
The app supports automatic dark mode using `prefers-color-scheme`. Dark mode uses:
- **Primary**: `#818cf8` (lighter indigo)
- **Background**: `#020617` (slate 950)
- **Surface**: `#0f172a` (slate 900)
- **Text**: `#f1f5f9` (slate 100)

### Usage in Code
Use Tailwind classes: `bg-indigo-600`, `text-slate-700`, `border-slate-200`
Or CSS variables: `var(--color-primary)`, `var(--slate-500)`

## Implementation Status ✅

**Data Fetching Architecture:**
- ✅ TanStack Query for client-side data fetching and mutations
- ✅ Server-side rendering for initial page loads
- ✅ Custom hooks for rental data (`useAllRentals`, `useMyRentals`, `useStableRentals`)
- ✅ Caching and stale-time configuration for optimal performance

**Color System:**
- ✅ Modern indigo-based color palette with slate grays
- ✅ Equestrian accent colors (leather, meadow) for branding
- ✅ Automatic dark mode support via `prefers-color-scheme`
- ✅ CSS variables for theme consistency
- ✅ Accessible color contrast ratios

**Dashboard Features:**
- ✅ Clear separation between renter and owner perspectives
- ✅ "Mine leieforhold" shows boxes user is renting
- ✅ "Utleide bokser" shows boxes stable owner is renting out
- ✅ Option to hide stable owner features for renters
- ✅ Real-time rental data with TanStack Query

**Component Architecture:**
- ✅ Atomic design principles (atoms, molecules, organisms)
- ✅ Mobile-first responsive design
- ✅ TypeScript for type safety
- ✅ Proper error handling and loading states

## Current Architecture ✅

**Authentication System:**
- ✅ Firebase Authentication for email/password sign-in and registration
- ✅ Created Firebase authentication context (`src/lib/auth-context.tsx`)
- ✅ Login page uses Firebase authentication (`/logg-inn`)
- ✅ Registration page uses Firebase authentication (`/registrer`)
- ✅ Header component uses Firebase authentication state

**Data Layer:**
- ✅ PostgreSQL database hosted on Prisma.io (ledigstalldb01)
- ✅ Prisma ORM for database operations
- ✅ Server-side rendering for data fetching
- ✅ TanStack Query for client-side mutations only

**Current Flow:**
1. Users register with email/password via Firebase on `/registrer`
2. Firebase creates user account with display name
3. Users can log in via Firebase on `/logg-inn`
4. Data operations use Prisma + PostgreSQL
5. Dashboard and pages fetch data server-side
6. Stable creation uses client-side mutations

**Environment Variables:**
- Firebase: Authentication configuration
- Prisma: Database connection strings (PostgreSQL)
- Vercel: Automatic database integration via marketplace