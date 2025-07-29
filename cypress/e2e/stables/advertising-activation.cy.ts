describe('Advertising Activation', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('user1@test.com', 'test123')
  })

  it('purchases advertising slots for a stable with boxes', () => {
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
    cy.get('[data-cy="stable-description-input"]').type('Test stable for slot-based advertising')
    
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
    const boxName = `Slot Test Box ${Date.now()}`
    cy.get('[data-cy="box-name-input"]').type(boxName)
    cy.get('[data-cy="box-price-input"]').type('5000')
    cy.get('[data-cy="box-size-input"]').type('15')
    cy.get('[data-cy="box-type-select"]').select('BOKS')
    cy.get('[data-cy="box-description-textarea"]').type('A box for testing slot-based advertising')
    
    // Ensure the box is available
    cy.get('[data-cy="box-available-checkbox"]').should('be.checked')
    
    // Submit the box form
    cy.get('[data-cy="save-box-button"]').click()
    
    // Wait for the modal to close and box to be created
    cy.wait(3000)
    
    // Now test the slot-based advertising functionality
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        // The stable should show "Kjøp annonseplasser" button for slot-based system
        cy.get('[data-cy="start-advertising-button"]').scrollIntoView().should('be.visible')
        cy.get('[data-cy="start-advertising-button"]').should('contain', 'Kjøp annonseplasser')
        
        // Click the buy advertising slots button
        cy.get('[data-cy="start-advertising-button"]').click()
      })
    
    // The advertising modal should open with slot-based content
    cy.get('body').should('contain', 'Kjøp annonseplasser')
    
    // Verify the modal content for slot-based system
    cy.get('body').should('contain', 'Du betaler')
    cy.get('body').should('contain', 'kr per plass per måned')
    cy.get('body').should('contain', 'Velg markedsføringsperiode')
    
    // Test slot quantity selector
    cy.get('[data-cy="slots-input"]').should('be.visible')
    cy.get('[data-cy="slots-input"]').should('have.value', '1')
    cy.get('body').should('contain', 'av 1 bokser') // Should show total boxes available
    
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
    
    // Wait for modal to close, then verify modal overlay is not visible
    cy.wait(1000)
    cy.get('[data-cy="advertising-modal"]').should('not.exist')
    // Or check that the modal backdrop/overlay is not visible
    cy.get('.fixed.inset-0').should('not.exist')
    
    // The buy advertising slots button should still be visible
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
    
    // Should navigate to payment/invoice page with slot-based parameters
    cy.url().should('include', '/dashboard/bestill')
    cy.url().should('include', 'itemType=STABLE_SLOT_ADVERTISING')
    cy.url().should('include', 'months=1')
    cy.url().should('include', 'slots=1')
    cy.url().should('include', 'stableId=') // Just verify stableId parameter exists
    
    // Complete the "invoice request" by filling out the form and submitting
    cy.get('[data-cy="full-name-input"]').type('Test User')
    cy.get('[data-cy="address-input"]').type('Test Address 123')
    cy.get('[data-cy="postal-code-input"]').type('0123')
    cy.get('[data-cy="city-input"]').type('Oslo')
    cy.get('[data-cy="phone-input"]').type('12345678')
    cy.get('[data-cy="email-input"]').type('test@example.com')
    
    // Submit the invoice request
    cy.get('[data-cy="submit-invoice-request-button"]').click()
    
    // Wait for submission to complete and navigate back
    cy.wait(3000)
    
    // Go back to dashboard to verify slots were activated
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Wait for data to load and check if advertising is now active
    cy.wait(2000)
    
    // The stable should now show active advertising slots
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        // Should have manage slots and extend buttons instead of buy button
        cy.get('[data-cy="manage-slots-button"]').should('be.visible')
        cy.get('[data-cy="renew-advertising-button"]').should('be.visible')
      })
    
    // Check status outside of .within() context  
    cy.contains(stableName).parents('.bg-white.rounded-2xl').should('contain', 'Annonsering aktiv')
    cy.contains(stableName).parents('.bg-white.rounded-2xl').should('contain', 'Bruker 0/1 plasser')
    
    // Now assign the slot to the box so it appears in public search
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.get('[data-cy="manage-slots-button"]').click()
      })
    
    // Slot assignment modal should open
    cy.get('body').should('contain', 'Velg bokser for annonsering')
    
    // Assign the slot to our test box - look for any checkbox related to our box
    // The data-cy might be formatted differently, so let's find it by the box name context
    cy.contains(boxName).parents('.border').first().within(() => {
      cy.get('input[type="checkbox"]').check()
    })
    
    // Save the slot assignment
    cy.get('[data-cy="save-slot-assignment-button"]').click()
    
    // Wait for assignment to complete
    cy.wait(2000)
    
    // Verify slot is now assigned (should show 1/1 slots used)
    cy.contains(stableName).parents('.bg-white.rounded-2xl').should('contain', 'Bruker 1/1 plasser')
    
    // CRITICAL TEST: Verify the stable with assigned slot appears in public search
    cy.visit('/staller')
    
    // Wait for search results to load
    cy.wait(3000)
    
    // The stable should now appear in public search results
    cy.get('body').should('contain', stableName)
    cy.get('body').should('contain', boxName)
    
    // Verify the box shows advertising/sponsored status if applicable
    cy.contains(boxName).should('be.visible')
    
    // Test that we can find the box in search results
    cy.get('[data-cy="search-results"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-cy="search-results"]').should('contain', stableName)
    cy.get('[data-cy="search-results"]').should('contain', boxName)
    
    // Clean up: Go back to dashboard and delete the stable (which will also delete the box)
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    cy.wait(2000)
    cy.on('window:confirm', (str) => {
      expect(str).to.contain('Er du sikker på at du vil slette')
      return true
    })
    
    // Find and delete the specific stable we created
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables"]').length > 0) {
        cy.get('[data-cy="stables"]')
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

  it('shows warning message for stables without advertising slots', () => {
    // Create a stable and box, then verify warning message appears
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Check if there are existing stables without advertising slots
    cy.get('body').then($body => {
      if ($body.find('[data-cy="start-advertising-button"]').length > 0) {
        // Found stable without advertising slots - verify warning elements
        cy.get('[data-cy="start-advertising-button"]').should('be.visible')
        
        // Check for warning message content for slot-based system
        cy.get('body').should('contain', 'Ingen aktive annonseplasser')
        cy.get('body').should('contain', 'Kunder vil ikke se bokser fra denne stallen i søkeresultatene')
        
        // Verify alternative buy slots button in warning
        if ($body.find('[data-cy="start-advertising-warning-button"]').length > 0) {
          cy.get('[data-cy="start-advertising-warning-button"]').should('be.visible')
          cy.get('[data-cy="start-advertising-warning-button"]').should('contain', 'Kjøp plasser')
        }
      } else {
        // No stables without advertising slots found, just log it
        cy.log('No stables without advertising slots found to test warning message with')
      }
    })
  })

  it('shows different UI for stables with active advertising slots', () => {
    // This test checks if any existing stables have active advertising slots
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    cy.get('body').then($body => {
      if ($body.find('[data-cy="renew-advertising-button"]').length > 0) {
        // Found stable with active advertising slots - verify the elements
        cy.get('[data-cy="renew-advertising-button"]').should('be.visible')
        cy.get('[data-cy="renew-advertising-button"]').should('contain', 'Forny/Utvid')
        
        // Check for active advertising status in slot-based system
        cy.get('body').should('contain', 'Annonsering aktiv')
        cy.get('body').should('contain', 'Bruker') // Should show "Bruker X/Y plasser"
        cy.get('body').should('contain', 'plasser')
        
        // Verify manage slots button exists
        if ($body.find('[data-cy="manage-slots-button"]').length > 0) {
          cy.get('[data-cy="manage-slots-button"]').should('be.visible')
          cy.get('[data-cy="manage-slots-button"]').should('contain', 'Velg bokser')
        }
        
        // Verify green status indicator
        cy.get('.bg-green-500.rounded-full').should('be.visible')
      } else {
        // No stables with active advertising slots found
        cy.log('No stables with active advertising slots found to test with')
      }
    })
  })

  it('verifies that stables without assigned slots do NOT appear in public search', () => {
    // Create a stable and box but DON'T assign advertising slots
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Create a stable without advertising
    cy.get('body').then($body => {
      if ($body.find('[data-cy="create-first-stable-button"]').length > 0) {
        cy.get('[data-cy="create-first-stable-button"]').click()
      } else {
        cy.get('[data-cy="add-stable-button"]').click()
      }
    })
    
    // Wait for navigation to the new stable form with longer timeout
    cy.url({ timeout: 15000 }).should('include', '/ny-stall')
    
    const stableName = `No Ads Test ${Date.now()}`
    cy.get('[data-cy="stable-name-input"]', { timeout: 10000 }).should('be.visible').type(stableName)
    
    // Search for address
    cy.get('[data-cy="address-search-input"]').type('Storgata 1')
    cy.get('.absolute.bg-white', { timeout: 10000 }).should('be.visible')
    cy.wait(1500)
    cy.get('.absolute.bg-white button').first().click()
    cy.wait(1000)
    
    // Fill in description
    cy.get('[data-cy="stable-description-input"]').type('Test stable without advertising')
    
    // Submit the stable form
    cy.get('[data-cy="save-stable-button"]').click()
    cy.wait(3000)
    
    // Create a box in the stable
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
    
    const boxName = `No Ads Box ${Date.now()}`
    cy.get('[data-cy="box-name-input"]').type(boxName)
    cy.get('[data-cy="box-price-input"]').type('3000')
    cy.get('[data-cy="box-size-input"]').type('12')
    cy.get('[data-cy="box-type-select"]').select('BOKS')
    cy.get('[data-cy="box-description-textarea"]').type('A box that should NOT appear in search without advertising')
    cy.get('[data-cy="box-available-checkbox"]').should('be.checked')
    cy.get('[data-cy="save-box-button"]').click()
    cy.wait(3000)
    
    // Verify the stable shows as having no advertising
    cy.contains(stableName)
      .parents('.bg-white.rounded-2xl')
      .first()
      .within(() => {
        cy.get('[data-cy="start-advertising-button"]').should('be.visible')
      })
    
    // Check status messages outside of .within() context
    cy.contains(stableName).parents('.bg-white.rounded-2xl').should('contain', 'Ingen aktive annonseplasser')
    cy.contains(stableName).parents('.bg-white.rounded-2xl').should('contain', 'Kunder vil ikke se bokser fra denne stallen')
    
    // CRITICAL TEST: Verify this stable does NOT appear in public search
    cy.visit('/staller')
    cy.wait(3000)
    
    // The stable and box should NOT appear in search results
    cy.get('body').should('not.contain', stableName)
    cy.get('body').should('not.contain', boxName)
    
    // Clean up: Delete the test stable
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    cy.wait(2000)
    
    cy.on('window:confirm', (str) => {
      expect(str).to.contain('Er du sikker på at du vil slette')
      return true
    })
    
    cy.get('body').then($body => {
      if ($body.find('[data-cy="stables"]').length > 0) {
        cy.get('[data-cy="stables"]')
          .contains(stableName)
          .parents('.bg-white')
          .first()
          .within(() => {
            cy.get('button[data-cy^="delete-stable-"]').click()
          })
        cy.wait(2000)
        cy.get('body').should('not.contain', stableName)
      }
    })
  })

  it('tests slot assignment functionality after purchasing slots', () => {
    // This test specifically tests the slot assignment workflow
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    cy.get('body').then($body => {
      if ($body.find('[data-cy="manage-slots-button"]').length > 0) {
        // Found stable with active slots - test slot management
        cy.get('[data-cy="manage-slots-button"]').first().click()
        
        // Slot assignment modal should open
        cy.get('body').should('contain', 'Velg bokser for annonsering')
        cy.get('body').should('contain', 'Du har')
        cy.get('body').should('contain', 'plasser tilgjengelig')
        
        // Should show slot usage indicator
        cy.get('body').should('contain', 'Plasser i bruk:')
        
        // Should have save and cancel buttons
        cy.get('[data-cy="save-slot-assignment-button"]').should('be.visible')
        cy.get('[data-cy="cancel-slot-assignment-button"]').should('be.visible')
        cy.get('[data-cy="save-slot-assignment-button"]').should('contain', 'Lagre valg')
        
        // Test canceling the modal
        cy.get('[data-cy="cancel-slot-assignment-button"]').click()
        
        // Modal should close
        cy.get('body').should('not.contain', 'Velg bokser for annonsering')
      } else {
        // No stables with active slots found to test slot management
        cy.log('No stables with active advertising slots found to test slot management with')
      }
    })
  })
})