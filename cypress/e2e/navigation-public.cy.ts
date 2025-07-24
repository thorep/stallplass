describe('Public Navigation - Anonymous User Experience', () => {
  it('anonymous user sees correct public header links', () => {
    cy.visit('/')
    
    // Should see public navigation links
    cy.get('a[href="/staller"]').should('be.visible')
    cy.get('a[href="/tjenester"]').should('be.visible') 
    cy.get('a[href="/logg-inn"]').should('be.visible')
    
    // Should NOT see authenticated user links
    cy.get('a[href="/dashboard"]').should('not.exist')
    cy.get('a[href="/meldinger"]').should('not.exist')
    
    // Test that login link actually works
    cy.get('a[href="/logg-inn"]').click()
    cy.url().should('include', '/logg-inn')
  })

  it('anonymous user can browse stables without authentication', () => {
    cy.visit('/staller')
    
    // Should be able to access stable search page
    cy.get('h1').should('contain', 'boxes') // Page loaded successfully
    
    // Should still see login option in header
    cy.get('a[href="/logg-inn"]').should('be.visible')
  })

  it('anonymous user can browse services directory without authentication', () => {
    cy.visit('/tjenester')
    
    // Should be able to access services page
    cy.url().should('include', '/tjenester')
    
    // Should still see login option in header
    cy.get('a[href="/logg-inn"]').should('be.visible')
  })

  it('protected pages redirect to login when not authenticated', () => {
    // Try to access dashboard without login
    cy.visit('/dashboard')
    
    // Should redirect to login page
    cy.url().should('include', '/logg-inn')
  })

  it('messaging page redirects to login when not authenticated', () => {
    // Try to access messages without login
    cy.visit('/meldinger')
    
    // Should redirect to login page
    cy.url().should('include', '/logg-inn')
  })
})