describe('create-stable', () => {
  it('visits stables dashboard', () => {
    cy.login()
    cy.visit('/dashboard?tab=stables')
    cy.get('[data-cy="add-stable-button"]', { timeout: 15000 }).should('be.visible')
  })
})
