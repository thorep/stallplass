# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and server actions.
- `src/components`: Reusable UI (`atoms/`, `molecules/`, `organisms/`, `ui/`), `.tsx`.
- `src/lib`: Auth, logging, server utils, validation.
- `src/services`, `src/hooks`, `src/types`, `src/utils`: Domain logic and helpers.
- `prisma`: `schema.prisma`, `migrations/`, `seed.ts`. Generated client in `src/generated/prisma`.
- `public/`: static assets. `supabase/`: local config/functions. `scripts/`: utilities.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev on `http://localhost:3000` (Turbopack).
- `npm run build` / `npm start`: Production build then run.
- `npm run lint`: ESLint (Next.js + TypeScript). Fix all warnings before PR.
- `npm run prisma:migrate:dev` / `npm run prisma:migrate:deploy`: Apply Prisma migrations.
- `npm run db:seed`: Seed local DB (e.g., `node scripts/create-test-forum-category.js`).
- `npm run cy:run`: Run Cypress E2E (expects app already running).
- `npm run e2e:dev:run`: Start dev server and run E2E.

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Path alias `@/*` (e.g., `@/lib/utils`).
- Components: PascalCase `.tsx` under `src/components/*`. Server/lib code: `.ts`.
- Routes: Kebab-case folders under `src/app/*`.
- Styling: Tailwind CSS v4; prefer utility-first classes. Configure in `tailwind.config.js`.
- Linting: `eslint-config-next` (`next/core-web-vitals`, `next/typescript`).

## Testing Guidelines
- Framework: Cypress v15 E2E. Default viewport iPhone 12 (390×844) from `cypress.config.ts`.
- Selectors: add `data-cy` hooks for stable mobile selection.
- Reporting: CTRF JSON via `cypress-ctrf-json-reporter` → `cypress/results/results.json`.
- Commands: `npm run cy:run` or `npm run e2e:dev:run`. Keep tests fast and deterministic.

## Commit & Pull Request Guidelines
- Commits: Short, imperative summaries (often Norwegian). Scope clearly.
- PRs: Include description, linked issues, and screenshots/GIFs for UI changes.
- Database: Call out Prisma schema/migration updates with seed/rollback notes.
- Quality gates: Run `npm run lint` and `npm run build`; add/update tests as needed.

## Server Actions & Data Fetching
- **Always use Server Actions** for form submissions, mutations, and data operations
- **Server Components** for initial data fetching - avoid client-side data fetching when possible
- **Server Actions** for user interactions that need to mutate data
- **API Routes** only for external APIs or when Server Actions cannot be used
- **Benefits**: Better performance, automatic request deduplication, reduced client bundle size, improved security

## Security & Configuration
- Env: Copy `.env.example` → `.env.local`. Prisma uses `DATABASE_URL`/`DIRECT_URL`.
- Node: Use Node 22.x. Deploy via Vercel (`vercel.json`).

## Architecture Overview
- React 19 (browser) → Next.js App Router → Server Actions + Server Components → Prisma Client → Supabase Postgres; Edge/Serverless via Vercel. PostHog analytics from the app layer.
- **Data Fetching Strategy**: Always use Server Actions for mutations and server-side data fetching. Avoid client-side API calls - fetch data directly in Server Components or Server Actions.
- **API Routes**: Only use for external integrations or when Server Actions are not suitable. Prefer Server Actions for internal data operations.
- **Migration Note**: Moving away from traditional API routes to Server Actions for better performance and developer experience.

