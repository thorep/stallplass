# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and API route handlers (`api/*`).
- `src/components`: Reusable UI split into `atoms/`, `molecules/`, `organisms/`, `ui/`.
- `src/lib`: Auth, logging, server utils, validation, OpenAPI (`src/lib/swagger.ts`).
- `src/services`, `src/hooks`, `src/types`, `src/utils`: Domain logic and helpers.
- `prisma`: `schema.prisma`, `migrations/`, `seed.ts` (client output in `src/generated/prisma`).
- `public`: Static assets. `supabase/`: local config + functions. `scripts/`: utilities.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev on `http://localhost:3000` (Turbopack).
- `npm run build` / `npm start`: Production build and start.
- `npm run lint`: ESLint (Next.js TypeScript rules). Fix issues before PR.
- `npm run test` / `npm run test:e2e`: Cypress headless E2E.
- `npm run cypress:open`: Interactive Cypress.
- `npm run prisma:migrate:dev` / `:deploy`: Apply Prisma migrations (dev/prod).
- `npm run db:seed`: Seed local DB. Example: `node scripts/create-test-forum-category.js`.
- End‑to‑end check: `./run-tests.sh` (validates Supabase + dev server, then runs tests).

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Path alias `@/*` (e.g., `@/lib/utils`).
- Components: PascalCase `.tsx` in `src/components/*`. Server/lib code as `.ts`.
- Routes: Kebab-case segment folders under `src/app/*`.
- Styling: Tailwind CSS v4; prefer utility-first classes; configure in `tailwind.config.js`.
- Linting: `eslint-config-next` (`next/core-web-vitals`, `next/typescript`).

## Testing Guidelines
- Framework: Cypress (E2E). Specs under `cypress/e2e/*.cy.ts` or `*.spec.ts`.
- Base URL: `http://localhost:3000`.
- Ensure Supabase and the dev server are running. Prefer `./run-tests.sh` locally.

## Commit & Pull Request Guidelines
- Commits: Short, imperative summaries (often Norwegian). No strict Conventional Commits.
- PRs: Clear description, linked issues, screenshots/GIFs for UI changes.
- Database: Call out Prisma schema/migration changes and include seed/rollback notes.
- Quality gates: Run `npm run lint` and `npm run build`; add/update tests when relevant.

## Security & Configuration
- Env: Copy `.env.example` to `.env.local` for dev. Prisma uses `DATABASE_URL`/`DIRECT_URL`.
- Node: Use Node 22.x. Deployment via Vercel (`vercel.json`).

## Architecture Overview
Browser (React 19) → Next.js App Router → Prisma Client → Supabase Postgres. Edge/Serverless via Vercel. PostHog analytics from the app layer.
