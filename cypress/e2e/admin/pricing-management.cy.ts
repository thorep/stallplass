describe('Admin Pricing Management', () => {
  // Generate random values for each test run
  const randomBoxPrice = Math.floor(Math.random() * 20) + 10; // 10-29 kr
  const randomBoostPrice = Math.floor(Math.random() * 5) + 3; // 3-7 kr  
  const randomServicePrice = Math.floor(Math.random() * 3) + 2; // 2-4 kr
  
  const randomBoxDiscount = Math.floor(Math.random() * 15) + 10; // 10-24%
  const randomBoostDiscount = Math.floor(Math.random() * 10) + 8; // 8-17%
  const randomServiceDiscount = Math.floor(Math.random() * 12) + 12; // 12-23%

  beforeEach(() => {
    // Login as admin user (user1@test.com is admin)
    cy.login('user1@test.com', 'test123');
    
    // Navigate directly to admin page
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    
    // Wait for admin access check and page to load
    cy.contains('Admin Dashboard', { timeout: 15000 }).should('be.visible');
    
    // Click on Priser (Pricing) tab in the admin dashboard
    cy.get('[data-cy="admin-tab-pricing"]').click();
    
    // Wait for pricing content to be visible
    cy.contains('Priser', { timeout: 10000 }).should('be.visible');
    cy.contains('Boksannonsering').should('be.visible');
    
    // Look for the pricing section or edit button to confirm we're on the right tab
    cy.get('[data-cy="pricing-section"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Base Pricing Updates', () => {
    it('should update all base prices and reflect on /priser page', () => {
      cy.log(`Using random prices - Box: ${randomBoxPrice}kr, Boost: ${randomBoostPrice}kr, Service: ${randomServicePrice}kr`);
      
      // Test updating base prices
      cy.get('[data-cy="edit-pricing-button"]').click();
      
      // Update box advertising price
      cy.get('#boxAdvertisingPrice').clear().type(randomBoxPrice.toString());
      
      // Update box boost price  
      cy.get('#boxBoostPrice').clear().type(randomBoostPrice.toString());
      
      // Update service base price
      cy.get('#serviceBasePrice').clear().type(randomServicePrice.toString());
      
      // Save changes
      cy.get('[data-cy="save-pricing-button"]').click();
      
      // Verify success and UI updates
      cy.get('[data-cy="box-advertising-price"]').should('contain', `${randomBoxPrice} kr`);
      cy.get('[data-cy="box-boost-price"]').should('contain', `${randomBoostPrice} kr`);
      cy.get('[data-cy="service-base-price"]').should('contain', `${randomServicePrice} kr`);
      
      // Navigate to public pricing page
      cy.visit('/priser');
      
      // Verify prices are reflected on public page
      cy.get('[data-cy="box-advertising-hero-price"]').should('contain', `${randomBoxPrice} kr`);
      cy.get('[data-cy="boost-daily-price-display"]').should('contain', `${randomBoostPrice} kr`);
      cy.get('[data-cy="service-daily-price-display"]').should('contain', `${randomServicePrice} kr`);
      
      // Verify calculator uses new prices
      cy.get('[data-cy="pricing-calculator"]').should('be.visible');
      cy.get('[data-cy="box-quantity-input"]').clear().type('2');
      const expectedMonthlyPrice = 2 * randomBoxPrice;
      cy.get('[data-cy="monthly-price"]').should('contain', `${expectedMonthlyPrice} kr/mnd`);
      
      // Test boost calculator
      cy.get('[data-cy="boost-calculator"]').should('be.visible');
      cy.get('[data-cy="boost-boxes-input"]').clear().type('1');
      cy.get('[data-cy="boost-days-input"]').clear().type('5');
      cy.get('[data-cy="boost-daily-price-display"]').should('contain', `${randomBoostPrice} kr`);
      const expectedBoostTotal = 1 * randomBoostPrice * 5;
      cy.get('[data-cy="boost-total-price"]').should('contain', `${expectedBoostTotal} kr`);
      
      // Test service calculator
      cy.get('[data-cy="service-calculator"]').should('be.visible');
      cy.get('[data-cy="service-days-input"]').clear().type('10');
      cy.get('[data-cy="service-daily-price-display"]').should('contain', `${randomServicePrice} kr`);
      const expectedServiceTotal = randomServicePrice * 10;
      cy.get('[data-cy="service-total-price"]').should('contain', `${expectedServiceTotal} kr`);
    });
  });

  describe('Box Discount Management', () => {
    it('should update existing box discounts and verify on /priser', () => {
      const updatedDiscount = randomBoxDiscount + 5; // Updated percentage
      
      cy.log(`Testing box discount update with ${updatedDiscount}%`);
      
      // Look for any existing box discount to edit (check if any exist)
      cy.get('[data-cy="box-discounts-section"]').then($section => {
        if ($section.find('[data-cy="edit-discount-button"]').length > 0) {
          // Edit the first available discount
          cy.get('[data-cy="box-discounts-section"]')
            .find('[data-cy="edit-discount-button"]')
            .first()
            .click();
          
          // Update percentage
          cy.get('[data-cy="discount-percentage-input"]').clear().type(updatedDiscount.toString());
          cy.get('[data-cy="update-discount-button"]').click();
          
          // Verify update in admin
          cy.get('[data-cy="box-discounts-section"]').should('contain', `${updatedDiscount}.0% rabatt`);
          
          // Verify update on /priser
          cy.visit('/priser');
          cy.get('[data-cy="pricing-periods"]').should('be.visible');
          cy.contains(`${updatedDiscount}% rabatt`).should('be.visible');
        } else {
          cy.log('No existing box discounts found to update');
        }
      });
    });
  });

  describe('Boost Discount Management', () => {
    it('should update existing boost discounts and verify on /priser', () => {
      const updatedBoostDiscount = randomBoostDiscount + 3; // Updated percentage
      
      cy.log(`Testing boost discount update with ${updatedBoostDiscount}%`);
      
      // Look for any existing boost discount to edit
      cy.get('[data-cy="boost-discounts-section"]').then($section => {
        if ($section.find('[data-cy="edit-discount-button"]').length > 0) {
          // Edit the first available discount
          cy.get('[data-cy="boost-discounts-section"]')
            .find('[data-cy="edit-discount-button"]')
            .first()
            .click();
          
          // Update percentage
          cy.get('[data-cy="discount-percentage-input"]').clear().type(updatedBoostDiscount.toString());
          cy.get('[data-cy="update-discount-button"]').click();
          
          // Verify update in admin
          cy.get('[data-cy="boost-discounts-section"]').should('contain', `${updatedBoostDiscount}.0% rabatt`);
          
          // Verify update on /priser
          cy.visit('/priser');
          cy.get('[data-cy="boost-calculator"]').should('be.visible');
          cy.contains(`${updatedBoostDiscount}% rabatt`).should('be.visible');
        } else {
          cy.log('No existing boost discounts found to update');
        }
      });
    });
  });

  describe('Service Discount Management', () => {
    it('should update existing service discounts and verify on /priser', () => {
      const updatedServiceDiscount = randomServiceDiscount + 4; // Updated percentage
      
      cy.log(`Testing service discount update with ${updatedServiceDiscount}%`);
      
      // Look for any existing service discount to edit
      cy.get('[data-cy="service-discounts-section"]').then($section => {
        if ($section.find('[data-cy="edit-discount-button"]').length > 0) {
          // Edit the first available discount
          cy.get('[data-cy="service-discounts-section"]')
            .find('[data-cy="edit-discount-button"]')
            .first()
            .click();
          
          // Update percentage
          cy.get('[data-cy="discount-percentage-input"]').clear().type(updatedServiceDiscount.toString());
          cy.get('[data-cy="update-discount-button"]').click();
          
          // Verify update in admin
          cy.get('[data-cy="service-discounts-section"]').should('contain', `${updatedServiceDiscount}.0% rabatt`);
          
          // Verify update on /priser
          cy.visit('/priser');
          cy.get('[data-cy="service-calculator"]').should('be.visible');
          cy.contains(`${updatedServiceDiscount}% rabatt`).should('be.visible');
        } else {
          cy.log('No existing service discounts found to update');
        }
      });
    });
  });

  describe('Complete End-to-End Pricing Flow', () => {
    it('should update all pricing values and verify complete /priser page functionality', () => {
      // Set all base prices to specific test values
      cy.get('[data-cy="edit-pricing-button"]').click();
      cy.get('#boxAdvertisingPrice').clear().type('12');
      cy.get('#boxBoostPrice').clear().type('5');
      cy.get('#serviceBasePrice').clear().type('3');
      cy.get('[data-cy="save-pricing-button"]').click();
      
      // Create comprehensive discounts for all types
      
      // Box discount: 3 months, 8%
      cy.get('[data-cy="add-discount-button"]').click();
      cy.get('[data-cy="discount-type-select"]').select('box');
      cy.get('[data-cy="discount-months-input"]').clear().type('3');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('8');
      cy.get('[data-cy="save-discount-button"]').click();
      
      // Box discount: 12 months, 20%
      cy.get('[data-cy="add-discount-button"]').click();
      cy.get('[data-cy="discount-type-select"]').select('box');
      cy.get('[data-cy="discount-months-input"]').clear().type('12');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('20');
      cy.get('[data-cy="save-discount-button"]').click();
      
      // Boost discount: 7 days, 5%
      cy.get('[data-cy="add-discount-button"]').click();
      cy.get('[data-cy="discount-type-select"]').select('boost');
      cy.get('[data-cy="discount-days-input"]').clear().type('7');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('5');
      cy.get('[data-cy="save-discount-button"]').click();
      
      // Boost discount: 30 days, 15%
      cy.get('[data-cy="add-discount-button"]').click();
      cy.get('[data-cy="discount-type-select"]').select('boost');
      cy.get('[data-cy="discount-days-input"]').clear().type('30');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('15');
      cy.get('[data-cy="save-discount-button"]').click();
      
      // Service discount: 30 days, 10%
      cy.get('[data-cy="add-discount-button"]').click();
      cy.get('[data-cy="discount-type-select"]').select('service');
      cy.get('[data-cy="discount-days-input"]').clear().type('30');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('10');
      cy.get('[data-cy="save-discount-button"]').click();
      
      // Service discount: 90 days, 25%
      cy.get('[data-cy="add-discount-button"]').click();
      cy.get('[data-cy="discount-type-select"]').select('service');
      cy.get('[data-cy="discount-days-input"]').clear().type('90');
      cy.get('[data-cy="discount-percentage-input"]').clear().type('25');
      cy.get('[data-cy="save-discount-button"]').click();
      
      // Navigate to /priser and verify everything works
      cy.visit('/priser');
      
      // Test box advertising calculator with all scenarios
      cy.get('[data-cy="box-quantity-input"]').clear().type('3');
      
      // Test 1 month (no discount)
      cy.get('[data-cy="period-1-month"]').click();
      cy.get('[data-cy="monthly-price"]').should('contain', '36 kr/mnd'); // 3 * 12
      cy.get('[data-cy="total-price"]').should('contain', '36 kr');
      
      // Test 3 months (8% discount)
      cy.get('[data-cy="period-3-months"]').click();
      cy.get('[data-cy="discount-percentage-display"]').should('contain', '8.0%');
      cy.get('[data-cy="total-price"]').should('contain', '99 kr'); // 108 * 0.92 = 99.36 ≈ 99
      
      // Test 12 months (20% discount)
      cy.get('[data-cy="period-12-months"]').click();
      cy.get('[data-cy="discount-percentage-display"]').should('contain', '20.0%');
      cy.get('[data-cy="total-price"]').should('contain', '346 kr'); // 432 * 0.8 = 345.6 ≈ 346
      
      // Test boost calculator
      cy.get('[data-cy="boost-boxes-input"]').clear().type('2');
      cy.get('[data-cy="boost-days-input"]').clear().type('35'); // Should get 15% discount
      
      cy.get('[data-cy="boost-daily-price-display"]').should('contain', '5 kr');
      cy.get('[data-cy="boost-discount-percentage"]').should('contain', '15%');
      cy.get('[data-cy="boost-total-price"]').should('contain', '297 kr'); // 2*5*35*0.85 = 297.5 ≈ 297
      
      // Test service calculator
      cy.get('[data-cy="service-days-input"]').clear().type('100'); // Should get 25% discount
      
      cy.get('[data-cy="service-daily-price-display"]').should('contain', '3 kr');
      cy.get('[data-cy="service-discount-percentage"]').should('contain', '25%');
      cy.get('[data-cy="service-total-price"]').should('contain', '225 kr'); // 300 * 0.75 = 225
      
      // Verify discount information is displayed correctly
      cy.get('[data-cy="boost-discounts-info"]').should('contain', '7+ dager: 5% rabatt');
      cy.get('[data-cy="boost-discounts-info"]').should('contain', '30+ dager: 15% rabatt');
      
      cy.get('[data-cy="service-discounts-info"]').should('contain', '30+ dager: 10% rabatt');
      cy.get('[data-cy="service-discounts-info"]').should('contain', '90+ dager: 25% rabatt');
    });
  });
});