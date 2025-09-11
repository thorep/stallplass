function navigateToHorseDetail(horseName: string = "Testhest") {
  cy.login();
  cy.visit("/mine-hester");

  // Ensure we are on the correct page
  cy.url({ timeout: 10000 }).should("include", "/mine-hester");

  // Wait for horses to load
  cy.get('[data-cy="owned-horses-grid"]', { timeout: 20000 }).should("be.visible");

  // Find the specific horse card with exact name and click its "Vis" button
  cy.get('[data-cy="horse-name"]')
    .filter((_, element) => {
      return Cypress.$(element).text().trim() === horseName;
    })
    .parents('[data-cy="horse-card"]')
    .find('[data-cy="vis-horse-button"]')
    .scrollIntoView()
    .should("be.visible")
    .click();

  // Wait for the horse page to load (URL should change to /mine-hester/[id])
  cy.url({ timeout: 10000 }).should("match", /\/mine-hester\/[^\/]+$/);
}

function updateBasicInfo(newName: string, newBreed: string) {
  // Click edit button for basic info section (Grunnleggende informasjon)
  cy.contains("Grunnleggende informasjon")
    .parent()
    .parent()
    .find('[data-cy="edit-button"]')
    .click();

  // Update name
  cy.get('[data-cy="horse-name-input"]').clear().type(newName).should("have.value", newName);

  // Update breed
  cy.get('[data-cy="horse-breed-input"]').clear().type(newBreed).should("have.value", newBreed);

  // Save changes
  cy.get('[data-cy="save-button"]').click();

  // Wait for save to complete
  cy.wait(2000);
}

function updatePhysicalInfo(newAge: string, newHeight: string, newWeight: string) {
  // Click edit button for physical characteristics section (Fysiske egenskaper)
  cy.contains("Fysiske egenskaper").parent().parent().find('[data-cy="edit-button"]').click();

  // Update age
  cy.get('[data-cy="horse-age-input"]').clear().type(newAge).should("have.value", newAge);

  // Update height
  cy.get('[data-cy="horse-height-input"]').clear().type(newHeight).should("have.value", newHeight);

  // Update weight
  cy.get('[data-cy="horse-weight-input"]').clear().type(newWeight).should("have.value", newWeight);

  // Save changes
  cy.get('[data-cy="save-button"]').click();

  // Wait for save to complete
  cy.wait(2000);
}

function verifyBasicInfoUpdates(newName: string, newBreed: string) {
  // Verify name was updated
  cy.contains(newName).should("be.visible");

  // Verify breed was updated
  cy.contains(newBreed).should("be.visible");
}

function verifyPhysicalInfoUpdates(newAge: string, newHeight: string, newWeight: string) {
  // Verify age was updated
  cy.contains(`${newAge} år`).should("be.visible");

  // Verify height was updated
  cy.contains(`${newHeight} cm`).should("be.visible");

  // Verify weight was updated
  cy.contains(`${newWeight} kg`).should("be.visible");
}

describe("update-horse", () => {
  it("updates horse basic information (mobile default)", () => {
    const newName = "Oppdatert Testhest";
    const newBreed = "Oppdatert Rase";

    navigateToHorseDetail("TesthestBasicMobile");
    updateBasicInfo(newName, newBreed);
    verifyBasicInfoUpdates(newName, newBreed);
  });

  it("updates horse physical information (mobile default)", () => {
    const newAge = "8";
    const newHeight = "160";
    const newWeight = "480";

    navigateToHorseDetail("TesthestPhysicalMobile");
    updatePhysicalInfo(newAge, newHeight, newWeight);
    verifyPhysicalInfoUpdates(newAge, newHeight, newWeight);
  });

  it("updates horse basic information (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    const newName = "Oppdatert Testhest Desktop";
    const newBreed = "Oppdatert Rase Desktop";

    navigateToHorseDetail("TesthestBasicDesktop");
    updateBasicInfo(newName, newBreed);
    verifyBasicInfoUpdates(newName, newBreed);
  });

  it("updates horse physical information (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    const newAge = "9";
    const newHeight = "165";
    const newWeight = "490";

    navigateToHorseDetail("TesthestPhysicalDesktop");
    updatePhysicalInfo(newAge, newHeight, newWeight);
    verifyPhysicalInfoUpdates(newAge, newHeight, newWeight);
  });
});
