describe("create-budget-item", () => {
  it("creates a new budget item for a horse (mobile default)", () => {
    cy.login();
    cy.visit("/mine-hester");

    // Wait for horses to load
    cy.get('[data-cy="owned-horses-grid"]', { timeout: 20000 }).should("be.visible");

    // Find the specific horse card with exact name "Testhest" and click its "Vis" button
    cy.get('[data-cy="horse-name"]')
      .filter((_, element) => {
        return Cypress.$(element).text().trim() === "Testhest";
      })
      .parents('[data-cy="horse-card"]')
      .find('[data-cy="vis-horse-button"]')
      .scrollIntoView()
      .should("be.visible")
      .click();

    // Wait for the horse page to load (URL should change to /mine-hester/[id])
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);

    // Navigate to budget tab
    cy.get('[data-cy="nav-budsjett"]').click();

    // Click add expense button
    cy.get('[data-cy="add-expense-button"]', { timeout: 9000 }).click();

    // Fill out the form
    cy.get('[data-cy="expense-title"]').clear().type("Test utgift");
    cy.get('[data-cy="expense-amount"]').clear().type("500");
    cy.get('[data-cy="expense-category"]').clear().type("Fôr");

    // Submit the form
    cy.get('[data-cy="save-expense-button"]').click();

    // Wait for form submission and list update
    cy.wait(2000);

    // Scroll to top to ensure the list is visible
    cy.scrollTo("top");

    // Verify the expense appears in the list
    cy.contains("Test utgift").should("be.visible");
    cy.contains("500 kr").should("be.visible", { timeout: 10000 });
  });

  it("creates a new budget item for a horse (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    cy.login();
    cy.visit("/mine-hester");

    // Wait for horses to load
    cy.get('[data-cy="owned-horses-grid"]', { timeout: 20000 }).should("be.visible");

    // Find the specific horse card with exact name "Testhest" and click its "Vis" button
    cy.get('[data-cy="horse-name"]')
      .filter((_, element) => {
        return Cypress.$(element).text().trim() === "Testhest";
      })
      .parents('[data-cy="horse-card"]')
      .find('[data-cy="vis-horse-button"]')
      .scrollIntoView()
      .should("be.visible")
      .click();

    // Wait for the horse page to load (URL should change to /mine-hester/[id])
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);

    // Navigate to budget tab
    cy.get('[data-cy="nav-budsjett"]').click();

    // Click add expense button
    cy.get('[data-cy="add-expense-button"]', { timeout: 9000 }).click();

    // Fill out the form
    cy.get('[data-cy="expense-title"]').clear().type("Test utgift desktop");
    cy.get('[data-cy="expense-amount"]').clear().type("750");
    cy.get('[data-cy="expense-category"]').clear().type("Vet");

    // Submit the form
    cy.get('[data-cy="save-expense-button"]').click();

    // Verify the expense appears in the list
    cy.contains("Test utgift desktop").should("be.visible");
    cy.contains("750 kr").should("be.visible");
  });
});
