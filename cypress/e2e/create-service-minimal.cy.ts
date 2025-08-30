/// <reference types="cypress" />

describe("Opprett tjeneste - Minimal test", () => {
  it("oppretter tjeneste med kun nødvendige felt", () => {
    // 1) Logg inn og gå til tjenester-fanen
    cy.login(undefined, undefined, "/dashboard?tab=services");
    cy.visit("/dashboard?tab=services");
    cy.get('[data-cy="services"]').should("be.visible");

    // 2) Opprett tjeneste med kun nødvendige felt
    cy.createService({
      title: "Minimal Test Tjeneste",
      serviceType: "Hovslagare",
      contactName: "Test Hovslagare",
      descriptionLength: 50,
      county: "Oslo"
    }).then((serviceTitle) => {
      // 3) Verifiser at tjenesten finnes
      cy.get('[data-cy="services"]')
        .should("be.visible")
        .contains(serviceTitle, { matchCase: false });

      // 4) Verifiser tjenestetype
      cy.contains('[data-cy="services"] .space-y-3 > div h3', serviceTitle)
        .closest('[data-cy="services"] .space-y-3 > div')
        .within(() => {
          cy.get('.bg-blue-100').should('contain', 'Hovslagare');
          // Siden ingen pris er satt, bør det stå "Kontakt for pris"
          cy.get('.text-indigo-600').should('contain', 'Kontakt for pris');
        });
    });
  });
});