# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and route handlers (`api/*`).
- `src/components`: Reusable UI split into `atoms/`, `molecules/`, `organisms/`, `ui/`.
- `src/lib`: Auth, logging, server utils, validation, and integrations.
- `src/services`, `src/hooks`, `src/types`, `src/utils`: Domain logic and helpers.
- `prisma`: `schema.prisma`, `migrations/`, and `seed.ts` (output to `src/generated/prisma`).
- `public`: Static assets. `supabase/`: local config and functions. `scripts/`: utilities.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev server on `localhost:3000` (Turbopack).
- `npm run build` / `npm start`: Production build and start.
- `npm run lint`: ESLint with Next.js TypeScript config.
- `npm run test` or `npm run test:e2e`: Run Cypress in headless mode.
- `npm run cypress:open`: Open Cypress runner.
- `npm run prisma:migrate:dev` / `:deploy`: Apply migrations (dev/prod). 
- `npm run db:seed`: Seed local DB. Example: `node scripts/create-test-forum-category.js`.
- End-to-end check: `./run-tests.sh` (verifies Supabase and dev server, then runs tests).

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Path alias `@/*` (e.g., `@/lib/utils`).
- Components: PascalCase files in `src/components/*` (`.tsx`). Server/lib code as `.ts`.
- Routes: Kebab-case segment folders under `src/app/*`.
- Styling: Tailwind CSS v4; prefer utility-first classes and config in `tailwind.config.js`.
- Linting: ESLint (`next/core-web-vitals`, `next/typescript`). Fix issues before committing.

## Testing Guidelines
- Framework: Cypress for E2E (`cypress.config.ts`, baseUrl `http://localhost:3000`).
- Place specs under `cypress/e2e/*.cy.ts` or `*.spec.ts`.
- Run interactive `npm run cypress:open` during development; headless in CI with `npm run test`.
- Ensure local DB and app are running; prefer `./run-tests.sh` locally.

## Commit & Pull Request Guidelines
- Commits: Short, imperative summaries (often Norwegian), no strict Conventional Commits.
- PRs: Include clear description, linked issues, and screenshots/GIFs for UI changes.
- Database: Call out Prisma schema or migration changes and provide seed/rollback notes.
- Quality gates: Run `npm run lint` and `npm run build` locally; add/update tests when relevant.

## Security & Configuration
- Env: Copy `.env.example` to `.env.local` for dev. Prisma uses `DATABASE_URL`/`DIRECT_URL`.
- Node: Use Node `22.x` (see `package.json`). Deployment via Vercel (`vercel.json`).

## Architecture Overview
```mermaid
flowchart TD
  A[Browser (React 19)] --> B[Next.js App Router]
  B -->|API routes / server actions| C[Prisma Client]
  C --> D[(Supabase Postgres)]
  B --> E[PostHog Analytics]
  B --> F[Vercel Edge/Serverless]
```
- Data model: `prisma/schema.prisma` → generated client in `src/generated/prisma`.
- Auth/session: `src/lib/server-auth.ts`, `src/lib/supabase-auth-context.tsx`.
- API: Handlers under `src/app/api/*` (OpenAPI via `src/lib/swagger.ts`).

## Local Dev Topology
```mermaid
flowchart LR
  Dev[(Developer Machine)] -->|runs| Next[Next.js dev server :3000]
  Dev -->|manages| Supa[Supabase (Postgres+Auth) :54322]
  Next <-->|E2E| Cypress[Cypress Runner]
  Next --> Prisma[Prisma CLI]
  Prisma --> Supa
```
- Start dev: `npm run dev`; ensure Supabase is up before E2E.
- E2E: `./run-tests.sh` validates Supabase and dev server, then runs Cypress.

## Quick Links
- Prisma schema: `prisma/schema.prisma`, seed: `prisma/seed.ts`.
- E2E config: `cypress.config.ts`; runner: `npm run cypress:open`.
- Test helper: `run-tests.sh`; sample data: `scripts/create-test-forum-category.js`.
- Swagger/OpenAPI: `src/lib/swagger.ts`.
- Auth/session: `src/lib/server-auth.ts`, `src/lib/supabase-auth-context.tsx`.
- App shell: `src/app/layout.tsx`, home: `src/app/page.tsx`.
