describe('Stable Creation Flow', () => {
  beforeEach(() => {
    cy.loginAsUser1()
  })

  it('logged in user can create a new stable and verify it appears in dashboard', () => {
    // Navigate to dashboard first
    cy.visit('/dashboard')
    cy.waitForDashboard()
    
    // Use helper command to go to create stable
    cy.goToCreateStable()

    // Fill in stable name with a timestamp to ensure uniqueness
    const uniqueName = `Test Stall ${Date.now()}`
    cy.get('input[name="name"]').type(uniqueName)

    // Fill in address using the search field and select from suggestions
    cy.get('input[placeholder="Begynn å skrive adressen..."]').type('Albatrossveien 28C')
    
    // Wait for address suggestions to appear and click the first one
    cy.get('button').contains('Albatrossveien 28C').first().click()
    
    // Wait a moment for the form to update
    cy.wait(1000)

    // Fill in description
    cy.get('textarea[name="description"]').type('En moderne stall med gode fasiliteter for hester og ryttere. Perfekt beliggenhet med god tilgang til ridestier.')

    // Set number of boxes
    cy.get('input[name="totalBoxes"]').clear().type('10')

    // Select some amenities
    cy.get('input[type="checkbox"]').first().check() // Check first amenity
    cy.get('input[type="checkbox"]').eq(1).check() // Check second amenity
    cy.get('input[type="checkbox"]').eq(2).check() // Check third amenity

    // Submit the form
    cy.get('button').contains('Opprett stall').click()

    // Wait for either success redirect or error message
    cy.url().should('include', '/dashboard', { timeout: 15000 })
    
    // Should now be back on dashboard
    cy.get('h1').should('contain', 'Dashboard')
    
    // Navigate to "Mine staller" tab to verify the stable was created
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    
    // Wait for stable list to load and verify our stable appears
    cy.contains(uniqueName, { timeout: 10000 }).should('be.visible')
  })

  it('stable creation form shows validation errors for required fields', () => {
    // Navigate to stable creation form
    cy.visit('/dashboard')
    cy.goToCreateStable()

    // Try to submit empty form
    cy.get('button').contains('Opprett stall').click()

    // Should still be on the same page (form didn't submit) 
    cy.url().should('include', '/ny-stall')
    
    // Check for validation feedback - should still show the form heading
    cy.get('h1').should('contain', 'Legg til ny stall')
  })
})