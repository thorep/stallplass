/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string, returnUrl?: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'user1@test.com', password = 'test123', returnUrl) => {
  cy.visit('/logg-inn' + (returnUrl ? `?returnUrl=${returnUrl}` : ''))
  cy.get('input[data-cy="email-input"]').type(email)
  cy.get('input[data-cy="password-input"]').type(password)
  cy.get('button[data-cy="login-button"]').click()
  cy.url().should('not.include', '/logg-inn')
})