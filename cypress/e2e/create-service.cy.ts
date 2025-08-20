/// <reference types="cypress" />

describe('Create Service', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a service with all fields', () => {
    const unique = Date.now();
    cy.visit('/dashboard?tab=services');

    cy.intercept('GET', '/api/service-types').as('serviceTypes');
    cy.dataCy('add-service-button').click();

    // Basic info
    cy.get('#title').type(`Veterinærtjenester ${unique}`);
    cy.wait('@serviceTypes');
    cy.get('#service_type').find('option').then(($opts) => {
      const first = $opts.eq(0).val();
      if (first) cy.get('#service_type').select(first as string);
    });

    // Contact
    cy.get('#contact_name').type('Cypress Vet');
    cy.get('#contact_email').clear().type('user1@test.com');
    cy.get('#contact_phone').type('+4712345678');

    // Address
    cy.intercept('GET', 'https://ws.geonorge.no/adresser/v1/sok*').as('geocoder');
    cy.dataCy('address-search-input').type('Oslo');
    cy.wait('@geocoder');
    // Allow dropdown to render in headless mode
    cy.wait(1000);
    cy.dataCy('address-search-input').type('{downarrow}{enter}');

    // Description
    cy.get('#description').type('Full mobile veterinærtjeneste med akuttberedskap.');

    // Price range
    cy.get('input[placeholder="Fra (NOK)"]').type('1000');
    cy.get('input[placeholder="Til (NOK)"]').type('5000');

    // Coverage areas: pick first fylke and optionally a kommune
    cy.contains('label', 'Fylke').parent().find('select').first().then(($f) => {
      const val = $f.find('option').eq(1).val(); // skip placeholder
      if (val) cy.wrap($f).select(val as string);
    });
    cy.contains('label', 'Kommune').parent().find('select').first().then(($k) => {
      const val = $k.find('option').eq(1).val(); // first kommune or "Hele fylket"
      if (val) cy.wrap($k).select(val as string);
    });

    // Upload one image
    cy.dataCy('service-form')
      .find('input[type="file"]').first().selectFile('stable.jpg', { force: true });

    // Submit and wait for upload + create
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/services').as('createService');
    cy.dataCy('service-form').within(() => {
      cy.get('button[type="submit"]').click();
    });
    cy.wait('@upload');
    cy.wait('@createService');
  });
});
