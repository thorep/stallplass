// Custom Cypress commands and helpers

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      dataCy(value: string): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add('dataCy', (value: string) => cy.get(`[data-cy="${value}"]`));

// Cache session to speed up multi-spec runs
Cypress.Commands.add('login', () => {
  cy.session('user1@test.com', () => {
    cy.visit('/logg-inn?returnUrl=/dashboard');
    cy.dataCy('email-input').clear().type('user1@test.com');
    cy.dataCy('password-input').clear().type('test123', { log: false });
    cy.dataCy('login-button').click();
    cy.location('pathname').should('eq', '/dashboard');
  });
});

export {};
