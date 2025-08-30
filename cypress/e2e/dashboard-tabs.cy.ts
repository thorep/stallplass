/// <reference types="cypress" />

describe('Dashboard tabs', () => {
  it('switcher mellom alle dashboard-faner', () => {
    cy.login()

    // Test hver tab ved å navigere direkte til URL-en
    const tabs = [
      { name: 'analytics', selector: '[data-cy="analytics"]', title: 'Analyse' },
      { name: 'stables', selector: '[data-cy="stables"]', title: 'Mine staller' },
      { name: 'horse-sales', selector: '[data-cy="horse-sales"]', title: 'Kjøp/salg av hest' },
      { name: 'services', selector: '[data-cy="services"]', title: 'Tjenester' },
      { name: 'forhest', selector: '[data-cy="forhest"]', title: 'Fôrhest' }
    ]

    tabs.forEach((tab, index) => {
      cy.log(`Testing tab: ${tab.name} (${index + 1}/${tabs.length})`)

      // Naviger til tab-URL-en
      cy.visit(`/dashboard?tab=${tab.name}`)

      // Vent litt på at siden lastes
      cy.wait(1000)

      // Sjekk at vi er på riktig side ved å se etter tab-tittelen
      cy.contains(tab.title).should('be.visible')

      // Sjekk at URL-en inneholder riktig tab-parameter
      cy.location('search').should('contain', `tab=${tab.name}`)

      cy.log(`✅ Tab ${tab.name} fungerer korrekt`)
    })
  })
})

