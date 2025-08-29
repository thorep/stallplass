/// <reference types="cypress" />

describe('Dashboard tabs', () => {
  it('switcher mellom alle dashboard-faner', () => {
    cy.login()

    // Starter på Analyse
    cy.get('[data-cy="analytics"]').should('be.visible')

    // Mine staller
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    cy.location('search').should('contain', 'tab=stables')
    cy.get('[data-cy="stables"]').should('be.visible')

    // Hest (salg av hest)
    cy.get('[data-cy="dashboard-tab-horse-sales"]').click()
    cy.location('search').should('contain', 'tab=horse-sales')
    cy.get('[data-cy="horse-sales"]').should('be.visible')

    // Tjenester
    cy.get('[data-cy="dashboard-tab-services"]').click()
    cy.location('search').should('contain', 'tab=services')
    cy.get('[data-cy="services"]').should('be.visible')

    // Fôrhest
    cy.get('[data-cy="dashboard-tab-forhest"]').click()
    cy.location('search').should('contain', 'tab=forhest')
    cy.get('[data-cy="forhest"]').should('be.visible')

    // Tilbake til Analyse
    cy.get('[data-cy="dashboard-tab-analytics"]').click()
    cy.location('search').should('contain', 'tab=analytics')
    cy.get('[data-cy="analytics"]').should('be.visible')
  })
})

