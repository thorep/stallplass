describe('Login Test', () => {
  it('should login with default credentials', () => {
    cy.login()
    cy.url().should('include', '/dashboard')
  })

  it('should login with custom credentials', () => {
    cy.login('user1@test.com', 'test123')
    cy.url().should('include', '/dashboard')
  })

  it('should login with returnUrl', () => {
    cy.login('user1@test.com', 'test123', '/some-page')
    cy.url().should('include', '/some-page')
  })
})