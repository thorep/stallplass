function baseFillStable({
  name,
  addAmenities = true,
  addFaqs = true,
}: { name: string; addAmenities?: boolean; addFaqs?: boolean }) {
  cy.login();
  cy.visit("/dashboard?tab=stables");
  cy.get('[data-cy="add-stable-button"]', { timeout: 15000 }).should("be.visible").click();

  cy.get('[data-cy="new-stable-modal"]', { timeout: 15000 }).should("be.visible");

  cy.get('[data-cy="stable-name-input"]').clear().type(name).should("have.value", name);

  cy.get('[data-cy="address-search-input"]').clear().type("Oslo");
  cy.contains("button", "Oslo", { timeout: 15000 }).first().click();

  const beskrivelse =
    "Moderne stall med romslige bokser, lyse fellesområder og flotte turmuligheter. Kort vei til Oslo og kollektiv.";
  cy.get('[data-cy="stable-description-input"]').clear().type(beskrivelse).should("have.value", beskrivelse);

  // Image upload and description
  cy.get('[data-cy="image-file-input"]').first().selectFile('stable.jpg', { force: true });
  cy.contains('span', 'Bilde 1', { timeout: 10000 }).should('be.visible');
  cy.get('[data-cy="image-description-open"]').click();
  cy.get('[data-cy="image-description-input"]').clear().type('Beskrivelse for bilde 1');
  cy.get('[data-cy="image-description-save-button"]').click();
  cy.get('[data-cy="image-description-text"]').should('contain', 'Beskrivelse for bilde 1');

  if (addAmenities) {
    cy.get('input[type="checkbox"][data-cy^="amenity-"]', { timeout: 10000 }).then(($boxes) => {
      expect($boxes.length).to.be.gte(5);
      for (let i = 0; i < 5; i += 1) {
        cy.wrap($boxes[i]).scrollIntoView().check({ force: true }).should('be.checked');
      }
    });
  }

  if (addFaqs) {
    cy.get('[data-cy="faq-add-first-button"]').should('be.visible').click();
    cy.get('[data-cy="faq-question-input"]').type('Hva er oppstallingspris?');
    cy.get('[data-cy="faq-answer-textarea"]').type('Oppstalling koster 5000 kr per måned.');
    cy.get('[data-cy="faq-save-button"]').click();

    cy.get('[data-cy="faq-add-button"]').click();
    cy.get('[data-cy="faq-question-input"]').type('Er det paddock inkludert?');
    cy.get('[data-cy="faq-answer-textarea"]').type('Ja, daglig utslipp i paddock er inkludert.');
    cy.get('[data-cy="faq-save-button"]').click();

    cy.get('[data-cy="faq-list"]').should('contain', 'Hva er oppstallingspris?')
      .and('contain', 'Er det paddock inkludert?');
  }
}

function submitAndVerify(name: string) {
  cy.intercept('POST', '/api/upload').as('upload');
  cy.intercept('POST', '/api/stables').as('createStable');

  cy.get('[data-cy="save-stable-button"]').should('be.enabled').click();

  cy.wait('@upload', { timeout: 30000 }).its('response.statusCode').should('eq', 200);
  cy.wait('@createStable', { timeout: 30000 }).its('response.statusCode').should('eq', 201);

  cy.url({ timeout: 20000 }).should('include', '/dashboard?tab=stables');
  cy.get('[data-cy="stables-list"]', { timeout: 20000 })
    .find('[data-cy="stable-name-heading"]').contains(name);
}

describe('create-stable', () => {
  it('full flow with contact name + phone', () => {
    const name = 'Stall Prestbøen';
    baseFillStable({ name });
    // Contact info
    cy.get('[data-cy="contact-name-input"]').clear().type('Thor Prestbøen');
    cy.get('[data-cy="contact-phone-input"]').clear().type('98231631');
    submitAndVerify(name);
  });
});

describe('create-stable variants', () => {
  it('no contact info (name/email/phone blank)', () => {
    const name = 'Stall Prestbøen - uten kontaktinfo';
    baseFillStable({ name });
    cy.get('[data-cy="contact-name-input"]').clear();
    cy.get('[data-cy="contact-email-input"]').clear();
    cy.get('[data-cy="contact-phone-input"]').clear();
    submitAndVerify(name);
  });

  it('only contact name', () => {
    const name = 'Stall Prestbøen - kun navn';
    baseFillStable({ name });
    cy.get('[data-cy="contact-name-input"]').clear().type('Thor Prestbøen');
    cy.get('[data-cy="contact-email-input"]').clear();
    cy.get('[data-cy="contact-phone-input"]').clear();
    submitAndVerify(name);
  });

  it('only phone', () => {
    const name = 'Stall Prestbøen - kun tlf';
    baseFillStable({ name });
    cy.get('[data-cy="contact-name-input"]').clear();
    cy.get('[data-cy="contact-email-input"]').clear();
    cy.get('[data-cy="contact-phone-input"]').clear().type('98231631');
    submitAndVerify(name);
  });

  it('only email', () => {
    const name = 'Stall Prestbøen - kun epost';
    baseFillStable({ name });
    cy.get('[data-cy="contact-name-input"]').clear();
    cy.get('[data-cy="contact-email-input"]').clear().type('test+onlyemail@example.com');
    cy.get('[data-cy="contact-phone-input"]').clear();
    submitAndVerify(name);
  });

  it('without FAQ', () => {
    const name = 'Stall Prestbøen - uten FAQ';
    baseFillStable({ name, addFaqs: false });
    cy.get('[data-cy="faq-list"]').should('not.exist');
    submitAndVerify(name);
  });

  it('without amenities', () => {
    const name = 'Stall Prestbøen - uten fasiliteter';
    baseFillStable({ name, addAmenities: false });
    submitAndVerify(name);
  });
});
