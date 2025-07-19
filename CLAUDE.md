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
- **Zustand**: Lightweight state management (only when needed)

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

[... rest of the existing content remains the same ...]

## Development Workflow Memories

- **Always check how things are solved previously in the project so you don't make mistakes that could be avoided.**
- **CRITICAL: ALWAYS COMMIT YOUR CODE after completing any task or making any changes.**
- **NEVER finish a task without committing the changes to git.**
- **Commit early and commit often - after every feature, fix, or significant change.**
- **Use descriptive commit messages that explain what was changed and why.**

[... rest of the existing content remains the same ...]