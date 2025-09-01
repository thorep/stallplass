function fillHorseSaleForm(name: string) {
  cy.login();
  cy.visit("/dashboard?tab=horse-sales");

  // Open create modal
  cy.get('[data-cy="add-horse-sale-button"]', { timeout: 20000 }).should("be.visible").click();

  cy.get('[data-cy="horse-sale-modal"]', { timeout: 20000 }).should("be.visible");

  // Basic info
  cy.get('[data-cy="horse-sale-name-input"]').clear().type(name).should("have.value", name);

  const desc = "Godt skolert vallak med stabilt temperament. Går trygt i terreng og på bane.";
  cy.get('[data-cy="horse-sale-description-input"]').clear().type(desc).should("have.value", desc);

  cy.get('[data-cy="horse-sale-price-input"]')
    .clear()
    .type("150000")
    .should("have.value", "150000");
  cy.get('[data-cy="horse-sale-age-input"]').clear().type("7").should("have.value", "7");
  cy.get('[data-cy="horse-sale-gender-select"]').select("VALLACH");
  cy.get('[data-cy="horse-sale-height-input"]').clear().type("165").should("have.value", "165");

  // Select first available breed and discipline (after they load)
  cy.get('[data-cy="horse-sale-breed-select"]', { timeout: 20000 })
    .find("option")
    .its("length")
    .should("be.gte", 2)
    .then(() => {
      cy.get('[data-cy="horse-sale-breed-select"]')
        .find("option")
        .eq(1)
        .then(($opt) => {
          const val = $opt.val() as string;
          if (val) cy.get('[data-cy="horse-sale-breed-select"]').select(val);
        });
    });

  cy.get('[data-cy="horse-sale-discipline-select"]', { timeout: 20000 })
    .find("option")
    .its("length")
    .should("be.gte", 2)
    .then(() => {
      cy.get('[data-cy="horse-sale-discipline-select"]')
        .find("option")
        .eq(1)
        .then(($opt) => {
          const val = $opt.val() as string;
          if (val) cy.get('[data-cy="horse-sale-discipline-select"]').select(val);
        });
    });

  // Address search
  cy.get('[data-cy="address-search-input"]').clear().type("Oslo");
  cy.contains("button", "Oslo", { timeout: 15000 }).first().click();

  // Contact info (email is usually prefilled)
  cy.get('[data-cy="contact-name-input"]').clear().type("Thor Prestbøen");
  cy.get('[data-cy="contact-email-input"]').clear().type("test+horsesale@example.com");
  cy.get('[data-cy="contact-phone-input"]').clear().type("98231631");

  // Images
  cy.get('[data-cy="image-file-input"]').first().selectFile("stable.jpg", { force: true });
  cy.contains("span", "Bilde 1", { timeout: 10000 }).should("be.visible");
  cy.get('[data-cy="image-description-open"]').click();
  cy.get('[data-cy="image-description-input"]').clear().type("Bilde av hest 1");
  cy.get('[data-cy="image-description-save-button"]').click();
  cy.get('[data-cy="image-description-text"]').should("contain", "Bilde av hest 1");
}

function submitAndVerifyHorseSale(name: string) {
  cy.intercept("POST", "/api/upload").as("upload");
  cy.intercept("POST", "/api/horse-sales").as("createHorseSale");

  cy.get('[data-cy="save-horse-sale-button"]').should("be.enabled").click();

  cy.wait("@upload", { timeout: 30000 }).its("response.statusCode").should("eq", 200);
  cy.wait("@createHorseSale", { timeout: 30000 }).its("response.statusCode").should("eq", 201);

  // Modal closes, back on dashboard list
  cy.get('[data-cy="horse-sale-modal"]').should("not.exist");
  cy.get('[data-cy="horse-sales"]', { timeout: 20000 }).contains(name);
}

describe("create-horse-sale", () => {
  it("creates a new horse sale ad (mobile default)", () => {
    const name = `Hest til salgs – ${Date.now()}`;
    fillHorseSaleForm(name);
    submitAndVerifyHorseSale(name);
  });

  it("creates a new horse sale ad (desktop 1280x900)", () => {
    cy.viewport(1280, 900);
    const name = `Hest til salgs – desktop – ${Date.now()}`;
    fillHorseSaleForm(name);
    submitAndVerifyHorseSale(name);
  });
});
