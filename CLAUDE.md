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

## Color System & Brand Guidelines

This section provides comprehensive guidance for the StableSpace (Stallplass) brand and UI color palette for use in UI components, CSS variables, Tailwind config, and design systems.

### Brand Positioning

**Product**: Online marketplace + management tool for boarding, leasing, and renting horse stalls / stable space.

**Tone**: Trustworthy, practical marketplace + warm, rural equestrian personality.

**Audience**:
- Horse owners looking for available stalls / short- or long-term boarding
- Stable managers listing capacity, amenities, and pricing
- Secondary: Trainers, riding clubs, equestrian event hosts

**Emotional Targets**: Reliable (like a major classifieds brand), grounded in nature (pastures, wood, leather), friendly community.

### Palette Strategy

We blend a clean Nordic marketplace blue (trust, clarity, CTA visibility) with equine materials + landscape accents (saddle leather, meadow green, harvest gold, barn red). The blue anchors UI clarity; earth tones provide category-level meaning and emotional context without muddying the interface.

### Core Color Tokens

**Brand / Action Colors**:
- `--color-primary`: `#0077CC` - Core brand color. Primary CTA buttons (Book Stall, Post Listing), links, active state highlights
- `--color-primary-hover`: `#005FA5` - Hover / focus / active states
- `--color-accent-leather`: `#A56A32` - Equestrian warmth: listing category chips, price accents, secondary pill
- `--color-accent-meadow`: `#4DAA57` - Availability / success / positive metrics

**Semantic / Status Colors**:
- `--color-success`: `#4DAA57` - Stall available; success toasts
- `--color-warning`: `#E0A100` - Low availability, expiring reservation, cautions
- `--color-error`: `#C43D3D` - Stall full, booking failed, form validation errors
- `--color-info`: `#0077CC` - Informational alerts, inline guidance

**Neutral Scale**:
- `--gray-0`: `#FFFFFF` - Cards, surfaces, text-on-color
- `--gray-50`: `#F9FAFA` - App background
- `--gray-100`: `#F1F3F4` - Section backgrounds, hover rows
- `--gray-300`: `#D0D4D9` - Borders, dividers
- `--gray-500`: `#8A9099` - Secondary text, meta labels
- `--gray-700`: `#4A4F57` - Primary body text on light
- `--gray-900`: `#1E2125` - Headings, high-contrast text, dark surfaces

### Dark Mode Tokens

**Dark Mode Equivalents**:
- `--gray-0` → `#0F1113`
- `--gray-50` → `#1A1D20`
- `--gray-100` → `#262A2F`
- `--gray-300` → `#444A52`
- `--gray-500` → `#7E848E`
- `--gray-700` → `#B3B8C0`
- `--gray-900` → `#FFFFFF`
- `--color-primary` → `#5BB1FF`
- `--color-primary-hover` → `#7CC1FF`
- `--color-accent-leather` → `#D58D53`
- `--color-accent-meadow` → `#7EDC84`

### CSS Variables Implementation

```css
:root {
  /* Brand */
  --color-primary: #0077cc;
  --color-primary-hover: #005fa5;
  --color-accent-leather: #a56a32;
  --color-accent-meadow: #4daa57;

  /* States */
  --color-success: #4daa57;
  --color-warning: #e0a100;
  --color-error: #c43d3d;
  --color-info: #0077cc;

  /* Neutrals */
  --gray-0: #ffffff;
  --gray-50: #f9fafa;
  --gray-100: #f1f3f4;
  --gray-300: #d0d4d9;
  --gray-500: #8a9099;
  --gray-700: #4a4f57;
  --gray-900: #1e2125;
}

@media (prefers-color-scheme: dark) {
  :root {
    --gray-0: #0f1113;
    --gray-50: #1a1d20;
    --gray-100: #262a2f;
    --gray-300: #444a52;
    --gray-500: #7e848e;
    --gray-700: #b3b8c0;
    --gray-900: #ffffff;

    --color-primary: #5bb1ff;
    --color-primary-hover: #7cc1ff;
    --color-accent-leather: #d58d53;
    --color-accent-meadow: #7edc84;
  }
}
```

### Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
        },
        leather: "var(--color-accent-leather)",
        meadow: "var(--color-accent-meadow)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
        info: "var(--color-info)",
        gray: {
          0: "var(--gray-0)",
          50: "var(--gray-50)",
          100: "var(--gray-100)",
          300: "var(--gray-300)",
          500: "var(--gray-500)",
          700: "var(--gray-700)",
          900: "var(--gray-900)",
        },
      },
    },
  },
}
```

### Usage Guidelines by UI Pattern

**CTAs & Links**:
- Primary button backgrounds: `--color-primary`
- Hover/active: `--color-primary-hover`
- Text on primary: `--gray-0` (white)
- Disabled states drop opacity + shift to `--gray-300` background

**Listing Cards**:
- Surface: `--gray-0` on `--gray-50` page background
- Title text: `--gray-900`
- Price chip: `--color-accent-leather` background, `--gray-0` text
- Availability dot/badge: map to semantic (green/yellow/red)

**Availability Calendar**:
- Available: `--color-success`
- Limited: `--color-warning`
- Full / Booked: `--color-error`
- Your Reservation: overlay ring in `--color-primary`

**Filters / Facets**:
- Selected filter chip: outline + text `--color-primary`; filled on hover
- Inactive chip: `--gray-100` background, `--gray-700` text

**Error Messaging**:
- Banner background: translucent `--color-error` @ ~10–15% alpha
- Icon / left stripe: solid `--color-error`
- Text: `--gray-900` (light mode) / `--gray-0` (dark mode)

### Accessibility & Contrast Rules

**Minimum Contrast**:
- Body text < 18px regular: 4.5:1
- Large text ≥ 18px regular or 14px bold: 3:1

**Buttons**: Ensure text on `--color-primary` >=4.5:1 (white on #0077CC ~4.7:1 OK)

**Color Alone**: Do not rely solely on color to indicate availability; pair icons, text labels ("3 stalls left"), or patterns.

### Motion / State Feedback

- Hover lift (2–4px translateY-/shadow) on cards
- Color fade between status states (~150ms ease)
- Success check pulse using `--color-success`
- Colors should animate between tokens, not raw hex values

### Implementation Notes

- Use tokens in code (CSS vars, Tailwind theme extensions, design tokens JSON)
- Do not hardcode hex values in components—always reference tokens
- Use CSS variables to enable instant theme switching (light/dark, white-label partner)
- Tailwind picks up variables without rebuild when variables change at runtime