/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a test user
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to login as user1 (user3@test.com)
       */
      loginAsUser1(): Chainable<void>;

      /**
       * Custom command to login as user2 (user4@test.com)
       */
      loginAsUser2(): Chainable<void>;

      /**
       * Custom command to wait for dashboard to load
       */
      waitForDashboard(): Chainable<void>;

      /**
       * Custom command to navigate to stable creation
       */
      goToCreateStable(): Chainable<void>;
    }
  }
}

// Login command
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/logg-inn");
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();

  // Wait for successful login (dashboard page)
  cy.url().should("include", "/dashboard", { timeout: 30000 });
  cy.visit("/dashboard");
  cy.get("h1", { timeout: 10000 }).should("contain", "Dashboard");
});

// Convenience commands for test users
Cypress.Commands.add("loginAsUser1", () => {
  cy.login(Cypress.env("testUser1Email"), Cypress.env("testUser1Password"));
});

Cypress.Commands.add("loginAsUser2", () => {
  cy.login(Cypress.env("testUser2Email"), Cypress.env("testUser2Password"));
});

// Wait for dashboard to load completely
Cypress.Commands.add("waitForDashboard", () => {
  cy.get("h1").should("contain", "Dashboard");
  cy.get('[data-cy="dashboard-tab-overview"]').should("be.visible");
  cy.get('[data-cy="dashboard-tab-stables"]').should("be.visible");
});

// Navigate to stable creation from dashboard
Cypress.Commands.add("goToCreateStable", () => {
  cy.waitForDashboard();

  // Go to Mine staller tab
  cy.get('[data-cy="dashboard-tab-stables"]').click();

  // Wait for stables to load
  cy.wait(5000); // Give time for stables data to load

  // Click the add stable button
  cy.get("button").contains("Legg til ny stall").should("be.visible").click();

  // Wait for navigation to create stable page
  cy.url().should("include", "/ny-stall");
  cy.get("h1").should("contain", "Legg til ny stall");
});
