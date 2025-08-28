# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages, layouts, and API handlers (`api/*`).
- `src/components`: Reusable UI (`atoms/`, `molecules/`, `organisms/`, `ui/`), `.tsx`.
- `src/lib`: Auth, logging, server utils, validation, OpenAPI in `src/lib/swagger.ts`.
- `src/services`, `src/hooks`, `src/types`, `src/utils`: Domain logic and helpers.
- `prisma`: `schema.prisma`, `migrations/`, `seed.ts`; generated client in `src/generated/prisma`.
- `public/`: static assets. `supabase/`: local config + functions. `scripts/`: utilities.

## Build, Test, and Development Commands
- `npm run dev`: Start local dev on `http://localhost:3000` (Turbopack).
- `npm run build` / `npm start`: Production build and start.
- `npm run lint`: ESLint (Next.js TypeScript rules). Fix before PR.
- `npm run prisma:migrate:dev` / `:deploy`: Apply Prisma migrations (dev/prod).
- `npm run db:seed`: Seed local DB (e.g., `node scripts/create-test-forum-category.js`).
 

## Coding Style & Naming Conventions
- Language: TypeScript (strict). Use path alias `@/*` (e.g., `@/lib/utils`).
- Components: PascalCase `.tsx` under `src/components/*`. Server/lib code as `.ts`.
- Routes: Kebab-case segment folders under `src/app/*`.
- Styling: Tailwind CSS v4; prefer utility-first classes; configure in `tailwind.config.js`.
- Linting: `eslint-config-next` (`next/core-web-vitals`, `next/typescript`). Fix all warnings.

## Testing Guidelines
Currently no E2E test runner configured.

## Commit & Pull Request Guidelines
- Commits: Short, imperative summaries (often Norwegian). Scope clearly.
- PRs: Include description, linked issues, and screenshots/GIFs for UI changes.
- Database changes: Call out Prisma schema/migration updates with seed/rollback notes.
- Quality gates: Run `npm run lint` and `npm run build`; add/update tests as needed.

## Security & Configuration
- Env: Copy `.env.example` to `.env.local`. Prisma uses `DATABASE_URL`/`DIRECT_URL`.
- Node: Use Node 22.x. Deployment via Vercel (`vercel.json`).

## Architecture Overview
- Browser (React 19) → Next.js App Router → Prisma Client → Supabase Postgres; Edge/Serverless via Vercel. PostHog analytics from the app layer.
