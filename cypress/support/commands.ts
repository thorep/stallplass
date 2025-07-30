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
      /**
       * Custom command to get auth token from logged in user
       */
      getAuthToken(): Chainable<string>
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

Cypress.Commands.add('getAuthToken', () => {
  return cy.window().its('localStorage').then((localStorage) => {
    // Get the Supabase session from localStorage
    const authKey = Object.keys(localStorage).find(key => key.includes('supabase.auth.token'));
    if (authKey) {
      const authData = JSON.parse(localStorage[authKey]);
      return authData.access_token;
    }
    throw new Error('No auth token found in localStorage');
  });
})