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

describe("Opprett tjeneste", () => {
  it("oppretter ny tjeneste og verifiserer at den vises i listen", () => {
    // 1) Logg inn og gå direkte til tjenester-fanen
    cy.login(undefined, undefined, "/dashboard?tab=services");
    cy.visit("/dashboard?tab=services");
    cy.get('[data-cy="services"]').should("be.visible");

    // 2) Opprett tjeneste via gjenbrukbar kommando
    cy.createService({
      title: "Test Veterinærtjeneste",
      serviceType: "Veterinær",
      contactName: "Dr. Test Veterinær",
      descriptionLength: 150,
      priceMin: 500,
      priceMax: 2000,
      county: "Oslo",
      imagePath: "stable.jpg"
    }).then((serviceTitle) => {
      // 3) Verifiser at tjenesten dukker opp i listen
      cy.get('[data-cy="services"]')
        .should("be.visible")
        .contains(serviceTitle, { matchCase: false });
    });
  });

  it("oppretter tjeneste med minimal informasjon", () => {
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
        });
    });
  });

  it("oppretter flere forskjellige tjenestetyper", () => {
    // 1) Logg inn
    cy.login(undefined, undefined, "/dashboard?tab=services");
    cy.visit("/dashboard?tab=services");
    cy.get('[data-cy="services"]').should("be.visible");

    // 2) Opprett første tjenestetype
    cy.createService({
      title: "Veterinær Service Test",
      serviceType: "Veterinær",
      contactName: "Dr. Veterinær",
      descriptionLength: 100,
      county: "Oslo"
    }).then((serviceTitle1) => {
      // 3) Verifiser første tjeneste
      cy.get('[data-cy="services"]')
        .contains(serviceTitle1, { matchCase: false })
        .should('be.visible');

      // 4) Opprett andre tjenestetype
      cy.createService({
        title: "Hovslagare Service Test",
        serviceType: "Hovslagare",
        contactName: "Test Hovslagare",
        descriptionLength: 100,
        county: "Oslo"
      }).then((serviceTitle2) => {
        // 5) Verifiser andre tjeneste
        cy.get('[data-cy="services"]')
          .contains(serviceTitle2, { matchCase: false })
          .should('be.visible');
      });
    });
  });
});