/// <reference types="cypress" />

describe('Create Stallplass (Box)', () => {
  beforeEach(() => {
    cy.login();
  });

  it('creates a box with all fields filled', () => {
    const unique = Date.now();
    const stableName = `Cypress Stall ${unique}`;

    cy.visit('/dashboard?tab=stables');

    // Create a stable via UI (same flow as create-stable)
    cy.dataCy('add-stable-button').click();
    cy.dataCy('create-stable-form').should('exist');
    // Use React-safe setter to avoid flaky typing in modals
    cy.setReactInput('[data-cy="stable-name-input"]', stableName);
    cy.dataCy('stable-name-input').should('have.value', stableName);
    cy.intercept('GET', 'https://ws.geonorge.no/adresser/v1/sok*').as('geocoder');
    cy.dataCy('address-search-input').type('Oslo');
    cy.wait('@geocoder');
    // Give the dropdown time to render results in headless mode
    cy.wait(1000);
    cy.dataCy('address-search-input').type('{downarrow}{enter}');
    cy.dataCy('stable-description-input').scrollIntoView().type('Moderne stall. Fullt utstyrt. God plass.', { force: true });
    cy.get('#contactName').clear().type('Cypress Testbruker');
    cy.get('#contactEmail').clear().type('user1@test.com');
    cy.get('#contactPhone').clear().type('+4712345678');
    cy.dataCy('create-stable-form')
      .find('input[type="file"]').first().selectFile('stable.jpg', { force: true });
    cy.get('[data-cy^="amenity-"]', { timeout: 10000 }).then(($items) => {
      if ($items.length > 0) cy.wrap($items).eq(0).check({ force: true });
      if ($items.length > 1) cy.wrap($items).eq(1).check({ force: true });
    });
    // Save: wait for image upload and create (align with create-stable)
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/stables').as('createStable');
    cy.dataCy('save-stable-button').scrollIntoView().click({ force: true });
    cy.wait('@upload');
    cy.wait('@createStable');
    cy.dataCy('create-stable-form').should('not.exist');
    cy.dataCy('stables').should('exist');
    // Find the created stable by name and open the box modal
    cy.contains('h3', stableName)
      .parents('[data-cy^="stable-card-"]')
      .within(() => {
        cy.dataCy('add-box-button').click();
      });

    // Wait for box modal to mount
    cy.dataCy('box-management-form').should('exist');

    // Fill fields
    const boxName = `Boks ${unique}`;
    cy.dataCy('box-name-input')
      .scrollIntoView()
      .click({ force: true })
      .clear({ force: true })
      .type(boxName, { force: true, delay: 5 })
      .should('have.value', boxName)
      .blur();
    cy.dataCy('box-price-input').scrollIntoView().clear({ force: true }).type('5500', { force: true });
    cy.dataCy('box-type-select').scrollIntoView().select('UTEGANG', { force: true });
    cy.dataCy('box-size-select').scrollIntoView().select('MEDIUM', { force: true });
    cy.dataCy('box-max-horse-size-select').scrollIntoView().select('Medium', { force: true });
    cy.dataCy('box-size-text-input').scrollIntoView().type('3.5x3.5m, høyt tak, god ventilasjon', { force: true });
    cy.dataCy('box-description-textarea').scrollIntoView().type('Trivelig stallplass med alt du trenger.', { force: true });

    // Quantity adjustments
    cy.dataCy('quantity-increase-button').scrollIntoView().click({ force: true });
    cy.dataCy('box-quantity-input').scrollIntoView().clear({ force: true }).type('2', { force: true });

    // Dagsleie
    cy.dataCy('box-dagsleie-checkbox').scrollIntoView().check({ force: true });

    // Amenities if any
    cy.get('[data-cy^="box-amenity-"]').then(($items) => {
      if ($items.length > 0) cy.wrap($items).eq(0).check({ force: true });
      if ($items.length > 1) cy.wrap($items).eq(1).check({ force: true });
    });

    // Upload image
    cy.dataCy('box-management-form')
      .find('input[type="file"]').first().selectFile('stable.jpg', { force: true });

    // Save and ensure modal closes
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/boxes').as('createBox');
    cy.dataCy('save-box-button').scrollIntoView().click({ force: true });
    cy.wait('@upload');
    cy.wait('@createBox');
    cy.dataCy('box-management-form').should('not.exist');
  });
});
