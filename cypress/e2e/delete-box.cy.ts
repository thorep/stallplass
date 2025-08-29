/// <reference types="cypress" />

describe('Slett stallplass (boks)', () => {
  it('oppretter og sletter en stallplass på en valgt stall', () => {
    // 1) Logg inn og gå til staller
    cy.login(undefined, undefined, '/dashboard?tab=stables')
    cy.visit('/dashboard?tab=stables')
    cy.get('[data-cy="stables"]').should('be.visible')

    // 2) Sørg for at det finnes en stall og opprett boks på denne
    cy.ensureStable().then((stableName) => {
      cy.createBox({ stableName }).then((boxName) => {
        // 3) Verifiser at boksen finnes inne i riktig stallkort
        cy.contains('[data-cy="stables-list"] [data-cy^="stable-card-"] h3', stableName)
          .closest('[data-cy^="stable-card-"]')
          .within(() => {
            cy.contains(boxName, { matchCase: false }).should('exist')

            // 4) Slett boksen: klikk "Slett" og deretter "Bekreft"
            cy.contains('button', 'Slett').click({ force: true })
            cy.contains('button', 'Bekreft').click({ force: true })

            // 5) Bekreft at boksen er borte
            cy.contains(boxName, { matchCase: false }).should('not.exist')
          })
      })
    })
  })
})

