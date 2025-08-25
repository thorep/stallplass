/// <reference types="cypress" />

describe('Create Stable', () => {
  beforeEach(() => {
    cy.login();
    // Use real Geonorge; rely on server network
  });

  it('creates a stable with all fields filled', () => {
    const unique = Date.now();
    const stableName = `Cypress Stall ${unique}`;

    cy.visit('/dashboard?tab=stables');

    // Open modal
    cy.dataCy('add-stable-button').click();

    // Fill basic fields and assert full value before proceeding
    cy.dataCy('create-stable-form').should('be.visible');
    cy.dataCy('stable-name-input')
      .scrollIntoView()
      .click()
      .clear()
      .type(stableName, { delay: 5 })
      .should('have.value', stableName)
      .blur();

    // Address search: type and pick first result via keyboard
    cy.intercept('GET', 'https://ws.geonorge.no/adresser/v1/sok*').as('geocoder');
    cy.dataCy('address-search-input').type('Oslo');
    cy.wait('@geocoder');
    // Allow dropdown to render in headless mode
    cy.wait(1000);
    cy.dataCy('address-search-input').type('{downarrow}{enter}');

    cy.dataCy('stable-description-input').scrollIntoView().type('Moderne stall. Fullt utstyrt. God plass.', { force: true });

    // Contact info (optional)
    cy.get('#contactName').clear().type('Cypress Testbruker');
    cy.get('#contactEmail').clear().type('user1@test.com');
    cy.get('#contactPhone').clear().type('+4712345678');

    // Upload image (use existing repo image)
    cy.dataCy('create-stable-form')
      .find('input[type="file"]')
      .first()
      .selectFile('stable.jpg', { force: true });

    // Pick a couple of amenities if present
    cy.get('[data-cy^="amenity-"]', { timeout: 10000 }).then(($items) => {
      if ($items.length > 0) {
        cy.wrap($items).eq(0).check({ force: true });
      }
      if ($items.length > 1) {
        cy.wrap($items).eq(1).check({ force: true });
      }
    });

    // Save: wait for image upload and create
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/stables').as('createStable');
    cy.dataCy('save-stable-button').scrollIntoView().click({ force: true });
    cy.wait('@upload');
    cy.wait('@createStable');

    // Modal should close
    cy.dataCy('create-stable-form').should('not.exist');

    // The stables list should be visible
    cy.dataCy('stables').should('exist');
  });
});
