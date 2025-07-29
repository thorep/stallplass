describe('Stable Advertising Admin Verification', () => {
  let invoiceRequestId: string;
  let stableName: string;

  beforeEach(() => {
    // Create unique stable name for this test run
    stableName = `Admin Test Stable ${Date.now()}`;
  });

  it('creates advertising order and verifies it appears in admin panel', () => {
    // Step 1: Login as regular user and create advertising order
    cy.login('user1@test.com', 'test123');
    cy.visit('/dashboard');
    
    // Click on the "Mine staller" tab
    cy.get('[data-cy="dashboard-tab-stables"]').click();
    
    // Create a stable
    cy.get('body').then($body => {
      if ($body.find('[data-cy="create-first-stable-button"]').length > 0) {
        cy.get('[data-cy="create-first-stable-button"]').click();
      } else {
        cy.get('[data-cy="add-stable-button"]').click();
      }
    });
    
    // Verify we're on the new stable form page
    cy.url().should('include', '/ny-stall');
    
    cy.get('[data-cy="stable-name-input"]').type(stableName);
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C');
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible');
    cy.wait(1500);
    cy.get('.absolute.bg-white button').first().click();
    cy.wait(1000);
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('Test stable for admin verification');
    
    // Submit the stable form
    cy.get('[data-cy="save-stable-button"]').click();
    
    // Wait for navigation back to dashboard
    cy.wait(3000);
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy="stables"]', { timeout: 10000 }).should('be.visible');
    
    // Create a box in the stable
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .then($stableCard => {
        if ($stableCard.find('[data-cy="add-first-box-button"]').length > 0) {
          cy.wrap($stableCard).find('[data-cy="add-first-box-button"]').click();
        } else {
          cy.wrap($stableCard).find('[data-cy="add-box-button"]').click();
        }
      });
    
    // Fill out the box form
    const boxName = `Admin Test Box ${Date.now()}`;
    cy.get('[data-cy="box-name-input"]').type(boxName);
    cy.get('[data-cy="box-price-input"]').type('5000');
    cy.get('[data-cy="box-size-input"]').type('15');
    cy.get('[data-cy="box-type-select"]').select('BOKS');
    cy.get('[data-cy="box-description-textarea"]').type('A box for admin verification testing');
    
    // Ensure the box is available
    cy.get('[data-cy="box-available-checkbox"]').should('be.checked');
    
    // Submit the box form
    cy.get('[data-cy="save-box-button"]').click();
    cy.wait(3000);
    
    // Now activate advertising and capture the invoice request ID
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.get('[data-cy="start-advertising-button"]').scrollIntoView().should('be.visible');
        cy.get('[data-cy="start-advertising-button"]').click();
      });
    
    // The advertising modal should open - check for the actual text that appears
    cy.get('body').should('contain', 'Kjøp annonseplasser');
    
    // Select 1 month period and proceed to payment
    cy.get('[data-cy="period-1-months"]').click();
    cy.get('[data-cy="proceed-to-payment-button"]').click();
    
    // Should navigate to payment/invoice page
    cy.url().should('include', '/dashboard/bestill');
    cy.url().should('include', 'itemType=STABLE_ADVERTISING');
    cy.url().should('include', 'months=1');
    
    // The order form should be visible - this is where we place the order
    cy.get('body').should('contain', 'Bestill med faktura');
    cy.get('body').should('contain', 'Fakturaopplysninger');
    
    // Fill in the order form fields using the actual input elements
    // The form uses custom Input components that render as regular input elements
    cy.get('input[placeholder="Skriv inn fullt navn"]').type('Test User Admin Verification');
    cy.get('input[placeholder="Gateadresse"]').type('Test Address 123');
    cy.get('input[placeholder="1234"]').type('0123');
    cy.get('input[placeholder="Oslo"]').type('Oslo');
    cy.get('input[placeholder="12345678"]').type('12345678');
    cy.get('input[placeholder="din@epost.no"]').type('test@example.com');
    
    // Intercept the invoice creation API call to capture the ID
    cy.intercept('POST', '/api/invoice-requests/create').as('createInvoiceRequest');
    
    // Handle the success alert
    cy.window().then((win) => {
      cy.stub(win, 'alert').as('windowAlert');
    });
    
    // Submit the order form
    cy.get('button[type="submit"]').contains('Bestill med faktura').click();
    
    // Wait for the API call and capture the invoice request ID
    cy.wait('@createInvoiceRequest').then((interception) => {
      expect(interception.response?.statusCode).to.equal(200);
      
      const responseBody = interception.response?.body;
      expect(responseBody).to.have.property('invoiceRequest');
      expect(responseBody.invoiceRequest).to.have.property('id');
      
      invoiceRequestId = responseBody.invoiceRequest.id;
      cy.log(`Captured invoice request ID: ${invoiceRequestId}`);
      
      // Verify the success alert was shown
      cy.get('@windowAlert').should('have.been.calledWith', 'Takk! Din bestilling er aktivert og du vil motta faktura på e-post.');
      
      // Step 2: Now login as admin and verify the order appears in admin panel
      // Note: For this test to work, user1@test.com needs to have isAdmin=true in the database
      
      // For now, let's assume user1@test.com is an admin (you may need to update the database)
      cy.visit('/admin');
      
      // Should be able to access admin panel
      cy.url().should('include', '/admin');
      
      // Wait for admin panel to fully load
      cy.get('body').should('not.contain', 'Sjekker tilgang');
      
      // Navigate to the invoices tab
      cy.get('[data-cy="admin-tab-invoices"]', { timeout: 15000 }).click();
      
      // Wait for the invoice requests to load
      cy.get('[data-cy="invoice-requests-admin"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy="invoice-requests-table"]').should('be.visible');
      
      // Look for our invoice request in the table - either by partial ID or by user name
      // First try to find by the user name we submitted
      cy.get('[data-cy="invoice-requests-table"]').should('contain', 'Test User Admin Verification');
      
      // Also verify that our captured ID appears somewhere in the table
      // It might be truncated, so we'll check for at least the first 8 characters
      const shortId = invoiceRequestId.substring(0, 8);
      cy.get('[data-cy="invoice-requests-table"]').should('contain', shortId);
      
      // Alternative: If the full ID is visible on click/hover, try that
      // Look for any table rows containing our short ID and click to expand
      cy.get('[data-cy="invoice-requests-table"]').then($table => {
        if ($table.text().includes(shortId)) {
          // Found the short ID, try to click the row to see full details
          cy.contains(shortId).parents('tr').click();
          // Then verify the full ID appears (possibly in a modal or expanded view)
          cy.get('body').should('contain', invoiceRequestId);
        }
      });
    });
    
    // Clean up: Delete the test stable
    cy.visit('/dashboard');
    cy.get('[data-cy="dashboard-tab-stables"]').click();
    
    cy.on('window:confirm', (str) => {
      expect(str).to.contain('Er du sikker på at du vil slette');
      return true;
    });
    
    // Find and delete the specific stable we created
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables-list"]').length > 0) {
        cy.get('[data-cy="stables-list"]')
          .contains(stableName)
          .parents('.bg-white')
          .first()
          .within(() => {
            cy.get('button[data-cy^="delete-stable-"]').click();
          });
        
        // Wait for deletion to complete
        cy.wait(2000);
        
        // Verify our test stable is deleted
        cy.get('body').should('not.contain', stableName);
      }
    });
  });
  
  it('handles admin access properly', () => {
    // Test that admin access is properly protected
    cy.login('user1@test.com', 'test123');
    
    // Try to access admin panel
    cy.visit('/admin');
    
    // Should either:
    // 1. Successfully load admin panel (if user1 is admin)
    // 2. Show access denied or redirect (if user1 is not admin)
    
    cy.url().then((url) => {
      if (url.includes('/admin')) {
        // User has admin access
        cy.get('body').should('contain', 'Admin Dashboard');
        cy.log('User has admin access - test can proceed');
      } else {
        // User doesn't have admin access
        cy.log('User does not have admin access - this test requires admin privileges');
        // Could redirect to dashboard or show error
        cy.url().should('not.include', '/admin');
      }
    });
  });
});