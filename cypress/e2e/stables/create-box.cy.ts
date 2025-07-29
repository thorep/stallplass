describe('Box Creation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user1@test.com', 'test123')
  })

  it('creates a stable and then adds a box to it', () => {
    // First, create a stable (similar to stable creation test)
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
    
    // Create a stable
    const stableName = `Test Stable for Box ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C')
    
    // Wait for search results and click the first result
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible')
    cy.wait(1500)
    cy.get('.absolute.bg-white button').first().click()
    
    // Wait for address fields to be populated
    cy.wait(1000)
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('Test stable for box creation')
    
    // Fill in total boxes
    cy.get('[data-cy="stable-total-boxes-input"]').type('5')
    
    // Submit the stable form
    cy.get('[data-cy="save-stable-button"]').click()
    
    // Wait for navigation back to dashboard
    cy.wait(3000)
    cy.url().should('include', '/dashboard')
    cy.url().should('include', 'tab=stables')
    
    // Wait for the stables tab content to be visible
    cy.get('[data-cy="stables"]', { timeout: 10000 }).should('be.visible')
    
    // Now create a box in the stable - find the specific stable first
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .then($stableCard => {
        // Check within this specific stable card for the buttons
        if ($stableCard.find('[data-cy="add-first-box-button"]').length > 0) {
          cy.wrap($stableCard).find('[data-cy="add-first-box-button"]').click()
        } else {
          cy.wrap($stableCard).find('[data-cy="add-box-button"]').click()
        }
      })
    
    // Fill out the box form
    const boxName = `Test Box ${Date.now()}`
    cy.get('[data-cy="box-name-input"]').type(boxName)
    cy.get('[data-cy="box-price-input"]').type('4500')
    cy.get('[data-cy="box-size-input"]').type('12.5')
    cy.get('[data-cy="box-type-select"]').select('BOKS')
    cy.get('[data-cy="box-description-textarea"]').type('A comfortable box for horses')
    
    // Ensure the box is available
    cy.get('[data-cy="box-available-checkbox"]').should('be.checked')
    
    // Upload a test image for the box (optional step - skip if fails)
    cy.get('body').then($body => {
      if ($body.find('[data-cy="image-upload-input"]').length > 0) {
        cy.get('[data-cy="image-upload-input"]').selectFile('cypress/fixtures/test-stable-image.png', { force: true })
        cy.wait(2000)
        
        // Try to verify image was uploaded (but don't fail if not)
        cy.get('.grid').then($grid => {
          if ($grid.find('img').length > 0) {
            cy.log('Image uploaded successfully')
          } else {
            cy.log('Image upload may have failed, but continuing with box creation')
          }
        })
      } else {
        cy.log('Image upload field not found, skipping image upload')
      }
    })
    
    // Submit the box form
    cy.get('[data-cy="save-box-button"]').click()
    
    // Wait for the modal to close and box to be created
    cy.wait(3000)
    
    // Verify we're still on the dashboard with stables tab
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy="stables"]').should('be.visible')
    
    // First, find the specific stable we created
    cy.contains(stableName).should('be.visible')
    
    // Within the stable management area, look for our specific box
    // Find the stable card that contains our stable name, then look for the box within it
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        // Look for the box grid within this specific stable
        cy.get('.grid').should('exist')
        
        // Look for our specific box by name within this stable
        cy.contains(boxName).should('be.visible')
        
        // Verify the box card has a price displayed (any price format is acceptable)
        cy.contains(boxName)
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .within(() => {
            cy.get('.text-2xl.font-bold.text-indigo-600').should('contain', 'kr')
          })
      })

    // Test box deletion functionality
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        // Find the box and click delete button
        cy.contains(boxName)
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .within(() => {
            // First click to show confirmation
            cy.get('[data-cy^="delete-box-"]').click()
            
            // Verify button shows "Bekreft" for confirmation
            cy.get('[data-cy^="delete-box-"]').should('contain', 'Bekreft')
            
            // Click again to confirm deletion
            cy.get('[data-cy^="delete-box-"]').click()
          })
        
        // Wait for deletion to complete
        cy.wait(2000)
      })
    
    // Verify box is removed from the entire page
    cy.get('body').should('not.contain', boxName)
    
    // Clean up: Delete the stable (the box was already deleted above)
    cy.on('window:confirm', (str) => {
      expect(str).to.contain('Er du sikker på at du vil slette')
      return true
    })
    
    // Find and delete the specific stable we created
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables-list"]').length > 0) {
        // Find the specific stable by name and delete it
        cy.get('[data-cy="stables-list"]')
          .contains(stableName)
          .parents('.bg-white')
          .first()
          .within(() => {
            cy.get('button[data-cy^="delete-stable-"]').click()
          })
        
        // Wait for deletion to complete
        cy.wait(2000)
        
        // Verify our specific stable (and its box) is no longer visible
        cy.get('body').should('not.contain', stableName)
        cy.get('body').should('not.contain', boxName)
      }
    })
  })
})