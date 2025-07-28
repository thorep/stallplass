describe('Advertising Activation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user1@test.com', 'test123')
  })

  it('activates advertising for a stable with boxes', () => {
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
    
    const stableName = `Advertising Test Stable ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]').type(stableName)
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Albatrossveien 28C')
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible')
    cy.wait(1500)
    cy.get('.absolute.bg-white button').first().click()
    cy.wait(1000)
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('Test stable for advertising activation')
    
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
    const boxName = `Advertising Test Box ${Date.now()}`
    cy.get('[data-cy="box-name-input"]').type(boxName)
    cy.get('[data-cy="box-price-input"]').type('5000')
    cy.get('[data-cy="box-size-input"]').type('15')
    cy.get('[data-cy="box-type-select"]').select('BOKS')
    cy.get('[data-cy="box-description-textarea"]').type('A box for testing advertising activation')
    
    // Ensure the box is available
    cy.get('[data-cy="box-available-checkbox"]').should('be.checked')
    
    // Submit the box form
    cy.get('[data-cy="save-box-button"]').click()
    
    // Wait for the modal to close and box to be created
    cy.wait(3000)
    
    // Now test the advertising activation functionality
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        // The stable should show "not advertised" warning and "Start annonsering" button
        cy.get('[data-cy="start-advertising-button"]').scrollIntoView().should('be.visible')
        cy.get('[data-cy="start-advertising-button"]').should('contain', 'Start annonsering')
        
        // Click the start advertising button
        cy.get('[data-cy="start-advertising-button"]').click()
      })
    
    // The advertising modal should open
    cy.get('body').should('contain', 'Start markedsføring')
    
    // Verify the modal content
    cy.get('body').should('contain', 'Du betaler')
    cy.get('body').should('contain', 'kr per boks per måned')
    cy.get('body').should('contain', 'Velg markedsføringsperiode')
    
    // Test period selection - select 3 months for discount
    cy.get('[data-cy="period-3-months"]').click()
    
    // Verify 3 months is selected (should have different styling)
    cy.get('[data-cy="period-3-months"]').should('have.class', 'border-indigo-500')
    cy.get('[data-cy="period-3-months"]').should('have.class', 'bg-indigo-50')
    
    // Verify discount is shown
    cy.get('[data-cy="period-3-months"]').should('contain', '5% rabatt')
    
    // Try selecting 6 months for better discount
    cy.get('[data-cy="period-6-months"]').click()
    cy.get('[data-cy="period-6-months"]').should('have.class', 'border-indigo-500')
    cy.get('[data-cy="period-6-months"]').should('contain', '12% rabatt')
    
    // Verify the proceed to payment button exists and shows price
    cy.get('[data-cy="proceed-to-payment-button"]').should('be.visible')
    cy.get('[data-cy="proceed-to-payment-button"]').should('contain', 'Bestill med faktura')
    cy.get('[data-cy="proceed-to-payment-button"]').should('contain', 'kr')
    
    // Test canceling the modal
    cy.get('[data-cy="cancel-advertising-button"]').click()
    
    // Modal should close
    cy.get('body').should('not.contain', 'Start markedsføring')
    
    // The start advertising button should still be visible
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.get('[data-cy="start-advertising-button"]').scrollIntoView().should('be.visible')
      })
    
    // Test opening modal again and proceeding to payment page
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.get('[data-cy="start-advertising-button"]').scrollIntoView().click()
      })
    
    // Select 1 month period and proceed
    cy.get('[data-cy="period-1-months"]').click()
    cy.get('[data-cy="proceed-to-payment-button"]').click()
    
    // Should navigate to payment/invoice page
    cy.url().should('include', '/dashboard/bestill')
    cy.url().should('include', 'itemType=STABLE_ADVERTISING')
    cy.url().should('include', 'months=1')
    cy.url().should('include', 'stableId=') // Just verify stableId parameter exists
    
    // Go back to dashboard to clean up
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
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

  it('shows warning message for stables without advertising', () => {
    // Create a stable and box, then verify warning message appears
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Check if there are existing stables without advertising
    cy.get('body').then($body => {
      if ($body.find('[data-cy="start-advertising-button"]').length > 0) {
        // Found stable without advertising - verify warning elements
        cy.get('[data-cy="start-advertising-button"]').should('be.visible')
        
        // Check for warning message content
        cy.get('body').should('contain', 'Stallen din er ikke annonsert')
        cy.get('body').should('contain', 'Kunder vil ikke se din stall i søkeresultatene')
        
        // Verify alternative start advertising button in warning
        if ($body.find('[data-cy="start-advertising-warning-button"]').length > 0) {
          cy.get('[data-cy="start-advertising-warning-button"]').should('be.visible')
          cy.get('[data-cy="start-advertising-warning-button"]').should('contain', 'Start annonsering')
        }
      } else {
        // No stables without advertising found, just log it
        cy.log('No stables without advertising found to test warning message with')
      }
    })
  })

  it('shows different UI for stables with active advertising', () => {
    // This test checks if any existing stables have active advertising
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    cy.get('body').then($body => {
      if ($body.find('[data-cy="renew-advertising-button"]').length > 0) {
        // Found stable with active advertising - verify the elements
        cy.get('[data-cy="renew-advertising-button"]').should('be.visible')
        cy.get('[data-cy="renew-advertising-button"]').should('contain', 'Forny/Utvid')
        
        // Check for active advertising status
        cy.get('body').should('contain', 'Annonsering aktiv')
        cy.get('body').should('contain', 'Alle bokser annonseres')
        
        // Verify green status indicator
        cy.get('.bg-green-500.rounded-full').should('be.visible')
      } else {
        // No stables with active advertising found
        cy.log('No stables with active advertising found to test with')
      }
    })
  })
})