describe('Navigation', () => {
  it('shows correct header links when not logged in', () => {
    cy.visit('/')
    
    // Should see public links
    cy.get('a[href="/staller"]').should('be.visible')
    cy.get('a[href="/tjenester"]').should('be.visible')
    cy.get('a[href="/logg-inn"]').should('be.visible')
    
    // Should not see authenticated links
    cy.get('a[href="/dashboard"]').should('not.exist')
    cy.get('a[href="/meldinger"]').should('not.exist')
    
    // Check these links actually work by clicking one
    cy.get('a[href="/staller"]').click()
    cy.url().should('include', '/staller')
  })

  it('shows correct header links when logged in as owner', () => {
    // Login as user1
    cy.loginAsUser1()
    
    // Go to home page to check header
    cy.visit('/')
    
    // Should see dashboard/profile links (not login)
    cy.get('a[href="/dashboard"]').should('be.visible')
    cy.get('a[href="/logg-inn"]').should('not.exist')
  })

  it('shows correct header links when logged in as rider', () => {
    // Login as user2  
    cy.loginAsUser2()
    
    // Go to home page to check header
    cy.visit('/')
    
    // Should see profile links
    cy.get('a[href="/dashboard"]').should('be.visible')
    
    // Should not see login link
    cy.get('a[href="/logg-inn"]').should('not.exist')
  })
})