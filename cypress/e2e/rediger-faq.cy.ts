/// <reference types="cypress" />

describe("Rediger FAQ på stall", () => {
  it("oppretter, redigerer og sletter FAQ for en stall", () => {
    // 1) Logg inn og gå til staller-fanen
    cy.login(undefined, undefined, "/dashboard?tab=stables");
    cy.visit("/dashboard?tab=stables");
    cy.get('[data-cy="stables"]').should("be.visible");

     // 2) Opprett en stall for testen
     cy.createStable({ amenityCount: 5 }).then((stableName) => {
       cy.get('[data-cy="stables-list"]')
         .should("be.visible")
         .contains(stableName, { matchCase: false });

       // 3) Finn stallen og klikk på "Administrer FAQ"
       cy.contains(stableName, { matchCase: false }).closest('[data-cy^="stable-card-"]').within(() => {
         cy.get('[data-cy="add-faq-button"]').click();
       });
     });

     // 4) Verifiser at FAQ modal åpnes
     cy.get('[data-cy="faq-modal-close-button"]').should("be.visible");
     cy.contains("FAQ for").should("be.visible");

     // 5) Klikk på "Legg til nytt spørsmål"
     cy.contains("Legg til nytt spørsmål").click();
     cy.get('[data-cy="faq-question-input"]').should('be.visible');

      // 6) Legg til en ny FAQ
      cy.intercept('POST', /\/api\/stables\/.*\/faqs/).as('createFAQ');
      cy.get('[data-cy="faq-question-input"]').type("Test question");
      cy.get('[data-cy="faq-answer-textarea"]').type("Test answer");
      cy.get('[data-cy="save-faq-button"]').should('not.be.disabled').click();
      cy.wait('@createFAQ').its('response.statusCode').should('eq', 200);

      // 7) Verifiser at FAQ ble lagt til
      cy.get('[data-cy="faq-list"]').contains('Test question').should('be.visible');
      cy.get('[data-cy="faq-list"]').contains('Test answer').should('be.visible');

     // 8) Rediger FAQ
     cy.get('[data-cy="faq-edit-button"]').first().click();
     cy.get('[data-cy="faq-edit-question-input"]').clear().type("Updated question");
     cy.get('[data-cy="faq-edit-answer-textarea"]').clear().type("Updated answer");
     cy.get('[data-cy="faq-update-button"]').click();

      // 9) Verifiser at FAQ ble oppdatert
      cy.get('[data-cy="faq-list"]').contains('Updated question').should('be.visible');
      cy.get('[data-cy="faq-list"]').contains('Updated answer').should('be.visible');

     // 10) Slett FAQ (bruker confirm, så vi må håndtere det)
     cy.window().then((win) => {
       cy.stub(win, 'confirm').returns(true);
     });
     cy.get('[data-cy="faq-delete-button"]').first().click();

       // 11) Verifiser at FAQ ble slettet
       cy.contains('Ingen FAQs ennå').should('be.visible');

    // 12) Lukk modal
    cy.get('[data-cy="faq-modal-close-button"]').click();
    cy.contains("FAQ for").should("not.be.visible");
  });
});