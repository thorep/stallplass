describe('Box Creation Flow', () => {
  beforeEach(() => {
    cy.loginAsUser1()
  })

  it('logged in user can create boxes for filter testing', () => {
    cy.visit('/dashboard')
    cy.waitForDashboard()
    
    // Go to Mine staller tab
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    cy.wait(5000) // Wait for stables to load
    
    // Find first stable and click "Legg til boks" button
    cy.get('button').contains('Legg til boks').first().click()
    
    // Fill in box details
    cy.get('[data-cy="box-name-input"]', { timeout: 10000 }).should('be.visible').type('Test Box 1')
    cy.get('[data-cy="box-price-input"]').type('2500')
    cy.get('[data-cy="box-size-input"]').type('12')
    
    // Select box type
    cy.get('[data-cy="box-type-select"]').select('stallboks')
    
    // Select max horse size
    cy.get('[data-cy="box-max-horse-size-select"]').select('large')
    
    // Add description
    cy.get('[data-cy="box-description-textarea"]').type('Romslig boks perfekt for store hester')
    
    // Make sure box is available
    cy.get('[data-cy="box-available-checkbox"]').check()
    
    // Save the box
    cy.get('[data-cy="save-box-button"]').click()
    
    // Wait for box to be created and modal to close
    cy.get('[data-cy="box-name-input"]').should('not.exist')
    
    // Verify box appears in the list
    cy.contains('Test Box 1').should('be.visible')
  })

  it('box creation form shows validation errors for required fields', () => {
    cy.visit('/dashboard')
    cy.waitForDashboard()
    
    // Go to Mine staller tab
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    cy.wait(5000) // Wait for stables to load
    
    // Find first stable and click "Legg til boks" button
    cy.get('button').contains('Legg til boks').first().click()
    
    // Try to save without filling required fields
    cy.get('[data-cy="save-box-button"]').click()
    
    // Form should still be open (validation failed)
    cy.get('[data-cy="box-name-input"]').should('be.visible')
  })

  it('user can create a single box successfully', () => {
    cy.visit('/dashboard')
    cy.waitForDashboard()
    
    // Go to Mine staller tab
    cy.get('[data-cy="dashboard-tab-stables"]').click()
    cy.wait(5000) // Wait for stables to load
    
    // Find first stable and click "Legg til boks" button
    cy.get('button').contains('Legg til boks').first().click()
    
    // Fill in minimum required fields
    cy.get('[data-cy="box-name-input"]', { timeout: 10000 }).should('be.visible').type('Single Test Box')
    cy.get('[data-cy="box-price-input"]').type('3000')
    
    // Save the box
    cy.get('[data-cy="save-box-button"]').click()
    
    // Wait for success and modal to close
    cy.get('[data-cy="box-name-input"]').should('not.exist')
    
    // Verify box appears in the list
    cy.contains('Single Test Box').should('be.visible')
  })
})