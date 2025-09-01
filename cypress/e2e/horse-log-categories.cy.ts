function addHorseLog(horseId: string, description: string) {
  // Go to horse logs page
  cy.visit(`/mine-hester/${horseId}/logg`);

  // Wait for categories to load
  cy.get('[data-cy="add-horse-button"]', { timeout: 20000 }).should("be.visible");

  // Click the first "Legg til logg" button (should be for "Stell og omsorg" category)
  cy.get('[data-cy="add-horse-button"]').first().click();

  // Wait for modal to open
  cy.get('[data-cy="horse-modal"]', { timeout: 20000 }).should("be.visible");

  // Fill in the description
  cy.get('[data-cy="description"]').should("be.visible").clear().type(description);
  cy.get('[data-cy="description"]').should("have.value", description);

  // Submit the log
  cy.get('[data-cy="save-horse-button"]').should("be.enabled").click();

  // Wait for modal to close and log to be created
  cy.get('[data-cy="horse-modal"]').should("not.exist");

  // Verify the log appears in the list
  cy.contains(description, { timeout: 20000 }).should("be.visible");
}

function addHorseLogFromCurrentPage(description: string) {
  // Wait for categories to load
  cy.get('[data-cy="add-log-button"]', { timeout: 20000 }).should("be.visible");

  // Click the first "Legg til logg" button (should be for "Stell og omsorg" category)
  cy.get('[data-cy="add-log-button"]').first().click();

  // Wait for modal to open
  cy.get('[data-cy="log-modal"]', { timeout: 20000 }).should("be.visible");

  // Fill in the description
  cy.get('[data-cy="description"]').should("be.visible").clear().type(description);
  cy.get('[data-cy="description"]').should("have.value", description);

  // Submit the log
  cy.get('[data-cy="save-horse-button"]').should("be.enabled").click();

  // Wait for modal to close and log to be created
  cy.get('[data-cy="horse-modal"]').should("not.exist");

  // Verify the log appears in the list
  cy.contains(description, { timeout: 20000 }).should("be.visible");
}

describe("horse-log-categories", () => {
  it("adds a log to existing horse (mobile default)", () => {
    cy.login();
    cy.visit("/mine-hester");

    // Find the specific horse card with exact name "TesthestMedKategori" and click its "Vis" button
    cy.get('[data-cy="horse-name"]')
      .filter((_, element) => {
        return Cypress.$(element).text().trim() === "TesthestMedKategori";
      })
      .parents('[data-cy="horse-card"]')
      .find('[data-cy="vis-horse-button"]')
      .click();

    // Wait for the horse page to load (URL should change to /mine-hester/[id])
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);
    cy.get('[data-cy="nav-logg"]').click();

    // Add the log
    const logDescription = `Test logg – ${Date.now()}`;
    addHorseLogFromCurrentPage(logDescription);
  });

  it("adds a log to existing horse (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    cy.login();
    cy.visit("/mine-hester");

    // Find the specific horse card with exact name "TesthestMedKategori" and click its "Vis" button
    cy.get('[data-cy="horse-name"]')
      .filter((_, element) => {
        return Cypress.$(element).text().trim() === "TesthestMedKategori";
      })
      .parents('[data-cy="horse-card"]')
      .find('[data-cy="vis-horse-button"]')
      .click();

    // Wait for the horse page to load (URL should change to /mine-hester/[id])
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);
    cy.get('[data-cy="nav-logg"]').click();

    // Add the log
    const logDescription = `Test logg desktop – ${Date.now()}`;
    addHorseLogFromCurrentPage(logDescription);
  });

  it("creates a new category on horse without categories", () => {
    cy.login();
    cy.visit("/mine-hester");

    // Find the specific horse card with exact name "Testhest" (the one without categories)
    cy.get('[data-cy="horse-name"]')
      .filter((_, element) => {
        return Cypress.$(element).text().trim() === "Testhest";
      })
      .parents('[data-cy="horse-card"]')
      .find('[data-cy="vis-horse-button"]')
      .click();

    // Wait for the horse page to load (URL should change to /mine-hester/[id])
    cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);
    cy.get('[data-cy="nav-logg"]').click();

    // Click "Administrer kategorier" button
    cy.contains("Administrer kategorier").click();

    // Wait for category management modal to open
    cy.get('[data-cy="category-management-modal"]', { timeout: 10000 }).should("be.visible");

    // Click "Ny kategori" button
    cy.get('[data-cy="new-category"]').click();

    // Fill in category name
    const categoryName = `Test kategori – ${Date.now()}`;
    cy.get('[data-cy="categoryName"]').should("be.visible").clear().type(categoryName);
    cy.get('[data-cy="categoryName"]').should("have.value", categoryName);

    // Fill in optional description
    const categoryDescription = "Dette er en testkategori opprettet av Cypress";
    cy.get('[data-cy="categoryDescription"]')
      .should("be.visible")
      .clear()
      .type(categoryDescription);
    cy.get('[data-cy="categoryDescription"]').should("have.value", categoryDescription);

    // Click "Opprett" button to save
    cy.get('[data-cy="opprett-kategori-knapp"]', { timeout: 10000 }).click();

    // Wait for modal to close and category to be created
    cy.get('[data-cy="category-management-modal"]').should("not.exist");

    // Verify the category appears in the list
    cy.contains(categoryName, { timeout: 10000 }).should("be.visible");

    // Verify the description is shown
    cy.contains(categoryDescription).should("be.visible");
  });
});
