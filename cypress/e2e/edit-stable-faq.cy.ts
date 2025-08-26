/// <reference types="cypress" />

describe('Edit Stable FAQ', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a stable, then edits its FAQ', () => {
    const unique = Date.now();
    const stableName = `FAQ Edit Stall ${unique}`;
    const faqQ = 'Har dere utegang?';
    const faqA = 'Ja, begrenset kapasitet.';
    const updatedA = 'Ja, med plass til 5 hester.';

    cy.visit('/dashboard?tab=stables');

    // Create a simple stable first
    cy.dataCy('add-stable-button').click();
    cy.dataCy('create-stable-form').should('exist');
    cy.setReactInput('[data-cy="stable-name-input"]', stableName);
    cy.dataCy('stable-name-input').should('have.value', stableName);

    cy.intercept('GET', 'https://ws.geonorge.no/adresser/v1/sok*').as('geocoder');
    cy.dataCy('address-search-input').type('Oslo');
    cy.wait('@geocoder');
    cy.wait(1000);
    cy.dataCy('address-search-input').type('{downarrow}{enter}');

    cy.dataCy('stable-description-input').type('Stall for FAQ-redigering test.');

    cy.dataCy('create-stable-form')
      .find('input[type="file"]')
      .first()
      .selectFile('stable.jpg', { force: true });

    // Add one FAQ in the creation form
    cy.dataCy('faq-add-button').scrollIntoView().click({ force: true });
    cy.dataCy('faq-question-input').type(faqQ, { force: true });
    cy.dataCy('faq-answer-textarea').type(faqA, { force: true });
    cy.dataCy('faq-save-button').click({ force: true });

    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/stables').as('createStable');
    cy.intercept('PUT', /\/api\/stables\/.*\/faqs/).as('updateFaqs');
    cy.dataCy('save-stable-button').click({ force: true });
    cy.wait('@upload');
    cy.wait('@createStable').then((interception) => {
      cy.wait('@updateFaqs');
      const stableId = interception.response?.body?.id;

      // Open FAQ Management Modal for this stable from dashboard
      cy.visit('/dashboard?tab=stables');
      // Find the card that contains our stable name
      cy.contains(stableName)
        .parents('[data-cy^="stable-card-"]')
        .as('stableCard');

      cy.get('@stableCard').within(() => {
        cy.dataCy('add-faq-button').click();
      });

      // In modal, ensure our FAQ exists then edit it
      cy.get('[data-cy="faq-list"]').within(() => {
        cy.contains(faqQ).should('exist');
        // Click edit on the first FAQ
        cy.dataCy('faq-edit-button').first().click();
      });

      // Update answer
      cy.dataCy('faq-update-button').should('exist');
      cy.get('textarea').clear().type(updatedA, { force: true });
      cy.dataCy('faq-update-button').click();

      // Verify updated answer is visible
      cy.contains(updatedA).should('exist');

      // Close modal
      cy.contains('Lukk').click();
    });
  });
});
