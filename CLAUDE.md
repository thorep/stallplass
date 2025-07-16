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
- **TanStack Query**: Use for data fetching
- **Prisma**: Database ORM with PostgreSQL
- **Heroicons**: React icon library

## Product Concept

Stallplass is a Norwegian platform for horse stable management and discovery:
- Stables can create profiles with detailed listings of available spaces
- Features include pictures, descriptions, pricing, and other information
- Stables require login to manage their profile
- Users can browse stable listings without requiring login
- Two-way star rating system between stables and horse owners
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

## Code Design Principles

- React components should be clean
  - Main functionality should be in the features folder
  - Use atomic design for reusable components
  - Move logic to utils or helper functions/hooks

## Security Guidelines

- Use server side rendering as much as possible where security matters

## Product Concept

- Stallplass is a Norwegian platform for horse stable management and discovery
- Allows stables to create profiles with detailed listings of available spaces
- Features include:
  - Stable owners can create and administrate their stable profile
  - Listings include pictures, descriptions, pricing, and other relevant information
  - Stables require login to manage their profile
  - Users can browse stable listings without requiring login
  - Two-way star rating system between stables and horse owners
  - Fully localized in Norwegian
  - Target audience: Horse owners and stable managers in Norway

## Pricing Guidelines

- Pricing for stables should only be in pricing pr month.

## Development Workflow

- When doing changes or creating new features, update the CLAUDE.md memory file with new information

## Deployment

- We are deploying on Vercel.

## Database Configuration

- The database is called ledigstalldb01
- Hosted on Prisma.io, installed via Vercel marketplace