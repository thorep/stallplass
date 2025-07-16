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
- **Tanstack Query**: Use for data fetching

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