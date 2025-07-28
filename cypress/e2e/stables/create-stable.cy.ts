describe('Stable Creation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user1@test.com', 'test123')
  })

  it('creates a new stable successfully and then deletes it', () => {
    // Navigate to dashboard
    cy.visit('/dashboard')
    
    // Click on the "Mine staller" tab
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Click on "Ny stall" button - handle both empty state and regular button
    cy.get('body').then($body => {
      if ($body.find('[data-cy="create-first-stable-button"]').length > 0) {
        cy.get('[data-cy="create-first-stable-button"]').click()
      } else {
        cy.get('[data-cy="add-stable-button"]').click()
      }
    })
    
    // Verify we're on the new stable form page
    cy.url().should('include', '/ny-stall')
    
    // Fill out the stable form
    const stableName = `Test Stable ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C')
    
    // Wait for search results and click the first result
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible')
    cy.wait(1500) // Wait for search results to fully load
    cy.get('.absolute.bg-white button').first().click()
    
    // Wait for address fields to be populated
    cy.wait(1000)
    
    // Verify address fields are populated
    cy.get('input[name="address"]').should('have.value', 'Albatrossveien 28C')
    cy.get('input[name="poststed"]').should('not.have.value', '')
    cy.get('input[name="postalCode"]').should('not.have.value', '')
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('This is a test stable created by Cypress E2E test')
    
    // Fill in total boxes (optional)
    cy.get('[data-cy="stable-total-boxes-input"]').type('10')
    
    // Select a few amenities if they exist
    cy.get('body').then($body => {
      // Check if there are any amenity checkboxes available
      if ($body.find('input[data-cy^="amenity-"]').length > 0) {
        // Select the first 2-3 amenities available
        cy.get('input[data-cy^="amenity-"]').then($checkboxes => {
          // Select up to 3 amenities
          const checkboxesToSelect = Math.min(3, $checkboxes.length)
          for (let i = 0; i < checkboxesToSelect; i++) {
            cy.wrap($checkboxes[i]).check()
          }
        })
      }
    })
    
    // Upload a test image
    cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-stable-image.png', { force: true })
    
    // Wait for image upload to complete
    cy.wait(2000)
    
    // Verify image was uploaded by checking the image grid appears
    cy.get('.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.gap-4').scrollIntoView().should('be.visible')
    cy.get('.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.gap-4').within(() => {
      cy.get('img').should('have.length.at.least', 1)
    })
    
    // Submit the form
    cy.get('[data-cy="save-stable-button"]').click()
    
    // Wait for navigation and API calls
    cy.wait(3000)
    
    // Verify we're redirected back to dashboard stables tab
    cy.url().should('include', '/dashboard')
    cy.url().should('include', 'tab=stables')
    
    // Wait for the stables tab content to be visible
    cy.get('[data-cy="stables"]', { timeout: 10000 }).should('be.visible')
    
    // Check if stables list exists (it won't exist if this is the first stable)
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables-list"]').length > 0) {
        cy.get('[data-cy="stables-list"]').should('be.visible')
        cy.get('[data-cy="stables-list"]').should('contain', stableName)
      } else {
        // If no stables list, verify the stable name appears somewhere on the page
        cy.get('body').should('contain', stableName)
      }
    })
    
    // Set up the handler for the confirm dialog before clicking delete
    cy.on('window:confirm', (str) => {
      expect(str).to.contain('Er du sikker på at du vil slette')
      return true
    })
    
    // Only try to delete if stables list exists
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables-list"]').length > 0) {
        // Find the created stable and delete it  
        cy.get('[data-cy="stables-list"]')
          .contains(stableName)
          .parents('.bg-white')
          .first()
          .find('button[data-cy^="delete-stable-"]')
          .click()
        
        // Wait for deletion to complete
        cy.wait(2000)
        
        // Verify the stable is no longer in the list
        cy.get('body').should('not.contain', stableName)
      }
    })
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