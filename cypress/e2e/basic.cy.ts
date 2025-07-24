describe('Basic Setup Test', () => {
  it('can visit the homepage', () => {
    cy.visit('/')
    cy.get('h1').should('exist')
    cy.contains('Stallplass').should('be.visible')
  })

  it('can visit the login page', () => {
    cy.visit('/logg-inn')
    cy.url().should('include', '/logg-inn')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
  })
})