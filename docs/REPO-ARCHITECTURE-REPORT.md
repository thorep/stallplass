# Repository Architecture & Health Report

Dato: 2025-09-01

## Sammendrag
Prosjektet følger en tydelig arkitektur: Next.js App Router under `src/app`, delt domenelogikk i `src/services`, klienthooks i `src/hooks`, typer i `src/types`, og delte biblioteker i `src/lib`. Database er modellert i Prisma (`prisma/schema.prisma`) med generert klient i `src/generated/prisma`. E2E dekkes av Cypress. Overordnet ser strukturen ryddig ut og samsvarer med retningslinjene i AGENTS.md.

## Styrker
- Struktur: Konsistent mappeoppsett (`src/app`, `src/components`, `src/services`, `src/lib`, `prisma`, `docs`).
- TypeScript: `strict: true`, alias `@/*`, tydelige domene-typer.
- Next.js: App Router, API-ruter under `src/app/api/*`, PostHog integrert via `withPostHogConfig`.
- Tailwind v4: CSS-first konfig i `src/app/globals.css` (`@import "tailwindcss";` og `@source`). PostCSS bruker `@tailwindcss/postcss` (i tråd med v4-dokumentasjon).
- Datamodell: Prisma-skjema med rikelig indekser og relasjoner; migrasjoner versjonert.
- Testing: Cypress v15 konfigurert med mobil-viewport og støttekommandoer.

## Avvik og forbedringsforslag
1) Middleware-duplikat (Next.js)
- Filer: `middleware.ts` (rot) og `src/middleware.ts` eksisterer samtidig. Next anbefaler én middleware når `src/` brukes. Slå sammen funksjonaliteten (sesjonsfornyelse + route-beskyttelse) og behold kun én fil, helst `src/middleware.ts` (ref: Next.js middleware docs).

2) Tailwind v4 – last JS-konfig eksplisitt
- `tailwind.config.js` (safelist + plugin) er ikke automatisk brukt i v4. Legg til `@config "../../tailwind.config.js";` øverst i `src/app/globals.css` om dere vil fortsette med JS-konfig og `tailwindcss-animate` (ref: Tailwind v4 upgrade guide). Alternativt, flytt safelist/varianter til CSS (`@utility`, `@layer`).

3) PostCSS-konfig duplikat
- Både `postcss.config.js` og `postcss.config.mjs` finnes. Behold én (anbefalt `.mjs`) for å unngå forvirring.

4) Cypress CTRF-reporter ikke konfigurert
- Docs viser CTRF JSON, men `cypress.config.ts` mangler `reporter`/`reporterOptions`. Legg til `reporter: 'cypress-ctrf-json-reporter'` og `reporterOptions.outputDir: 'cypress/results'`. Installer dev-avhengighet ved behov.

5) Playwright-skript uten oppsett
- `package.json` har `playwright`-scripts, men ingen `playwright.config.*`. Fjern scripts eller legg til minimal konfig for å unngå feilede kommandoer.

6) Logging-støy i produksjon
- Flere `console.log` i `src/services/*` (f.eks. `storage-service.ts`, `forum-service.ts`). Bytt til `src/lib/logger.ts` (pino) og styr nivå via `LOG_LEVEL`. Dette gir renere Vercel-logger og strukturert output.

7) Midlertidige/dupliserte filer
- `tmp/vercel-image-optimization.*` og enkelte dupliserte komponentlister i repoet kan ryddes vekk eller flyttes til `docs/`.

## Overensstemmelse med dokumentasjon (utdrag)
- Tailwind v4: Bruk av `@tailwindcss/postcss` og CSS-first er korrekt; husk `@config` hvis JS-konfig/plugger skal gjelde (Tailwind v4 docs).
- Next 15: `images.remotePatterns`, `formats`, `minimumCacheTTL` og `qualities` er støttet (Next docs). Rewrites for PostHog er ok.
- Middleware: Hold én fil ved bruk av `src/` (Next docs).
- Cypress: Reporter må eksplisitt settes i konfig for CTRF JSON.

## Anbefalt sjekkliste (neste steg)
- [ ] Konsolider til én `src/middleware.ts` og fjern rot-varianten.
- [ ] Legg til `@config "../../tailwind.config.js";` i `globals.css` ELLER flytt konfig til CSS.
- [ ] Fjern duplikat `postcss.config.*` (behold `.mjs`).
- [ ] Aktiver CTRF-reporter i `cypress.config.ts` og installer pakken.
- [ ] Fjern/erstatt `console.log` med `logger` i services.
- [ ] Rydd `tmp/` og ubrukte Playwright-scripts eller legg til config.

