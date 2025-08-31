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
- E2E: Cypress er konfigurert. Se `docs/testing.md` for kjøring, miljø og kommandoer.
 - Mobil som standard: Cypress kjører med iPhone 12-viewport (390x844) satt i `cypress.config.ts`. Ikke overstyr `cy.viewport()` i enkelttester med mindre det er bevisst. Legg til `data-cy`-hooks i UI for stabil selektering i mobilvisning.

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

## Codex-notater
- Standard base-URL (lokalt): `http://localhost:3000`.
- Start utviklingsserver: `npm run dev`.
- Playwright i Codex CLI: kjør `browser_install` hvis nettlesere mangler.
- Navigering: bruk `playwright__browser_navigate` til `http://localhost:3000` før interaksjoner.
- Interaksjoner: bruk `playwright__browser_*`-verktøy for klikk, utfylling, venting osv.
- Testbrukere (lokalt): `user1@test.com` / passord `test123`.
- Cypress: blokkerer PostHog-domener og skjuler survey-overlays under E2E for stabilitet.
- Cypress reporter: konfigurert `cypress-ctrf-json-reporter` til å skrive `cypress/results/results.json`.
- Merk: kjør `npm i -D cypress-ctrf-json-reporter` for å aktivere reporteren lokalt/CI.

## Test & Rapporter
- E2E: Cypress v15 (App på `http://localhost:3000`).
- Rapporter: CTRF JSON via `cypress-ctrf-json-reporter`.
- Output: `cypress/results/results.json` (artefakt for CI-dashboards).
- Skjermbilder/Video: `cypress/screenshots` og `cypress/videos`.
- Kjøring:
  - `npm run cy:run` (kun tester, forventer app oppe)
  - `npm run e2e:dev:run` (starter dev + kjører tester)

## MCP-tilgang
- Playwright MCP: Interaksjon med nettleser
  - Installer: `playwright__browser_install`
  - Naviger: `playwright__browser_navigate` → `http://localhost:3000`
  - Handlinger: `playwright__browser_click`, `..._type`, `..._press_key`, `..._file_upload`, `..._wait_for`, `..._snapshot`, `..._take_screenshot` m.fl.
- Context7 MCP: Dokumentasjonssøk
  - `context7__resolve-library-id` (må kjøres først)
  - `context7__get-library-docs` (hent fokusert docs med tokens/topic)
