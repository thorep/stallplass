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

- Do not commit code.
- **Always check how things are solved previously in the project so you don't make mistakes that could be avoided.**

## Database Schema Updates

### Payment Model Security Enhancement
- **Payment table now stores both `userId` (for relations) and `firebaseId` (for backup/debugging)**
- The `firebaseId` field is a simple text field that stores a copy of the Firebase ID
- This provides redundancy in case anything goes wrong with user relations in the future
- When creating payments, always populate both fields: `userId` and `firebaseId` with the same Firebase ID value
- Migration applied: `20250719082828_add_firebase_id_to_payments`

## Admin Panel Empty Data Handling

All admin panel sections now gracefully handle empty data states:

### ✅ Fixed Admin Panel Issues
- **AdminPageClient**: Removed strict null checks that prevented loading when data was empty
- **Base Price**: API now creates default base price (10 kr) if none exists
- **Empty State Messages**: Added user-friendly messages for all sections:
  - Amenities: "Ingen stallfasiliteter/boksfasiliteter funnet. Legg til den første!"
  - Roadmap: "Ingen roadmap elementer funnet. Legg til det første!"
  - Users: "Ingen brukere funnet"
  - Stables: "Ingen staller funnet" 
  - Boxes: "Ingen bokser funnet"
  - Payments: "Ingen betalinger funnet"

### Data Loading Strategy
- Only `basePrice` is required before rendering admin dashboard
- All arrays (amenities, users, stables, etc.) default to empty arrays `[]` 
- Each section handles empty states gracefully with informative messages
- No more "loading forever" when some data sections are empty

## Testing Infrastructure ✅

The application now has a comprehensive testing setup with Jest, React Testing Library, MSW, and Playwright:

### Testing Stack
- **Jest 30.x**: Main testing framework with Next.js 15 integration
- **React Testing Library 16.x**: Component testing utilities
- **MSW (Mock Service Worker) 2.x**: API mocking for integration tests
- **Playwright**: End-to-end testing (configuration pending)
- **@testing-library/jest-dom**: Extended Jest matchers for DOM testing

### Configuration Files
- `jest.config.js`: Main Jest configuration with Next.js integration
- `jest.setup.js`: Global test setup and mocks
- `jest.polyfills.js`: Polyfills for MSW compatibility in Node.js environment
- `src/__tests__/setup/server.ts`: MSW server setup for API mocking
- `src/__tests__/utils/test-utils.tsx`: Custom render utilities with providers

### Test Organization
```
src/__tests__/
├── api/                    # API route integration tests
│   └── admin/pricing/base.test.ts
├── components/             # Component tests
│   └── PricingAdmin.test.tsx
├── services/              # Service layer unit tests
│   └── pricing-service.test.ts
├── mocks/                 # MSW handlers and mock data
│   └── handlers.ts
├── setup/                 # Test setup and configuration
│   └── server.ts
└── utils/                 # Test utilities and helpers
    └── test-utils.tsx
```

### Available Test Scripts
- `npm test`: Run all tests
- `npm run test:watch`: Run tests in watch mode
- `npm run test:coverage`: Run tests with coverage report
- `npm run test:ci`: Run tests in CI mode with coverage

### Testing Patterns

#### Unit Tests (Services)
```typescript
// src/__tests__/services/pricing-service.test.ts
import { createOrUpdateBasePrice } from '@/services/pricing-service'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: { basePrice: { findFirst: jest.fn(), create: jest.fn() } }
}))
```

#### Component Tests
```typescript
// src/__tests__/components/PricingAdmin.test.tsx
import { render, screen } from '@testing-library/react'
import { PricingAdmin } from '@/components/organisms/PricingAdmin'

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: mockUser })
}))
```

#### API Integration Tests
```typescript
// src/__tests__/api/admin/pricing/base.test.ts
import { PUT } from '@/app/api/admin/pricing/base/route'

jest.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseToken: jest.fn()
}))
```

### Mock Strategy
- **Per-test mocking**: Most mocks are configured per test file for isolation
- **Global mocks**: Only essential Next.js and Node.js polyfills are global
- **MSW handlers**: API endpoints mocked with realistic data and error scenarios
- **Firebase mocking**: Authentication context mocked per component test

### Test Coverage
- **Target Coverage**: 70% across all metrics (branches, functions, lines, statements)
- **Excluded Files**: 
  - Type definitions (`*.d.ts`)
  - Index files
  - Storybook files
  - Firebase admin (requires special setup)

### Known Issues & Workarounds
- MSW v2 requires extensive polyfills for Jest/jsdom compatibility
- Firebase client SDK requires API keys even in mocked tests
- Some component tests may need additional environment setup

### Testing Best Practices
1. **Isolation**: Each test file mocks its own dependencies
2. **Realistic Data**: Use proper TypeScript types and realistic test data
3. **Error Testing**: Test both success and error scenarios
4. **Async Handling**: Use proper async/await and waitFor patterns
5. **User-Centric**: Test from user perspective, not implementation details