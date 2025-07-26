describe("Authentication", () => {
  describe("User Login Flow", () => {
    it("user 1 can successfully log in with valid credentials", () => {
      cy.visit("/logg-inn");

      // Fill in login form
      cy.get('input[name="email"]').type(Cypress.env("testUser1Email"));
      cy.get('input[name="password"]').type(Cypress.env("testUser1Password"));

      // Submit form
      cy.get('button[type="submit"]').click();

      // Should navigate to dashboard
      cy.url().should("include", "/dashboard");
      cy.visit("/dashboard");
      cy.get("h1", { timeout: 10000 }).should("contain", "Dashboard");
    });

    it("user 2 can successfully log in with valid credentials", () => {
      cy.visit("/logg-inn");

      // Fill in login form
      cy.get('input[name="email"]').type(Cypress.env("testUser2Email"));
      cy.get('input[name="password"]').type(Cypress.env("testUser2Password"));

      // Submit form
      cy.get('button[type="submit"]').click();

      // Should navigate to dashboard
      cy.url().should("include", "/dashboard");
      cy.visit("/dashboard");
      cy.get("h1", { timeout: 10000 }).should("contain", "Dashboard");
    });
  });
});
