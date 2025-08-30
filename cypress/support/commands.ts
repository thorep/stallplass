/// <reference types="cypress" />

declare global {
  // Augment Cypress.Chainable with our custom command
  namespace Cypress {
    interface Chainable {
      /**
       * Logs in via the UI using the login page.
       * Defaults: email `user1@test.com`, password `test123`, returnUrl `/dashboard`.
       */
      login(email?: string, password?: string, returnUrl?: string): Chainable<void>;

      /**
       * Creates a new stable via UI on the dashboard stables tab.
       * Returns the generated stable name for later assertions.
       */
      createStable(options?: {
        name?: string;
        addressQuery?: string;
        descriptionLength?: number;
        amenityCount?: number;
      }): Chainable<string>;

      /**
       * Ensures at least one stable exists. If none, creates one and returns its name.
       * If one exists, returns the first stable name found.
       */
      ensureStable(options?: {
        addressQuery?: string;
        descriptionLength?: number;
        amenityCount?: number;
      }): Chainable<string>;

      /**
       * Creates a new stallplass (box) via the UI for the first stable on the page.
       * Returns the generated box name for later assertions.
       */
       createBox(options?: {
         stableName?: string;
         stableIndex?: number;
         name?: string;
         price?: number;
         size?: "SMALL" | "MEDIUM" | "LARGE";
         maxHorseSize?: "Pony" | "Small" | "Medium" | "Large";
         sizeText?: string;
         descriptionLength?: number;
         specialNotes?: string;
         /** @deprecated Use availableSpots instead */
         quantity?: number;
         /** Number of available places shown in the modal */
         availableSpots?: number;
         amenityCount?: number;
         imagePath?: string;
         openModal?: boolean;
       }): Chainable<string>;

       /**
        * Creates a new service via UI on the dashboard services tab.
        * Returns the generated service title for later assertions.
        */
       createService(options?: {
         title?: string;
         serviceType?: string;
         contactName?: string;
         descriptionLength?: number;
         priceMin?: number;
         priceMax?: number;
         county?: string;
         municipality?: string;
         imagePath?: string;
       }): Chainable<string>;
    }
  }
}

Cypress.Commands.add("login", (emailArg?: string, passwordArg?: string, returnUrlArg?: string) => {
  const email = emailArg ?? "user1@test.com";
  const password = passwordArg ?? "test123";
  const returnUrl = returnUrlArg ?? "/dashboard";

  cy.visit(`/logg-inn?returnUrl=${encodeURIComponent(returnUrl)}`);

  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);
  cy.get('[data-cy="login-button"]').click();

  // Expect redirect to returnUrl (or at least not stay on login)
  cy.location("pathname", { timeout: 20000 }).should((pathname) => {
    // allow query strings or slight variations
    expect(pathname).to.not.equal("/logg-inn");
  });
});

// Utility to generate long description text of a given length
function makeLongText(length = 300) {
  const base =
    "Dette er en moderne stall med gode fasiliteter, trivelige omgivelser og fokus på hestevelferd. " +
    "Vi tilbyr trygge bokser, gode rutiner og hyggelig miljø for både hester og eiere. ";
  let out = "";
  while (out.length < length) out += base;
  return out.slice(0, length);
}

// Ensure element is inside viewport before interaction
function ensureInView(el: Cypress.Chainable<JQuery<HTMLElement>>) {
  return el.scrollIntoView({ offset: { top: -100, left: 0 } });
}

function clickInView(el: Cypress.Chainable<JQuery<HTMLElement>>) {
  return ensureInView(el).should("be.visible").click();
}

Cypress.Commands.add(
  "createStable",
  (options?: {
    name?: string;
    addressQuery?: string;
    descriptionLength?: number;
    amenityCount?: number;
  }) => {
    const {
      name,
      addressQuery = "Oslo",
      descriptionLength = 320,
      amenityCount = 3,
    } = options || {};

    const suffix = Math.floor(Math.random() * 100000);
    const stableName = name ?? `Stall Auto ${suffix}`;

    // Assume we are already on /dashboard?tab=stables
    cy.get('[data-cy="add-stable-button"]').should("be.visible").click();
    cy.contains("Legg til ny stall").should("be.visible");

    cy.get('[data-cy="stable-name-input"]').clear().type(stableName, { delay: 0 });

    // Address select
    cy.get('[data-cy="address-search-input"]').as("addr");
    cy.get("@addr").clear().type(addressQuery);
    cy.contains("button", /Oslo gate|Oslo/i, { timeout: 10000 })
      .first()
      .click({ force: true });
    cy.contains("Valgt adresse").should("be.visible");

    // Description
    cy.get('[data-cy="stable-description-input"]').clear().type(makeLongText(descriptionLength));

    // Upload one image (stable.jpg in repo root)
    clickInView(cy.contains("button", /Velg bilder/i));
    ensureInView(cy.get('input[type="file"][accept*="image"]').first()).selectFile("stable.jpg", {
      force: true,
    });

    // Select a few amenities if present
    cy.get("body").then(($body) => {
      const boxes = $body.find('[data-cy^="amenity-"]').get();
      const count = Math.min(amenityCount, boxes.length);
      for (let i = 0; i < count; i += 1) {
        cy.wrap(boxes[i]).check({ force: true });
      }
    });

    // Save and wait modal to close
    cy.get('[data-cy="save-stable-button"]')
      .scrollIntoView()
      .should("be.visible")
      .click({ force: true });
    cy.get('[data-cy="create-stable-form"]', { timeout: 30000 }).should("not.exist");

    // Back to list
    cy.get('[data-cy="stables-list"]').should("be.visible");
    return cy.wrap(stableName);
  }
);

Cypress.Commands.add(
  "ensureStable",
  (options?: { addressQuery?: string; descriptionLength?: number; amenityCount?: number }) => {
    // If there’s already a list of stables, read the first name and return it
    return cy.get("body").then(($body) => {
      const hasList = $body.find('[data-cy="stables-list"]').length > 0;
      if (hasList) {
        // Return the first stable name
        return cy
          .get('[data-cy="stables-list"] h3')
          .first()
          .invoke("text")
          .then((txt) => txt.trim());
      }

      // Otherwise, create one
      return cy.createStable(options);
    });
  }
);

Cypress.Commands.add(
  "createBox",
  (options?: {
    stableName?: string;
    stableIndex?: number;
    name?: string;
    price?: number;
    size?: "SMALL" | "MEDIUM" | "LARGE";
    maxHorseSize?: "Pony" | "Small" | "Medium" | "Large";
    sizeText?: string;
    descriptionLength?: number;
    specialNotes?: string;
    /** @deprecated Use availableSpots instead */
    quantity?: number;
    /** Number of available places shown in the modal */
    availableSpots?: number;
    amenityCount?: number;
    imagePath?: string;
    openModal?: boolean;
  }) => {
    const {
      stableName,
      stableIndex,
      name,
      price = 4500,
      size = "MEDIUM",
      maxHorseSize = "Medium",
      sizeText = "Middels boks, ca. 3x3m.",
      descriptionLength = 230,
      specialNotes = "NB! Ikke lov med hingst",
      quantity,
      availableSpots,
      amenityCount = 2,
      imagePath = "stable.jpg",
      openModal = true,
    } = options || {};

    const spots =
      typeof availableSpots === "number"
        ? availableSpots
        : typeof quantity === "number"
        ? quantity
        : 1;

    const suffix = Math.floor(Math.random() * 100000);
    const boxName = name ?? `Stallplass ${suffix}`;

    // Open the add-box modal on the first stable
    if (openModal) {
      if (typeof stableIndex === "number") {
        cy.get('[data-cy^="stable-card-"]')
          .eq(stableIndex)
          .within(() => {
            cy.get('[data-cy="add-box-button"]')
              .scrollIntoView()
              .should("be.visible")
              .click({ force: true });
          });
      } else if (stableName) {
        cy.contains('[data-cy="stables-list"] [data-cy^="stable-card-"] h3', stableName)
          .closest('[data-cy^="stable-card-"]')
          .within(() => {
            cy.get('[data-cy="add-box-button"]')
              .scrollIntoView()
              .should("be.visible")
              .click({ force: true });
          });
      } else {
        cy.get('[data-cy="add-box-button"]')
          .first()
          .scrollIntoView()
          .should("be.visible")
          .click({ force: true });
      }
      cy.contains("Legg til ny stallplass").should("be.visible");
    }

    // Fill form
    cy.get('[data-cy="box-name-input"]').clear().type(boxName, { delay: 0 });
    cy.get('[data-cy="box-price-input"]').clear().type(String(price));
    cy.get('[data-cy="box-size-select"]').select(size);
    cy.get('[data-cy="box-max-horse-size-select"]').select(maxHorseSize);
    cy.get('[data-cy="box-size-text-input"]').clear().type(sizeText);
    cy.get('[data-cy="box-description-textarea"]').clear().type(makeLongText(descriptionLength));
    cy.get("#specialNotes").clear().type(specialNotes);
    cy.get('[data-cy="box-quantity-input"]').clear().type(String(spots));

    // Select a few amenities if present
    cy.get("body").then(($body) => {
      const boxes = $body.find('[data-cy^="box-amenity-"]').get();
      const take = Math.min(amenityCount, boxes.length);
      for (let i = 0; i < take; i += 1) {
        cy.wrap(boxes[i]).check({ force: true });
      }
    });

    // Upload image — set intercept BEFORE selecting file
    cy.intercept({ method: "POST", url: /\/api\/upload$/ }).as("imgUpload");
    clickInView(cy.contains("button", /Velg bilder/i));
    ensureInView(cy.get('input[type="file"][accept*="image"]').first()).selectFile(imagePath, {
      force: true,
    });
    // Wait until image upload finishes before saving

    // Intercept create request to wait on server confirmation
    // Match either /api/boxes or /api/stables/:id/boxes
    cy.intercept("POST", /\/api\/(stables\/[^/]+\/)?boxes$/).as("createBoxReq");

    // Save and wait for modal to disappear
    cy.get('[data-cy="save-box-button"]', { timeout: 60000 })
      .scrollIntoView()
      .should("be.visible")
      .should("not.be.disabled")
      .click({ force: true });
    // Intercept image upload(s) to Supabase Storage (local dev) or your API proxy
    // Wait for server to accept the creation
    cy.wait(["@imgUpload", "@createBoxReq"], { timeout: 60000 }).then(([upload, create]) => {
      expect(upload.response?.statusCode).to.be.oneOf([200, 204]);
      expect(create.response?.statusCode).to.be.oneOf([200, 201]);
    });

    // And then wait for the modal to disappear
    // cy.get('[data-cy="box-management-form"]', { timeout: 60000 }).should("not.exist");

    return cy.wrap(boxName);
  }
);

Cypress.Commands.add(
  "createService",
  (options?: {
    title?: string;
    serviceType?: string;
    contactName?: string;
    descriptionLength?: number;
    priceMin?: number;
    priceMax?: number;
    county?: string;
    municipality?: string;
    imagePath?: string;
  }) => {
    const {
      title,
      serviceType = "Veterinær",
      contactName,
      descriptionLength = 200,
      priceMin,
      priceMax,
      county = "Oslo",
      municipality,
      imagePath = "stable.jpg",
    } = options || {};

    const suffix = Math.floor(Math.random() * 100000);
    const serviceTitle = title ?? `Tjeneste Auto ${suffix}`;
    const serviceContactName = contactName ?? `Kontakt ${suffix}`;

    // Assume we are already on /dashboard?tab=services
    cy.get('[data-cy="add-service-button"]').should("be.visible").click();
    cy.contains("Opprett ny tjeneste").should("be.visible");

    // Fill basic information
    cy.get('[data-cy="service-form"]').within(() => {
      // Title
      cy.get('#title').clear().type(serviceTitle, { delay: 0 });

      // Service type - wait for dropdown to load and select by display name
      cy.get('#service_type').should('not.be.disabled').select(serviceType);

      // Contact name
      cy.get('#contact_name').clear().type(serviceContactName, { delay: 0 });

      // Description
      cy.get('#description').clear().type(makeLongText(descriptionLength));

      // Price range (optional)
      if (priceMin !== undefined) {
        cy.get('input[placeholder*="Fra"]').clear().type(String(priceMin));
      }
      if (priceMax !== undefined) {
        cy.get('input[placeholder*="Til"]').clear().type(String(priceMax));
      }

      // Service areas - select county
      cy.get('label').contains('Fylke').parent().find('select').select(county);

      // If municipality is specified, select it
      if (municipality) {
        cy.get('label').contains('Kommune').parent().find('select').select(municipality);
      }

      // Upload image (optional)
      if (imagePath) {
        cy.contains("button", /Velg bilder/i).click();
        cy.get('input[type="file"][accept*="image"]').first().selectFile(imagePath, {
          force: true,
        });
      }

      // Submit
      cy.get('button[type="submit"]').contains('Opprett').click();
    });

    // Wait for modal to close and service to appear in list
    cy.get('[data-cy="service-form"]', { timeout: 30000 }).should("not.exist");
    cy.get('[data-cy="services"]').should("be.visible");

    return cy.wrap(serviceTitle);
  }
);

export {};
