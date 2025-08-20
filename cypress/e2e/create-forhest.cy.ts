/// <reference types="cypress" />

describe('Create Fôrhest', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a fôrhest with all fields', () => {
    const unique = Date.now();
    cy.visit('/dashboard?tab=forhest');

    cy.dataCy('add-forhest-button').click();

    cy.dataCy('horse-name-input').type(`Forhest ${unique}`);
    cy.dataCy('horse-description-input').type('Rolig og trygg hest som passer for ryttare på alle nivåer.');

    // Address
    cy.intercept('GET', 'https://ws.geonorge.no/adresser/v1/sok*').as('geocoder');
    cy.dataCy('address-search-input').type('Oslo');
    cy.wait('@geocoder');
    // Allow dropdown to render in headless mode
    cy.wait(1000);
    cy.dataCy('address-search-input').type('{downarrow}{enter}');

    // Contact (optional)
    cy.get('#contactName').clear().type('Cypress Testbruker');
    cy.get('#contactEmail').clear().type('user1@test.com');
    cy.get('#contactPhone').clear().type('+4712345678');

    // Upload image
    cy.dataCy('part-loan-horse-form')
      .find('input[type="file"]').first().selectFile('stable.jpg', { force: true });

    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/part-loan-horses').as('createPLH');
    cy.dataCy('save-horse-button').scrollIntoView().click({ force: true });
    cy.wait('@upload');
    cy.wait('@createPLH');
    cy.dataCy('part-loan-horse-form').should('not.exist');
  });
});
