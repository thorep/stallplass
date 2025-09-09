/// <reference types="cypress" />
/// <reference path="./commands.d.ts" />

Cypress.Commands.add("login", (email?: string, password?: string, returnUrl?: string) => {
  const emailStr = email ?? "user1@test.com";
  const passwordStr = password ?? "test123";

  cy.visit("/logg-inn" + (returnUrl ? `?returnUrl=${returnUrl}` : ""));
  cy.get('input[data-cy="email-input"]').type(emailStr);
  cy.get('input[data-cy="password-input"]').type(passwordStr);
  cy.get('button[data-cy="login-button"]').click();
  // Wait up to 10s for Next.js navigation away from /logg-inn
  cy.location("pathname", { timeout: 20000 }).should("not.eq", "/logg-inn");
});

Cypress.Commands.add("logout", () => {
  cy.get('button[data-cy="logout-button"]').click();
  // Wait for logout to complete and redirect to home page
  cy.location("pathname", { timeout: 10000 }).should("eq", "/");
});

export {};
