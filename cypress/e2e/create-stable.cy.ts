/// <reference types="cypress" />

function makeLongDescription(length = 300) {
  const base =
    "Dette er en moderne stall med gode fasiliteter, trivelige omgivelser og fokus på hestevelferd. " +
    "Vi tilbyr trygge bokser, gode rutiner og hyggelig miljø for både hester og eiere. ";
  let out = "";
  while (out.length < length) out += base;
  return out.slice(0, length);
}

describe("Opprett stall", () => {
  it("oppretter ny stall og verifiserer at den vises i listen", () => {
    // 1) Logg inn og gå direkte til staller-fanen
    cy.login(undefined, undefined, "/dashboard?tab=stables");
    cy.visit("/dashboard?tab=stables");
    cy.get('[data-cy="stables"]').should("be.visible");

    // 2) Opprett stall via gjenbrukbar kommando (med 10 fasiliteter)
    cy.createStable({ amenityCount: 10, descriptionLength: 320 }).then((stableName) => {
      // 3) Verifiser at stallen dukker opp i listen
      cy.get('[data-cy="stables-list"]').should("be.visible").contains(stableName, { matchCase: false });
    });
  });
});
