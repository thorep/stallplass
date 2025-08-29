/// <reference types="cypress" />

function makeText(length = 240) {
  const base =
    "Dette er en funksjonell og trivelig stallplass med gode rutiner, fokus på hestevelferd og hyggelig miljø. " +
    "Stallplassen passer godt for daglig bruk og trygg oppstalling, med lett tilgang til fasiliteter. ";
  let out = "";
  while (out.length < length) out += base;
  return out.slice(0, length);
}

describe("Opprett stallplass (boks) på en stall", () => {
  it("oppretter stallplass med bilde, pris og detaljer", () => {
    // 1) Logg inn og gå til staller-fanen
    cy.login(undefined, undefined, "/dashboard?tab=stables");
    cy.visit("/dashboard?tab=stables");
    cy.get('[data-cy="stables"]').should("be.visible");

    // 2) Sørg for at det finnes minst én stall, og opprett boks på den stallen
    cy.ensureStable().then((stableName) => {
      cy.createBox({
        stableName,
        price: 4500,
        size: "MEDIUM",
        maxHorseSize: "Medium",
        sizeText: "Middels boks, ca. 3x3 meter.",
        descriptionLength: 230,
        specialNotes: "NB! Ikke lov med hingst",
        amenityCount: 2,
        imagePath: "stable.jpg",
      }).then((boxName) => {
        // Verifiser innenfor riktig stallkort
        cy.contains('[data-cy="stables-list"] [data-cy^="stable-card-"] h3', stableName)
          .closest('[data-cy^="stable-card-"]')
          .within(() => {
            cy.contains(boxName, { matchCase: false, timeout: 20000 }).should("exist");
          });
      });
    });
  });
});
