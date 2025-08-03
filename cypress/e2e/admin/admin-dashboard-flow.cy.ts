describe('Admin Dashboard Flow', () => {
  // Store test data to verify persistence
  let testPrices: {
    boxAdvertising: number;
    boxBoost: number;
    serviceBase: number;
  };
  
  let testDiscounts: {
    boxDiscount?: { months: number; percentage: number };
    boostDiscount?: { days: number; percentage: number };
    serviceDiscount?: { months: number; percentage: number };
  } = {};

  beforeEach(() => {
    // Login before each test to ensure fresh session
    cy.login();
    // Navigate to admin page
    cy.visit('/admin');
    // IMPORTANT: Refresh the page due to known admin dashboard bug
    cy.reload();
    // Wait for page to fully load after refresh
    cy.wait(2000);
    // Click on the Pricing tab to ensure we're on the right section
    cy.get('[data-cy="admin-tab-pricing"]').click();
    cy.get('[data-cy="pricing-section"]').should('be.visible');
  });

  describe('Base Pricing Management', () => {
    it('updates all pricing values with random numbers', () => {
      // Generate random prices for testing
      testPrices = {
        boxAdvertising: Math.floor(Math.random() * 100) + 50,
        boxBoost: Math.floor(Math.random() * 50) + 10,
        serviceBase: Math.floor(Math.random() * 80) + 20
      };
      
      cy.get('[data-cy="edit-pricing-button"]').click();
      
      cy.get('#boxAdvertisingPrice').clear().type(testPrices.boxAdvertising.toString());
      cy.get('#boxBoostPrice').clear().type(testPrices.boxBoost.toString());
      cy.get('#serviceBasePrice').clear().type(testPrices.serviceBase.toString());
      
      cy.intercept('PUT', '/api/admin/pricing/base').as('updatePricing');
      cy.get('[data-cy="save-pricing-button"]').click();
      
      cy.wait('@updatePricing').then((interception) => {
        expect(interception.response?.statusCode).to.eq(200);
      });
      
      // Verify the updated prices are displayed
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${testPrices.boxAdvertising} kr`);
      cy.get('[data-cy="box-boost-price"]').should('contain', `${testPrices.boxBoost} kr`);
      cy.get('[data-cy="service-base-price"]').should('contain', `${testPrices.serviceBase} kr`);
    });

    it('verifies pricing persistence after page refresh', () => {
      // The beforeEach already logs us in and navigates to pricing
      // Just verify the prices are still correct from the previous test
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${testPrices.boxAdvertising} kr`);
      cy.get('[data-cy="box-boost-price"]').should('contain', `${testPrices.boxBoost} kr`);
      cy.get('[data-cy="service-base-price"]').should('contain', `${testPrices.serviceBase} kr`);
    });

    it('cancels pricing edit without saving', () => {
      // beforeEach already handles login and navigation
      cy.get('[data-cy="edit-pricing-button"]').click();
      
      const testPrice = Math.floor(Math.random() * 100) + 200;
      cy.get('#boxAdvertisingPrice').clear().type(testPrice.toString());
      
      cy.get('button').contains('Avbryt').click();
      
      // Should still show the previously saved price, not the test price
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${testPrices.boxAdvertising} kr`);
      cy.get('[data-cy="box-advertising-price"]').should('not.contain', `${testPrice} kr`);
      cy.get('#boxAdvertisingPrice').should('not.exist');
    });
  });

  describe('Box Advertising Discounts Management', () => {
    it('edits box advertising discount values', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="box-discounts-section"] [data-cy="edit-discount-button"]').length > 0) {
          cy.get('[data-cy="box-discounts-section"]').within(() => {
            cy.get('[data-cy="edit-discount-button"]').first().click();
          });
          
          testDiscounts.boxDiscount = {
            months: Math.floor(Math.random() * 6) + 3,
            percentage: Math.floor(Math.random() * 20) + 10
          };
          
          cy.get('[data-cy="discount-months-input"]').clear().type(testDiscounts.boxDiscount.months.toString());
          cy.get('[data-cy="discount-percentage-input"]').clear().type(testDiscounts.boxDiscount.percentage.toString());
          
          cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateBoxDiscount');
          cy.get('[data-cy="update-discount-button"]').click();
          
          cy.wait('@updateBoxDiscount').then((interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          });
          
          cy.get('[data-cy="box-discounts-section"]').within(() => {
            cy.should('contain', `${testDiscounts.boxDiscount!.months} måneder`);
            cy.should('contain', `${testDiscounts.boxDiscount!.percentage}% rabatt`);
          });
        } else {
          cy.log('No box discounts available to edit');
        }
      });
    });
  });

  describe('Box Boost Discounts Management', () => {
    it('edits box boost discount values', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="boost-discounts-section"] [data-cy="edit-discount-button"]').length > 0) {
          cy.get('[data-cy="boost-discounts-section"]').within(() => {
            cy.get('[data-cy="edit-discount-button"]').first().click();
          });
          
          testDiscounts.boostDiscount = {
            days: Math.floor(Math.random() * 20) + 7,
            percentage: Math.floor(Math.random() * 15) + 5
          };
          
          cy.get('[data-cy="discount-days-input"]').clear().type(testDiscounts.boostDiscount.days.toString());
          cy.get('[data-cy="discount-percentage-input"]').clear().type(testDiscounts.boostDiscount.percentage.toString());
          
          cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateBoostDiscount');
          cy.get('[data-cy="update-discount-button"]').click();
          
          cy.wait('@updateBoostDiscount').then((interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          });
          
          cy.get('[data-cy="boost-discounts-section"]').within(() => {
            cy.should('contain', `${testDiscounts.boostDiscount!.days} dager`);
            cy.should('contain', `${testDiscounts.boostDiscount!.percentage}% rabatt`);
          });
        } else {
          cy.log('No boost discounts available to edit');
        }
      });
    });
  });

  describe('Service Discounts Management', () => {
    it('edits service discount values', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="service-discounts-section"] [data-cy="edit-discount-button"]').length > 0) {
          cy.get('[data-cy="service-discounts-section"]').within(() => {
            cy.get('[data-cy="edit-discount-button"]').first().click();
          });
          
          testDiscounts.serviceDiscount = {
            months: Math.floor(Math.random() * 8) + 2,
            percentage: Math.floor(Math.random() * 25) + 10
          };
          
          cy.get('[data-cy="discount-months-input"]').clear().type(testDiscounts.serviceDiscount.months.toString());
          cy.get('[data-cy="discount-percentage-input"]').clear().type(testDiscounts.serviceDiscount.percentage.toString());
          
          cy.intercept('PUT', '/api/admin/pricing/discounts').as('updateServiceDiscount');
          cy.get('[data-cy="update-discount-button"]').click();
          
          cy.wait('@updateServiceDiscount').then((interception) => {
            expect(interception.response?.statusCode).to.eq(200);
          });
          
          cy.get('[data-cy="service-discounts-section"]').within(() => {
            cy.should('contain', `${testDiscounts.serviceDiscount!.months} måneder`);
            cy.should('contain', `${testDiscounts.serviceDiscount!.percentage}% rabatt`);
          });
        } else {
          cy.log('No service discounts available to edit');
        }
      });
    });

    it('validates discount form inputs', () => {
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="service-discounts-section"] [data-cy="edit-discount-button"]').length > 0) {
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
          
          cy.get('[data-cy="cancel-discount-button"]').click();
        } else {
          cy.log('No service discounts available to test validation');
        }
      });
    });
  });

  describe('Complete Data Persistence Verification', () => {
    it('verifies all changes persist after fresh session', () => {
      // beforeEach already handles fresh login and navigation
      // Verify all pricing values are still correct
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${testPrices.boxAdvertising} kr`);
      cy.get('[data-cy="box-boost-price"]').should('contain', `${testPrices.boxBoost} kr`);
      cy.get('[data-cy="service-base-price"]').should('contain', `${testPrices.serviceBase} kr`);
      
      // Verify discount changes if they were made
      if (testDiscounts.boxDiscount) {
        cy.get('[data-cy="box-discounts-section"]').within(() => {
          cy.should('contain', `${testDiscounts.boxDiscount!.months} måneder`);
          cy.should('contain', `${testDiscounts.boxDiscount!.percentage}% rabatt`);
        });
      }
      
      if (testDiscounts.boostDiscount) {
        cy.get('[data-cy="boost-discounts-section"]').within(() => {
          cy.should('contain', `${testDiscounts.boostDiscount!.days} dager`);
          cy.should('contain', `${testDiscounts.boostDiscount!.percentage}% rabatt`);
        });
      }
      
      if (testDiscounts.serviceDiscount) {
        cy.get('[data-cy="service-discounts-section"]').within(() => {
          cy.should('contain', `${testDiscounts.serviceDiscount!.months} måneder`);
          cy.should('contain', `${testDiscounts.serviceDiscount!.percentage}% rabatt`);
        });
      }
    });

    it('logs final pricing and discount values for manual verification', () => {
      // beforeEach already handles navigation
      // Log all final values for manual database verification
      cy.get('[data-cy="box-advertising-price"]').invoke('text').then((price) => {
        cy.log(`Final Box Advertising Price: ${price}`);
      });
      
      cy.get('[data-cy="box-boost-price"]').invoke('text').then((price) => {
        cy.log(`Final Box Boost Price: ${price}`);
      });
      
      cy.get('[data-cy="service-base-price"]').invoke('text').then((price) => {
        cy.log(`Final Service Base Price: ${price}`);
      });
      
      cy.log('Test Data Summary:');
      cy.log(`Box Advertising: ${testPrices.boxAdvertising} kr`);
      cy.log(`Box Boost: ${testPrices.boxBoost} kr`);
      cy.log(`Service Base: ${testPrices.serviceBase} kr`);
      
      if (testDiscounts.boxDiscount) {
        cy.log(`Box Discount: ${testDiscounts.boxDiscount.months} months, ${testDiscounts.boxDiscount.percentage}%`);
      }
      if (testDiscounts.boostDiscount) {
        cy.log(`Boost Discount: ${testDiscounts.boostDiscount.days} days, ${testDiscounts.boostDiscount.percentage}%`);
      }
      if (testDiscounts.serviceDiscount) {
        cy.log(`Service Discount: ${testDiscounts.serviceDiscount.months} months, ${testDiscounts.serviceDiscount.percentage}%`);
      }
    });
  });

  after(() => {
    // Simple logout - just clear session data
    cy.clearAllSessionStorage();
    cy.clearAllLocalStorage();
    cy.clearAllCookies();
  });
});