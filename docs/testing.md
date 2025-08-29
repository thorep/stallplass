# E2E-testing (Cypress)

- Base-URL: `http://localhost:3000` (app skal kjøre separat)
- Kjøring:
  - Hele suiten: `npm run test`
  - I Chrome: `npx cypress run --e2e -b chrome`
  - En spesifikk test: `npx cypress run --e2e -s cypress/e2e/<fil>.cy.ts`

## Miljø og forutsetninger
- Testbruker: `user1@test.com` / `test123` (se også `.env.local`).
- CTRF-rapport: `cypress-ctrf-json-reporter` (output i `cypress/results/results.json`).
- Deaktiver VS Code-utvidelsen “Console Ninja” under kjøring (forhindrer `invalid reporter [object Object]`).
- Vi skjuler PostHog-overlays globalt i `cypress/support/e2e.ts` for stabilitet.

## Struktur
- E2E-specs: `cypress/e2e/*.cy.ts`
- Custom kommandoer: `cypress/support/commands.ts`

## Gjenbrukbare kommandoer
- `cy.login(email?, password?, returnUrl?)`
- `cy.createStable({ name?, addressQuery?, descriptionLength?, amenityCount? })`
- `cy.ensureStable()` – oppretter stall ved behov og returnerer navn
- `cy.createBox({ stableName?, stableIndex?, name?, price?, size?, maxHorseSize?, sizeText?, descriptionLength?, specialNotes?, quantity?, amenityCount?, imagePath? })`

## Viktige tester
- Opprettelse
  - `create-stable.cy.ts`: Verifiserer at opprettelse av stall fungerer og stallen vises i listen.
  - `create-stallplass.cy.ts`: Oppretter stallplass (boks) på valgt stall og verifiserer resultatet.
- Sletting
  - `delete-box.cy.ts`: Oppretter og deretter sletter en stallplass på en bestemt stall.
  - `delete-stable.cy.ts`: Oppretter og sletter en stall.

## Retningslinjer
- Nye tester bør:
  - Bruke custom-kommandoer der det gir mening (for robusthet).
  - Legge inn `data-cy`-attributter i UI ved behov for stabil selektering.
  - Rydde opp testdata dersom de forstyrrer andre tester (vurder egne “cleanup”-steg/kommandoer).

