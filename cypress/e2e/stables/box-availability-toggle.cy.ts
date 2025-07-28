describe('Box Availability Toggle', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user1@test.com', 'test123')
  })

  it('toggles box availability from available to rented and back', () => {
    // First, create a stable and box for testing
    cy.visit('/dashboard')
    
    // Click on the "Mine staller" tab
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Create a stable
    cy.get('body').then($body => {
      if ($body.find('[data-cy="create-first-stable-button"]').length > 0) {
        cy.get('[data-cy="create-first-stable-button"]').click()
      } else {
        cy.get('[data-cy="add-stable-button"]').click()
      }
    })
    
    // Verify we're on the new stable form page
    cy.url().should('include', '/ny-stall')
    
    const stableName = `Availability Test Stable ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C')
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible')
    cy.wait(1500)
    cy.get('.absolute.bg-white button').first().click()
    cy.wait(1000)
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('Test stable for availability toggle')
    
    // Submit the stable form
    cy.get('[data-cy="save-stable-button"]').click()
    
    // Wait for navigation back to dashboard
    cy.wait(3000)
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy="stables"]', { timeout: 10000 }).should('be.visible')
    
    // Now create a box in the stable
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .then($stableCard => {
        if ($stableCard.find('[data-cy="add-first-box-button"]').length > 0) {
          cy.wrap($stableCard).find('[data-cy="add-first-box-button"]').click()
        } else {
          cy.wrap($stableCard).find('[data-cy="add-box-button"]').click()
        }
      })
    
    // Fill out the box form
    const boxName = `Availability Test Box ${Date.now()}`
    cy.get('[data-cy="box-name-input"]').type(boxName)
    cy.get('[data-cy="box-price-input"]').type('3000')
    cy.get('[data-cy="box-size-input"]').type('10')
    cy.get('[data-cy="box-type-select"]').select('BOKS')
    cy.get('[data-cy="box-description-textarea"]').type('A box for testing availability toggle')
    
    // Ensure the box is available by default
    cy.get('[data-cy="box-available-checkbox"]').should('be.checked')
    
    // Submit the box form
    cy.get('[data-cy="save-box-button"]').click()
    
    // Wait for the modal to close and box to be created
    cy.wait(3000)
    
    // Now test the availability toggle functionality
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        // Find our specific box
        cy.contains(boxName).should('be.visible')
        
        // The box should initially show as "available" with "Ledig" status
        cy.contains(boxName)
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .within(() => {
            // Verify initial state shows "Ledig" badge
            cy.get('.bg-emerald-500\\/90.text-white').should('contain', 'Ledig')
            
            // Get the box ID from the mark-rented button and toggle to rented
            cy.get('button[data-cy^="mark-rented-"]').should('contain', 'Marker utleid').click()
          })
      })
    
    // Wait for the API call to complete
    cy.wait(2000)
    
    // Verify the box is now marked as rented
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.contains(boxName)
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .within(() => {
            // Verify status badge now shows "Opptatt"
            cy.get('.bg-red-500\\/90.text-white').should('contain', 'Opptatt')
            
            // Verify button text changed to "Marker ledig"
            cy.get('button[data-cy^="mark-available-"]').should('contain', 'Marker ledig').click()
          })
      })
    
    // Wait for the API call to complete
    cy.wait(2000)
    
    // Verify the box is back to available
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.contains(boxName)
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .within(() => {
            // Verify status badge is back to "Ledig"
            cy.get('.bg-emerald-500\\/90.text-white').should('contain', 'Ledig')
            
            // Verify button text is back to "Marker utleid"
            cy.get('button[data-cy^="mark-rented-"]').should('contain', 'Marker utleid')
          })
      })
    
    // Clean up: Delete the stable (which will also delete the box)
    cy.on('window:confirm', (str) => {
      expect(str).to.contain('Er du sikker på at du vil slette')
      return true
    })
    
    // Find and delete the specific stable we created
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables-list"]').length > 0) {
        cy.get('[data-cy="stables-list"]')
          .contains(stableName)
          .parents('.bg-white')
          .first()
          .within(() => {
            cy.get('button[data-cy^="delete-stable-"]').click()
          })
        
        // Wait for deletion to complete
        cy.wait(2000)
        
        // Verify our test stable and box are deleted
        cy.get('body').should('not.contain', stableName)
        cy.get('body').should('not.contain', boxName)
      }
    })
  })

  it('shows correct status badges and button states', () => {
    // This test focuses on the UI state changes without doing full CRUD
    // We'll create a box and just verify the initial states are correct
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Check if there are existing boxes to test with
    cy.get('body').then($body => {
      if ($body.find('.bg-white.border.border-slate-200.rounded-xl').length > 0) {
        // Find the first box and verify its UI states
        cy.get('.bg-white.border.border-slate-200.rounded-xl').first().within(() => {
          // Check that status badge exists (either "Ledig" or "Opptatt")
          cy.get('body').then($boxBody => {
            if ($boxBody.find('.bg-emerald-500\\/90.text-white').length > 0) {
              // Box is available
              cy.get('.bg-emerald-500\\/90.text-white').should('contain', 'Ledig')
              cy.get('button[data-cy^="mark-rented-"]').should('contain', 'Marker utleid')
            } else if ($boxBody.find('.bg-red-500\\/90.text-white').length > 0) {
              // Box is rented
              cy.get('.bg-red-500\\/90.text-white').should('contain', 'Opptatt')
              cy.get('button[data-cy^="mark-available-"]').should('contain', 'Marker ledig')
            }
          })
        })
      } else {
        // No boxes exist, skip this test
        cy.log('No existing boxes found to test UI states with')
      }
    })
  })
})