describe('Admin Dashboard Flow', () => {
  // Original pricing values to restore after tests
  let originalPricing: {
    boxAdvertising: number;
    boxBoost: number;
    serviceBase: number;
  } = {
    boxAdvertising: 10,
    boxBoost: 2, 
    serviceBase: 2
  };

  // Store original discount values for restoration
  let originalDiscounts: any = {};

  before(() => {
    // Login as admin user (user1@test.com)
    cy.login();
    
    // Navigate to admin page
    cy.visit('/admin');
    
    // Click on the Pricing tab
    cy.get('[data-cy="admin-tab-pricing"]').click();
    cy.get('[data-cy="pricing-section"]').should('be.visible');
    
    // Store original pricing values
    cy.get('[data-cy="box-advertising-price"]').invoke('text').then((text) => {
      originalPricing.boxAdvertising = parseInt(text.replace(' kr', ''));
    });
    
    cy.get('[data-cy="box-boost-price"]').invoke('text').then((text) => {
      originalPricing.boxBoost = parseInt(text.replace(' kr', ''));
    });
    
    cy.get('[data-cy="service-base-price"]').invoke('text').then((text) => {
      originalPricing.serviceBase = parseInt(text.replace(' kr', ''));
    });
  });

  beforeEach(() => {
    // Ensure we're logged in before each test
    cy.login();
    
    // Navigate to admin page
    cy.visit('/admin');
    
    // Wait for page to load and click on the Pricing tab
    cy.get('[data-cy="admin-tab-pricing"]', { timeout: 10000 }).should('be.visible').click();
    cy.get('[data-cy="pricing-section"]').should('be.visible');
  });

  describe('Base Pricing Management', () => {
    it('updates box advertising price successfully', () => {
      const newPrice = 15;
      
      // Click edit pricing button
      cy.get('[data-cy="edit-pricing-button"]').click();
      
      // Update box advertising price
      cy.get('#boxAdvertisingPrice').clear().type(newPrice.toString());
      
      // Intercept the API call to verify status 200
      cy.intercept('PUT', '/api/admin/pricing/base').as('updatePricing');
      
      // Save changes
      cy.get('[data-cy="save-pricing-button"]').click();
      
      // Verify API call succeeded
      cy.wait('@updatePricing').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      // Verify UI updates
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${newPrice} kr`);
      
      // Verify edit mode is closed
      cy.get('#boxAdvertisingPrice').should('not.exist');
    });

    it('updates box boost price successfully', () => {
      const newPrice = 3;
      
      cy.get('[data-cy="edit-pricing-button"]').click();
      cy.get('#boxBoostPrice').clear().type(newPrice.toString());
      
      cy.intercept('PUT', '/api/admin/pricing/base').as('updatePricing');
      cy.get('[data-cy="save-pricing-button"]').click();
      
      cy.wait('@updatePricing').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      cy.get('[data-cy="box-boost-price"]').should('contain', `${newPrice} kr`);
    });
    
    it('updates service base price successfully', () => {
      const newPrice = 99;
      
      cy.get('[data-cy="edit-pricing-button"]').click();
      cy.get('#serviceBasePrice').clear().type(newPrice.toString());
      
      cy.intercept('PUT', '/api/admin/pricing/base').as('updatePricing');
      cy.get('[data-cy="save-pricing-button"]').click();
      
      cy.wait('@updatePricing').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      cy.get('[data-cy="service-base-price"]').should('contain', `${newPrice} kr`);
    });

    it('updates all pricing values at once', () => {
      const newPrices = {
        boxAdvertising: 12,
        boxBoost: 4,
        serviceBase: 3
      };
      
      cy.get('[data-cy="edit-pricing-button"]').click();
      
      // Update all fields
      cy.get('#boxAdvertisingPrice').clear().type(newPrices.boxAdvertising.toString());
      cy.get('#boxBoostPrice').clear().type(newPrices.boxBoost.toString());
      cy.get('#serviceBasePrice').clear().type(newPrices.serviceBase.toString());
      
      cy.intercept('PUT', '/api/admin/pricing/base').as('updatePricing');
      cy.get('[data-cy="save-pricing-button"]').click();
      
      cy.wait('@updatePricing').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      // Verify all prices updated in UI
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${newPrices.boxAdvertising} kr`);
      cy.get('[data-cy="box-boost-price"]').should('contain', `${newPrices.boxBoost} kr`);
      cy.get('[data-cy="service-base-price"]').should('contain', `${newPrices.serviceBase} kr`);
    });

    it('cancels pricing edit without saving', () => {
      cy.get('[data-cy="edit-pricing-button"]').click();
      
      // Change values but don't save
      cy.get('#boxAdvertisingPrice').clear().type('999');
      
      // Cancel
      cy.get('button').contains('Avbryt').click();
      
      // Verify original values remain
      cy.get('[data-cy="box-advertising-price"]').should('not.contain', '999 kr');
      cy.get('#boxAdvertisingPrice').should('not.exist');
    });
  });

  describe('Box Advertising Discounts Management', () => {
    it('edits box advertising discount successfully', () => {
      // Find first box discount and edit it
      cy.get('[data-cy="box-discounts-section"]').within(() => {
        cy.get('[data-cy="edit-discount-button"]').first().click();
      });
      
      // Update discount values
      const newPercentage = 25.5;
      cy.get('[data-cy="discount-percentage-input"]').clear().type(newPercentage.toString());
      
      // Make discount inactive
      cy.get('[data-cy="discount-active-checkbox"]').uncheck();
      
      cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateDiscount');
      cy.get('[data-cy="update-discount-button"]').click();
      
      cy.wait('@updateDiscount').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      // Verify UI updates
      cy.get('[data-cy="box-discounts-section"]').within(() => {
        cy.should('contain', `${newPercentage}% rabatt`);
        cy.should('contain', 'Inaktiv');
      });
    });

    it('deletes box advertising discount', () => {
      // Count initial discounts
      cy.get('[data-cy="box-discounts-section"] [data-cy="edit-discount-button"]').then(($buttons) => {
        const initialCount = $buttons.length;
        
        if (initialCount > 0) {
          // Delete first discount
          cy.get('[data-cy="box-discounts-section"]').within(() => {
            cy.get('[data-cy="delete-discount-button"]').first().click();
          });
          
          // Confirm deletion
          cy.on('window:confirm', () => true);
          
          cy.intercept('DELETE', '/api/admin/pricing/discounts*').as('deleteDiscount');
          
          cy.wait('@deleteDiscount').then((interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          });
          
          // Verify discount count decreased
          cy.get('[data-cy="box-discounts-section"] [data-cy="edit-discount-button"]').should('have.length', initialCount - 1);
        }
      });
    });
  });

  describe('Boost Discounts Management', () => {
    it('edits boost discount successfully', () => {
      cy.get('[data-cy="boost-discounts-section"]').within(() => {
        cy.get('[data-cy="edit-discount-button"]').first().click();
      });
      
      const newDays = 14;
      const newPercentage = 30.0;
      
      cy.get('[data-cy="discount-days-input"]').clear().type(newDays.toString());
      cy.get('[data-cy="discount-percentage-input"]').clear().type(newPercentage.toString());
      
      cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateDiscount');
      cy.get('[data-cy="update-discount-button"]').click();
      
      cy.wait('@updateDiscount').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      cy.get('[data-cy="boost-discounts-section"]').within(() => {
        cy.should('contain', `${newDays} dager`);
        cy.should('contain', `${newPercentage}% rabatt`);
      });
    });

    it('toggles boost discount active status', () => {
      cy.get('[data-cy="boost-discounts-section"]').within(() => {
        // Check current status
        cy.get('.bg-green-100, .bg-red-100').first().then(($statusBadge) => {
          const isCurrentlyActive = $statusBadge.hasClass('bg-green-100');
          
          // Edit the discount
          cy.get('[data-cy="edit-discount-button"]').first().click();
          
          // Toggle active status
          if (isCurrentlyActive) {
            cy.get('[data-cy="discount-active-checkbox"]').uncheck();
          } else {
            cy.get('[data-cy="discount-active-checkbox"]').check();
          }
          
          cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateDiscount');
          cy.get('[data-cy="update-discount-button"]').click();
          
          cy.wait('@updateDiscount').then((interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          });
          
          // Verify status changed
          const expectedStatus = isCurrentlyActive ? 'Inaktiv' : 'Aktiv';
          cy.should('contain', expectedStatus);
        });
      });
    });
  });

  describe('Service Discounts Management', () => {
    it('edits service discount successfully', () => {
      cy.get('[data-cy="service-discounts-section"]').within(() => {
        cy.get('[data-cy="edit-discount-button"]').first().click();
      });
      
      const newMonths = 6;
      const newPercentage = 20.0;
      
      cy.get('[data-cy="discount-months-input"]').clear().type(newMonths.toString());
      cy.get('[data-cy="discount-percentage-input"]').clear().type(newPercentage.toString());
      
      cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateDiscount');
      cy.get('[data-cy="update-discount-button"]').click();
      
      cy.wait('@updateDiscount').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      cy.get('[data-cy="service-discounts-section"]').within(() => {
        cy.should('contain', `${newMonths} måneder`);
        cy.should('contain', `${newPercentage}% rabatt`);
      });
    });

    it('validates service discount form inputs', () => {
      cy.get('[data-cy="service-discounts-section"]').within(() => {
        cy.get('[data-cy="edit-discount-button"]').first().click();
      });
      
      // Test invalid months (0)
      cy.get('[data-cy="discount-months-input"]').clear().type('0');
      cy.get('[data-cy="update-discount-button"]').click();
      cy.should('contain', 'Måneder må være minst 1');
      
      // Test invalid percentage (0)
      cy.get('[data-cy="discount-months-input"]').clear().type('3');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('0');
      cy.get('[data-cy="update-discount-button"]').click();
      cy.should('contain', 'Rabatt må være mellom 0.1% og 100%');
      
      // Test invalid percentage (over 100)
      cy.get('[data-cy="discount-percentage-input"]').clear().type('150');
      cy.get('[data-cy="update-discount-button"]').click();
      cy.should('contain', 'Rabatt må være mellom 0.1% og 100%');
      
      // Cancel to avoid saving invalid data
      cy.get('[data-cy="cancel-discount-button"]').click();
    });

    it('cancels service discount edit', () => {
      cy.get('[data-cy="service-discounts-section"]').within(() => {
        // Get original values
        cy.get('.font-medium').first().invoke('text').then((originalText) => {
          cy.get('[data-cy="edit-discount-button"]').first().click();
          
          // Change values
          cy.get('[data-cy="discount-months-input"]').clear().type('999');
          cy.get('[data-cy="discount-percentage-input"]').clear().type('99.9');
          
          // Cancel
          cy.get('[data-cy="cancel-discount-button"]').click();
          
          // Verify original values remain
          cy.get('.font-medium').first().should('contain', originalText);
        });
      });
    });
  });

  describe('API Error Handling', () => {
    it('handles pricing update API errors gracefully', () => {
      // Intercept and force error response
      cy.intercept('PUT', '/api/admin/pricing/base', { 
        statusCode: 500, 
        body: { error: 'Server error' } 
      }).as('updatePricingError');
      
      cy.get('[data-cy="edit-pricing-button"]').click();
      cy.get('#boxAdvertisingPrice').clear().type('50');
      cy.get('[data-cy="save-pricing-button"]').click();
      
      cy.wait('@updatePricingError');
      
      // Should remain in edit mode and show error state
      cy.get('#boxAdvertisingPrice').should('exist');
    });

    it('handles discount update API errors gracefully', () => {
      cy.intercept('PUT', '/api/admin/pricing/discounts', { 
        statusCode: 500, 
        body: { error: 'Server error' } 
      }).as('updateDiscountError');
      
      cy.get('[data-cy="box-discounts-section"]').within(() => {
        cy.get('[data-cy="edit-discount-button"]').first().click();
      });
      
      cy.get('[data-cy="discount-percentage-input"]').clear().type('15');
      cy.get('[data-cy="update-discount-button"]').click();
      
      cy.wait('@updateDiscountError');
      
      // Should remain in edit mode
      cy.get('[data-cy="discount-percentage-input"]').should('exist');
    });
  });

  after(() => {
    // Restore original pricing values
    cy.visit('/admin');
    
    // Click on the Pricing tab
    cy.get('[data-cy="admin-tab-pricing"]').click();
    cy.get('[data-cy="pricing-section"]').should('be.visible');
    
    cy.get('[data-cy="edit-pricing-button"]').click();
    
    cy.get('#boxAdvertisingPrice').clear().type(originalPricing.boxAdvertising.toString());
    cy.get('#boxBoostPrice').clear().type(originalPricing.boxBoost.toString());
    cy.get('#serviceBasePrice').clear().type(originalPricing.serviceBase.toString());
    
    cy.get('[data-cy="save-pricing-button"]').click();
    
    // Wait for update to complete
    cy.get('[data-cy="box-advertising-price"]').should('contain', `${originalPricing.boxAdvertising} kr`);
    
    // Logout to clean up session for next test suite
    cy.clearAllSessionStorage();
    cy.clearAllLocalStorage();
    cy.clearAllCookies();
  });
});