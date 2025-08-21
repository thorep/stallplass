/// <reference types="cypress" />

describe('Create Horse Wanted (Ønskes kjøpt)', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a horse wanted ad with required fields', () => {
    const unique = Date.now();
    cy.visit('/dashboard?tab=horse-sales');

    // Prepare reference data
    cy.intercept('GET', '/api/horse-breeds').as('horseBreeds');
    cy.intercept('GET', '/api/horse-disciplines').as('horseDisciplines');

    // Open create modal
    cy.dataCy('add-horse-buy-button').click();

    // Wait for breeds/disciplines (optional in UI, but stabilize test)
    cy.wait(['@horseBreeds', '@horseDisciplines']);

    // Fill required fields
    cy.get('#name').type(`Ønskes kjøpt ${unique}`);
    cy.get('#description').type('Ser etter trygg og stabil hest for allsidig bruk.');
    cy.get('#contactName').clear().type('Cypress Testbruker');

    // Optional: set simple ranges
    cy.get('input[placeholder="0"]').first().type('10000');
    cy.get('input[placeholder="500000"]').first().type('80000');

    // Upload one image (same approach as other tests)
    cy.dataCy('horse-buy-form')
      .find('input[type="file"]').first().selectFile('stable.jpg', { force: true });

    // Submit and verify upload + create requests are made
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/horse-buys').as('createHorseBuy');
    cy.dataCy('horse-buy-form').within(() => {
      cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    });
    cy.wait('@upload');
    cy.wait('@createHorseBuy');
  });
});
