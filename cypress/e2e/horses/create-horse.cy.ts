function fillHorseForm(name: string) {
  cy.login();
  cy.visit("/mine-hester");

  // Ensure we are on the correct page
  cy.url({ timeout: 10000 }).should("include", "/mine-hester");

  // Open create modal
  cy.get('[data-cy="add-horse-button"]', { timeout: 20000 }).should("be.visible").click();

  cy.get('[data-cy="horse-modal"]', { timeout: 20000 }).should("be.visible");

  // Basic info
  cy.get('[data-cy="horse-name-input"]').should("be.visible").clear().type(name);
  cy.get('[data-cy="horse-name-input"]').should("have.value", name);

  cy.get('[data-cy="horse-breed-input"]').should("be.visible").clear().type("Norsk fjordhest");
  cy.get('[data-cy="horse-breed-input"]').should("have.value", "Norsk fjordhest");

  cy.get('[data-cy="horse-age-input"]').should("be.visible").clear().type("7");
  cy.get('[data-cy="horse-age-input"]').should("have.value", "7");

  cy.get('[data-cy="horse-color-input"]').should("be.visible").clear().type("Brun");
  cy.get('[data-cy="horse-color-input"]').should("have.value", "Brun");

  cy.get('[data-cy="horse-gender-select"]').should("be.visible").click();
  cy.get('[data-cy="horse-gender-vallach"]').should("be.visible").click();
  cy.get('[data-cy="horse-height-input"]').should("be.visible").clear().type("155");
  cy.get('[data-cy="horse-height-input"]').should("have.value", "155");

  cy.get('[data-cy="horse-weight-input"]').should("be.visible").clear().type("450");
  cy.get('[data-cy="horse-weight-input"]').should("have.value", "450");

  // Images
  cy.get('[data-cy="image-file-input"]').first().selectFile("stable.jpg", { force: true });
  cy.contains("span", "Bilde 1", { timeout: 10000 }).should("be.visible");
  cy.get('[data-cy="image-description-open"]').click();
  cy.get('[data-cy="image-description-input"]').clear().type("Bilde av hest");
  cy.get('[data-cy="image-description-save-button"]').click();
  cy.get('[data-cy="image-description-text"]').should("contain", "Bilde av hest");
}

function submitAndVerifyHorse(name: string) {
  cy.intercept("POST", "/api/upload").as("upload");

  cy.get('[data-cy="save-horse-button"]').should("be.enabled").click();

  cy.wait("@upload", { timeout: 30000 }).its("response.statusCode").should("eq", 200);

  // Modal closes, back on horses list
  cy.get('[data-cy="horse-modal"]').should("not.exist");
  cy.get('[data-cy="owned-horses-grid"]', { timeout: 20000 }).contains(name);
}

describe("create-horse", () => {
  it("creates a new horse (mobile default)", () => {
    const name = `Testhest – ${Date.now()}`;
    fillHorseForm(name);
    submitAndVerifyHorse(name);
  });

  it("creates a new horse (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    const name = `Testhest desktop – ${Date.now()}`;
    fillHorseForm(name);
    submitAndVerifyHorse(name);
  });
});
