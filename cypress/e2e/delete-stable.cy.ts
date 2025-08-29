/// <reference types="cypress" />

describe('Slett stall', () => {
  it('oppretter og sletter en stall', () => {
    // 1) Logg inn og gå til staller
    cy.login(undefined, undefined, '/dashboard?tab=stables')
    cy.visit('/dashboard?tab=stables')
    cy.get('[data-cy="stables"]').should('be.visible')

    // 2) Opprett en ny stall
    cy.createStable({ amenityCount: 0 }).then((stableName) => {
      // 3) Finn riktig stallkort og trykk slett
      cy.contains('[data-cy="stables-list"] [data-cy^="stable-card-"] h3', stableName)
        .closest('[data-cy^="stable-card-"]')
        .within(() => {
          cy.get('button[title="Slett stall"]').click({ force: true })
        })

      // 4) Bekreft i modal
      cy.contains('button', 'Slett stall').should('be.visible').click({ force: true })

      // 5) Verifiser at stallen er borte
      cy.get('[data-cy="stables-list"]').should('be.visible')
      cy.contains('[data-cy="stables-list"] h3', stableName).should('not.exist')
    })
  })
})

