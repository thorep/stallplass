describe('Filter Page Tests', () => {
  beforeEach(() => {
    // Visit the public search page
    cy.visit('/staller');
    
    // Wait for page to load
    cy.contains('Søk etter stall eller plass').should('be.visible');
  });

  describe('County Filter', () => {
    it('should return 200 when changing county filter', () => {
      // Switch to stable view for filtering
      cy.contains('button', 'Staller').click();
      cy.wait(1000);
      
      // Intercept the API request when changing county filter
      cy.intercept('GET', '/api/search*').as('searchRequest');
      
      // Change county filter
      cy.get('select').first().select('Oslo');
      
      // Verify API returns 200
      cy.wait('@searchRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ County filter API returned 200');
      });
      
      // Verify URL contains the filter parameter
      cy.url().should('include', 'fylkeId=');
    });

    it('should return 200 when resetting county filter', () => {
      // Switch to stable view
      cy.contains('button', 'Staller').click();
      cy.wait(1000);
      
      // First apply a filter
      cy.get('select').first().select('Oslo');
      cy.wait(1000);
      
      // Intercept the reset API request
      cy.intercept('GET', '/api/search*').as('resetRequest');
      
      // Reset filters
      cy.contains('Nullstill filtre').click();
      
      // Verify API returns 200
      cy.wait('@resetRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ County filter reset API returned 200');
      });
      
      // Verify filter is cleared
      cy.get('select').first().should('have.value', '');
      cy.url().should('not.include', 'fylkeId=');
    });
  });

  describe('Price Filter', () => {
    it('should return 200 when changing price filter', () => {
      // Switch to stable view
      cy.contains('button', 'Staller').click();
      cy.wait(1000);
      
      // Intercept the API request when changing price filter
      cy.intercept('GET', '/api/search*').as('priceSearchRequest');
      
      // Apply price filter
      cy.get('input[type="number"]').first().clear().type('1000'); // Fra
      cy.get('input[type="number"]').last().clear().type('2000');  // Til
      
      // Verify API returns 200
      cy.wait('@priceSearchRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ Price filter API returned 200');
      });
      
      // Verify URL contains price parameters
      cy.url().should('include', 'minPrice=1000');
      cy.url().should('include', 'maxPrice=2000');
    });

    it('should return 200 when resetting price filter', () => {
      // Switch to stable view
      cy.contains('button', 'Staller').click();
      cy.wait(1000);
      
      // First apply price filter
      cy.get('input[type="number"]').first().clear().type('1000');
      cy.get('input[type="number"]').last().clear().type('2000');
      cy.wait(1000);
      
      // Intercept the reset API request
      cy.intercept('GET', '/api/search*').as('priceResetRequest');
      
      // Reset filters
      cy.contains('Nullstill filtre').click();
      
      // Verify API returns 200
      cy.wait('@priceResetRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ Price filter reset API returned 200');
      });
      
      // Verify filters are cleared
      cy.get('input[type="number"]').first().should('have.value', '');
      cy.get('input[type="number"]').last().should('have.value', '');
      cy.url().should('not.include', 'minPrice=');
      cy.url().should('not.include', 'maxPrice=');
    });
  });

  describe('View Mode Toggle', () => {
    it('should return 200 when switching between box and stable view', () => {
      // Intercept API requests for view mode changes
      cy.intercept('GET', '/api/search*').as('viewModeRequest');
      
      // Switch to stable view
      cy.contains('button', 'Staller').click();
      
      // Verify API returns 200 for stable view
      cy.wait('@viewModeRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ Stable view API returned 200');
      });
      
      // Verify URL changed to stable mode
      cy.url().should('include', 'mode=stables');
      
      // Switch back to box view
      cy.contains('button', 'Bokser').click();
      
      // Verify API returns 200 for box view
      cy.wait('@viewModeRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ Box view API returned 200');
      });
      
      // Verify URL changed back
      cy.url().should('not.include', 'mode=stables');
    });
  });

  describe('Combined Filters', () => {
    it('should return 200 when applying multiple filters together', () => {
      // Switch to stable view
      cy.contains('button', 'Staller').click();
      cy.wait(1000);
      
      // Intercept API requests
      cy.intercept('GET', '/api/search*').as('combinedFilterRequest');
      
      // Apply county filter first
      cy.get('select').first().select('Oslo');
      cy.wait('@combinedFilterRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
      });
      
      // Then apply price filter
      cy.get('input[type="number"]').first().clear().type('3000');
      cy.get('input[type="number"]').last().clear().type('7000');
      
      // Verify combined filters API returns 200
      cy.wait('@combinedFilterRequest').then((interception) => {
        expect(interception.response?.statusCode).to.equal(200);
        cy.log('✓ Combined filters API returned 200');
      });
      
      // Verify URL contains both parameters
      cy.url().should('include', 'fylkeId=');
      cy.url().should('include', 'minPrice=3000');
      cy.url().should('include', 'maxPrice=7000');
    });
  });
});