/// <reference types="cypress" />

describe('Create Stable', () => {
  beforeEach(() => {
    cy.login();
    // Use real Geonorge; rely on server network
  });

  it('creates a stable with all fields filled', () => {
    const unique = Date.now();
    const stableName = `Cypress Stall ${unique}`;
    const faq1 = { q: 'Har dere foring inkludert?', a: 'Ja, morgen og kveld.' };
    const faq2 = { q: 'Er det krav om fast leietid?', a: 'Minst 3 måneder.' };

    cy.visit('/dashboard?tab=stables');

    // Open modal
    cy.dataCy('add-stable-button').click();

    // Wait for form to mount (exist is more robust than visible for modals)
    cy.dataCy('create-stable-form').should('exist');

    // Fill basic fields and assert full value before proceeding
    // Use React-safe setter in modal
    cy.setReactInput('[data-cy="stable-name-input"]', stableName);
    cy.dataCy('stable-name-input').should('have.value', stableName);

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

    // Add a couple of FAQs in the creation form
    cy.dataCy('faq-add-button').scrollIntoView().click({ force: true });
    cy.dataCy('faq-question-input').type(faq1.q, { force: true });
    cy.dataCy('faq-answer-textarea').type(faq1.a, { force: true });
    cy.dataCy('faq-save-button').click({ force: true });

    cy.dataCy('faq-add-button').scrollIntoView().click({ force: true });
    cy.dataCy('faq-question-input').type(faq2.q, { force: true });
    cy.dataCy('faq-answer-textarea').type(faq2.a, { force: true });
    cy.dataCy('faq-save-button').click({ force: true });

    // Save: wait for image upload and create
    cy.intercept('POST', '/api/upload').as('upload');
    cy.intercept('POST', '/api/stables').as('createStable');
    cy.intercept('PUT', /\/api\/stables\/.*\/faqs/).as('updateFaqs');
    cy.dataCy('save-stable-button').scrollIntoView().click({ force: true });
    cy.wait('@upload');
    cy.wait('@createStable').then((interception) => {
      // After creating, FAQs are persisted via PUT
      cy.wait('@updateFaqs');

      // Navigate to the public stable page to verify FAQs render
      const stableId = interception.response?.body?.id;
      if (stableId) {
        cy.visit(`/staller/${stableId}`);
        cy.contains(faq1.q).should('exist');
        cy.contains(faq2.q).should('exist');
      }
    });

    // Modal should close
    cy.dataCy('create-stable-form').should('not.exist');

    // The stables list should be visible
    cy.dataCy('stables').should('exist');
  });
});
