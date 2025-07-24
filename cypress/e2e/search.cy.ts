describe('Search & Messaging - User Features', () => {
  beforeEach(() => {
    cy.loginAsUser2() // Use user2 for search tests
  })

  it('logged in user can access messaging interface', () => {
    cy.visit('/meldinger')
    
    // Should not redirect to login
    cy.url().should('include', '/meldinger')
  })
})