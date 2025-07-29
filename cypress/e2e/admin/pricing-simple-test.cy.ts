describe('Admin Pricing Management - Simplified', () => {
  // Generate random values for each test run
  const randomBoxPrice = Math.floor(Math.random() * 20) + 10; // 10-29 kr
  const randomBoostPrice = Math.floor(Math.random() * 5) + 3; // 3-7 kr  
  const randomServicePrice = Math.floor(Math.random() * 3) + 2; // 2-4 kr
  
  const randomBoxDiscount = Math.floor(Math.random() * 15) + 10; // 10-24%
  const randomBoostDiscount = Math.floor(Math.random() * 10) + 8; // 8-17%
  const randomServiceDiscount = Math.floor(Math.random() * 12) + 12; // 12-23%

  beforeEach(() => {
    // Login as admin user
    cy.login('user1@test.com', 'test123');
    
    // Navigate to admin page and pricing section
    cy.visit('/admin');
    cy.contains('Admin Dashboard', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="admin-tab-pricing"]').click();
    cy.contains('Priser', { timeout: 10000 }).should('be.visible');
    cy.contains('Boksannonsering').should('be.visible');
  });

  it('should update base prices and verify on /priser page', () => {
    cy.log(`Testing with random prices - Box: ${randomBoxPrice}kr, Boost: ${randomBoostPrice}kr, Service: ${randomServicePrice}kr`);
    
    // Update base prices
    cy.get('[data-cy="edit-pricing-button"]').click();
    cy.get('#boxAdvertisingPrice').clear().type(randomBoxPrice.toString());
    cy.get('#boxBoostPrice').clear().type(randomBoostPrice.toString());
    cy.get('#serviceBasePrice').clear().type(randomServicePrice.toString());
    cy.get('[data-cy="save-pricing-button"]').click();
    
    // Verify in admin
    cy.get('[data-cy="box-advertising-price"]').should('contain', `${randomBoxPrice} kr`);
    cy.get('[data-cy="box-boost-price"]').should('contain', `${randomBoostPrice} kr`);
    cy.get('[data-cy="service-base-price"]').should('contain', `${randomServicePrice} kr`);
    
    // Verify on public pricing page
    cy.visit('/priser');
    cy.get('[data-cy="box-advertising-hero-price"]').should('contain', `${randomBoxPrice} kr`);
    cy.get('[data-cy="boost-daily-price-display"]').should('contain', `${randomBoostPrice} kr`);
    cy.get('[data-cy="service-daily-price-display"]').should('contain', `${randomServicePrice} kr`);
  });

  it('should create and verify box discount', () => {
    const randomMonths = [3, 6, 12][Math.floor(Math.random() * 3)];
    cy.log(`Creating box discount: ${randomMonths} months, ${randomBoxDiscount}%`);
    
    // Create discount
    cy.get('[data-cy="add-discount-button"]').click();
    cy.get('[data-cy="discount-type-select"]').select('box');
    cy.get('[data-cy="discount-months-input"]').clear().type(randomMonths.toString());
    cy.get('[data-cy="discount-percentage-input"]').clear().type(randomBoxDiscount.toString());
    cy.get('[data-cy="save-discount-button"]').click();
    
    // Verify in admin
    const monthText = randomMonths === 1 ? 'måned' : 'måneder';
    cy.get('[data-cy="box-discounts-section"]').should('contain', `${randomMonths} ${monthText}`);
    cy.get('[data-cy="box-discounts-section"]').should('contain', `${randomBoxDiscount}.0% rabatt`);
    
    // Verify on /priser page
    cy.visit('/priser');
    cy.get(`[data-cy="period-${randomMonths}-${monthText}"]`).should('contain', `${randomBoxDiscount}% rabatt`);
  });

  it('should create and verify boost discount', () => {
    const randomDays = [7, 14, 21, 30][Math.floor(Math.random() * 4)];
    cy.log(`Creating boost discount: ${randomDays} days, ${randomBoostDiscount}%`);
    
    // Create discount
    cy.get('[data-cy="add-discount-button"]').click();
    cy.get('[data-cy="discount-type-select"]').select('boost');
    cy.get('[data-cy="discount-days-input"]').clear().type(randomDays.toString());
    cy.get('[data-cy="discount-percentage-input"]').clear().type(randomBoostDiscount.toString());
    cy.get('[data-cy="save-discount-button"]').click();
    
    // Verify in admin
    const dayText = randomDays === 1 ? 'dag' : 'dager';
    cy.get('[data-cy="boost-discounts-section"]').should('contain', `${randomDays} ${dayText}`);
    cy.get('[data-cy="boost-discounts-section"]').should('contain', `${randomBoostDiscount}.0% rabatt`);
    
    // Verify on /priser page
    cy.visit('/priser');
    cy.get('[data-cy="boost-discounts-info"]').should('contain', `${randomDays}+ dager: ${randomBoostDiscount}% rabatt`);
  });

  it('should create and verify service discount', () => {
    const randomDays = [30, 60, 90][Math.floor(Math.random() * 3)];
    cy.log(`Creating service discount: ${randomDays} days, ${randomServiceDiscount}%`);
    
    // Create discount
    cy.get('[data-cy="add-discount-button"]').click();
    cy.get('[data-cy="discount-type-select"]').select('service');
    cy.get('[data-cy="discount-days-input"]').clear().type(randomDays.toString());
    cy.get('[data-cy="discount-percentage-input"]').clear().type(randomServiceDiscount.toString());
    cy.get('[data-cy="save-discount-button"]').click();
    
    // Verify in admin
    const dayText = randomDays === 1 ? 'dag' : 'dager';
    cy.get('[data-cy="service-discounts-section"]').should('contain', `${randomDays} ${dayText}`);
    cy.get('[data-cy="service-discounts-section"]').should('contain', `${randomServiceDiscount}.0% rabatt`);
    
    // Verify on /priser page
    cy.visit('/priser');
    cy.get('[data-cy="service-discounts-info"]').should('contain', `${randomDays}+ dager: ${randomServiceDiscount}% rabatt`);
  });
});