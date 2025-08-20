/// <reference types="cypress" />

describe('Create Horse For Sale', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a horse sale listing with all fields', () => {
    const unique = Date.now();
    cy.visit('/dashboard?tab=horse-sales');

    cy.intercept('GET', '/api/horse-breeds').as('horseBreeds');
    cy.intercept('GET', '/api/horse-disciplines').as('horseDisciplines');
    cy.dataCy('add-horse-sale-button').click();

    // Basic info via TanStack form fields: ids are used
    cy.get('#name').type(`Hest til salgs ${unique}`);
    cy.get('#description').type('Trygg, fremover, godt temperament. Passer aktiv hobby.');

    // Price, Age
    cy.get('#price').clear().type('25000');
    cy.get('#age').clear().type('8');

    // Gender
    cy.get('#gender').select('HOPPE');

    // Height
    cy.get('#height').clear().type('160');

    // Breed and Discipline: wait for real API options, then select first
    cy.wait(['@horseBreeds', '@horseDisciplines']);
    cy.get('#breedId').find('option').then(($opts) => {
      const val = $opts.eq(1).val() || $opts.eq(0).val();
      if (val) cy.get('#breedId').select(val as string);
    });
    cy.get('#disciplineId').find('option').then(($opts) => {
      const val = $opts.eq(1).val() || $opts.eq(0).val();
      if (val) cy.get('#disciplineId').select(val as string);
    });

    // Size
    cy.get('#size').select('KATEGORI_1');

    // Address search
    cy.intercept('GET', 'https://ws.geonorge.no/adresser/v1/sok*').as('geocoder');
    cy.dataCy('address-search-input').type('Oslo');
    cy.wait('@geocoder');
    // Allow dropdown to render in headless mode
    cy.wait(1000);
    cy.dataCy('address-search-input').type('{downarrow}{enter}');

    // Contact
    cy.get('#contactName').clear().type('Cypress Testbruker');
    cy.get('#contactEmail').clear().type('user1@test.com');
    cy.get('#contactPhone').clear().type('+4712345678');

    // Upload image
    cy.dataCy('horse-sale-form')
      .find('input[type="file"]').first().selectFile('stable.jpg', { force: true });

    // Submit and wait for upload + create
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/horse-sales').as('createHorseSale');
    cy.dataCy('horse-sale-form').within(() => {
      cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    });
    cy.wait('@upload');
    cy.wait('@createHorseSale');
  });
});
