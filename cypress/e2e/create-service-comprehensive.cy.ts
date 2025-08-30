/// <reference types="cypress" />

function makeLongDescription(length = 200) {
  const base =
    "Dette er en profesjonell tjeneste for hester med fokus på dyrevelferd og kvalitet. " +
    "Vi tilbyr ekspertise innen veterinærbehandling, hovslagertjenester eller trening. " +
    "Vårt team har lang erfaring og bruker moderne metoder for beste resultat. ";
  let out = "";
  while (out.length < length) out += base;
  return out.slice(0, length);
}

describe("Opprett tjeneste - Omfattende test", () => {
  it("oppretter tjeneste med alle detaljer og verifiserer grundig", () => {
    // 1) Logg inn og gå direkte til tjenester-fanen
    cy.login(undefined, undefined, "/dashboard?tab=services");
    cy.visit("/dashboard?tab=services");
    cy.get('[data-cy="services"]').should("be.visible");

    // 2) Opprett tjeneste med alle mulige felt
    cy.createService({
      title: "Komplett Test Veterinærtjeneste",
      serviceType: "Veterinær",
      contactName: "Dr. Kari Nordmann Veterinærklinikk",
      descriptionLength: 180,
      priceMin: 800,
      priceMax: 2500,
      county: "Oslo",
      imagePath: "stable.jpg"
    }).then((serviceTitle) => {
      // 3) Verifiser at tjenesten dukker opp i listen
      cy.get('[data-cy="services"]')
        .should("be.visible")
        .contains(serviceTitle, { matchCase: false });

      // 4) Finn tjenesten og verifiser detaljer
      cy.contains('[data-cy="services"] .space-y-3 > div h3', serviceTitle)
        .closest('[data-cy="services"] .space-y-3 > div')
        .within(() => {
          // Verifiser tittel
          cy.get('h3').should('contain', serviceTitle);

          // Verifiser tjenestetype badge
          cy.get('.bg-blue-100').should('contain', 'Veterinær');

          // Verifiser prisområde (formattert som 800 - 2 500)
          cy.get('.text-indigo-600').should('contain', '800');

          // Verifiser at det finnes et bilde
          cy.get('img').should('be.visible');
        });
    });
  });
});