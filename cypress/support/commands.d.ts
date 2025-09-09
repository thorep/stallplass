/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email?: string, password?: string, returnUrl?: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

export {}
