/// <reference types="cypress" />

describe('Favorites - Basic functionality', () => {
  beforeEach(function() {
    cy.login()
    // Ensure we're not on email verification page
    cy.location('pathname').then((pathname) => {
      if (pathname === '/verifiser-epost') {
        // Skip test if email verification is required
        cy.log('Email verification required, skipping test')
        this.skip()
      }
    })
  })

  it('kan legge til favoritt på stall-annonse', () => {
    // Intercept API-kall
    cy.intercept('POST', '/api/favorites', { statusCode: 200 }).as('addFavorite')

    // Gå til søkesiden og bytt til staller
    cy.visit('/sok?mode=stables')

    // Vent på at siden laster
    cy.contains('Staller').should('be.visible')

    // Finn første stall-annonse og klikk på den
    cy.get('a[href*="/staller/"]').first().click()

    // Vent på at detalj-siden laster
    cy.location('pathname').should('include', '/staller/')

    // Sjekk at favoritt-knappen finnes
    cy.get('[data-cy="favorite-button"]').should('be.visible')

    // Sjekk gjeldende tilstand og sikre at vi starter fra "ikke favoritt"
    cy.get('[data-cy="favorite-button"]').find('svg').then($svg => {
      if ($svg.hasClass('text-red-500')) {
        // Annonsen er allerede favoritt - klikk for å fjerne først
        cy.get('[data-cy="favorite-button"]').click()
        // Vent på at knappen blir grå igjen
        cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')
      }
    })

    // Nå skal knappen være grå (ikke favoritt) - klikk for å legge til
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-gray-400')
    cy.get('[data-cy="favorite-button"]').click()

    // Sjekk at knappen umiddelbart blir rød
    cy.get('[data-cy="favorite-button"]').find('svg').should('have.class', 'text-red-500')

    // Vent på at API-kallet fullfører
    cy.wait('@addFavorite')
  })
})