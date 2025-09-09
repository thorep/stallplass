function deleteHorse(name: string) {
  cy.login();
  cy.visit("/mine-hester");

  // Ensure we are on the correct page
  cy.url({ timeout: 10000 }).should("include", "/mine-hester");

  // Wait for horses to load
  cy.get('[data-cy="horses-grid"]', { timeout: 20000 }).should("be.visible");

  // Find the horse card and click delete

  cy.get('[data-cy="horse-name"]')
    .filter((_, element) => {
      return Cypress.$(element).text().trim() === "Testhest";
    })
    .parents('[data-cy="horse-card"]')
    .find('[data-cy="slett-hest-knapp"]')
    .click();

  // Confirm delete
  cy.on("window:confirm", (text) => {
    expect(text).to.include(`Er du sikker på at du vil slette ${name}?`);
    return true;
  });

  // Wait for delete to complete
  cy.wait(2000);

  // Verify horse is gone
  cy.get('[data-cy="horses-grid"]').should("not.contain", name);
}

describe("delete-horse", () => {
  it("deletes a horse (mobile default)", () => {
    deleteHorse("TesthestSlett");
  });

  it("deletes a horse (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    deleteHorse("TesthestSlett");
  });
});
