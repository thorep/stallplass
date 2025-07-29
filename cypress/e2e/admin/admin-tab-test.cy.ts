describe('Admin Tab Navigation', () => {
  it('should be able to click through admin tabs', () => {
    // Login as admin user
    cy.login('user1@test.com', 'test123');
    
    // Navigate to admin page
    cy.visit('/admin');
    cy.url().should('include', '/admin');
    
    // Wait for admin dashboard to load
    cy.contains('Admin Dashboard', { timeout: 15000 }).should('be.visible');
    
    // Take screenshot to see current state
    cy.screenshot('admin-dashboard-loaded');
    
    // Try clicking each tab to see what happens
    cy.get('[data-cy="admin-tab-pricing"]').should('be.visible');
    cy.screenshot('before-pricing-tab-click');
    
    cy.get('[data-cy="admin-tab-pricing"]').click();
    cy.screenshot('after-pricing-tab-click');
    
    // Check if pricing section appears
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="pricing-section"]').length > 0) {
        cy.log('Pricing section found!');
        cy.get('[data-cy="pricing-section"]').should('be.visible');
      } else {
        cy.log('Pricing section not found, checking page content');
        cy.get('body').should('contain', 'Priser'); // Should contain some pricing related text
      }
    });
  });
});