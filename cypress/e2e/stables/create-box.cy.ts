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
    
    // Now create a box in the stable
    // Look for either the "add first box" button or regular "add box" button
    cy.get('body').then($body => {
      if ($body.find('[data-cy="add-first-box-button"]').length > 0) {
        cy.get('[data-cy="add-first-box-button"]').click()
      } else {
        cy.get('[data-cy="add-box-button"]').click()
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
      .within(() => {
        // Verify we're no longer in the empty state for this stable
        cy.get('body').should('not.contain', 'Ingen bokser registrert ennå')
        
        // Look for the box grid within this specific stable
        cy.get('.grid').should('exist')
        
        // Look for our specific box by name within this stable
        cy.contains(boxName).should('be.visible')
        
        // Verify the price is displayed correctly for our box
        cy.contains(boxName)
          .parents('.bg-white.border.border-slate-200.rounded-xl')
          .within(() => {
            cy.get('.text-2xl.font-bold.text-indigo-600').should('contain', '4 500 kr')
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

  it('cancels box creation and returns to stable management', () => {
    // Create a stable first
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Create a minimal stable for testing
    cy.get('body').then($body => {
      if ($body.find('[data-cy="create-first-stable-button"]').length > 0) {
        cy.get('[data-cy="create-first-stable-button"]').click()
      } else {
        cy.get('[data-cy="add-stable-button"]').click()
      }
    })
    
    const stableName = `Test Stable Cancel ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C')
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible')
    cy.wait(1500)
    cy.get('.absolute.bg-white button').first().click()
    cy.wait(1000)
    cy.get('[data-cy="stable-description-input"]').type('Test stable for cancel test')
    cy.get('[data-cy="save-stable-button"]').click()
    
    cy.wait(3000)
    cy.url().should('include', '/dashboard')
    
    // Now try to create a box but cancel it
    cy.get('body').then($body => {
      if ($body.find('[data-cy="add-first-box-button"]').length > 0) {
        cy.get('[data-cy="add-first-box-button"]').click()
      } else {
        cy.get('[data-cy="add-box-button"]').click()
      }
    })
    
    // Start filling the form
    cy.get('[data-cy="box-name-input"]').type('Cancelled Box')
    
    // Click cancel - look for button with "Avbryt" text
    cy.contains('button', 'Avbryt').click()
    
    // Verify we're back to the stable management view
    cy.get('body').should('contain', stableName)
    cy.get('body').should('not.contain', 'Cancelled Box')
    
    // Clean up: Delete our specific test stable
    cy.on('window:confirm', () => true)
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables-list"]').length > 0) {
        cy.get('[data-cy="stables-list"]')
          .contains(stableName)
          .parents('.bg-white')
          .first()
          .within(() => {
            cy.get('button[data-cy^="delete-stable-"]').click()
          })
        cy.wait(2000)
        
        // Verify our specific stable is deleted
        cy.get('body').should('not.contain', stableName)
      }
    })
  })
})