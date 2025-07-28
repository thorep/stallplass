/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in a user
       * @param email - User email (defaults to user1@test.com)
       * @param password - User password (defaults to test123)
       */
      login(email?: string, password?: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'user1@test.com', password = 'test123') => {
  cy.session([email, password], () => {
    cy.visit('/logg-inn')
    cy.get('[data-cy="email-input"]').type(email)
    cy.get('[data-cy="password-input"]').type(password)
    cy.get('[data-cy="login-button"]').click()
    cy.url().should('include', '/dashboard')
  })
})