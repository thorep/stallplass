describe('Stable Creation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user1@test.com', 'test123')
  })

  it('creates a new stable successfully and then deletes it', () => {
    // Navigate to dashboard
    cy.visit('/dashboard')
    
    // Click on the "Mine staller" tab
    cy.get('[data-cy="stables"]').click()
    
    // Click on "Ny stall" button
    cy.get('[data-cy="add-stable-button"]').click()
    
    // Verify we're on the new stable form page
    cy.url().should('include', '/ny-stall')
    
    // Fill out the stable form
    const stableName = `Test Stable ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C')
    
    // Wait for search results and click the first result
    cy.get('.absolute.bg-white').should('be.visible')
    cy.get('.absolute.bg-white button').first().click()
    
    // Verify address fields are populated
    cy.get('input[name="address"]').should('have.value', 'Albatrossveien 28C')
    cy.get('input[name="poststed"]').should('not.have.value', '')
    cy.get('input[name="postalCode"]').should('not.have.value', '')
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('This is a test stable created by Cypress E2E test')
    
    // Fill in total boxes (optional)
    cy.get('[data-cy="stable-total-boxes-input"]').type('10')
    
    // Submit the form
    cy.get('[data-cy="save-stable-button"]').click()
    
    // Verify we're redirected back to dashboard stables tab
    cy.url().should('include', '/dashboard')
    cy.url().should('include', 'tab=stables')
    
    // Verify the stable appears in the list
    cy.get('[data-cy="stables-list"]').should('contain', stableName)
    
    // Find the created stable and delete it
    cy.get('[data-cy="stables-list"]').within(() => {
      // Find the stable card that contains our stable name
      cy.contains(stableName)
        .parent()
        .parent()
        .parent()
        .within(() => {
          // Click the delete button
          cy.get('button[title="Slett stall"]').click()
        })
    })
    
    // Confirm deletion in the browser dialog
    cy.on('window:confirm', () => true)
    
    // Wait for deletion to complete
    cy.wait(2000)
    
    // Verify the stable is no longer in the list
    cy.get('[data-cy="stables-list"]').should('not.contain', stableName)
  })

  it('cancels stable creation and returns to dashboard', () => {
    // Navigate to new stable form
    cy.visit('/ny-stall')
    
    // Start filling the form
    cy.get('[data-cy="stable-name-input"]').type('Cancelled Stable')
    
    // Click cancel button
    cy.get('[data-cy="cancel-stable-button"]').click()
    
    // Verify we're back on dashboard
    cy.url().should('include', '/dashboard')
  })
})