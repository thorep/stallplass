/// <reference types="cypress" />

describe('Login', () => {
  it('logger inn med standard bruker', () => {
    cy.login() // bruker user1@test.com / test123 og returnUrl=/dashboard

    cy.location('pathname').then((pathname) => {
      if (pathname === '/verifiser-epost') {
        cy.contains('Bekreft e-post').should('be.visible')
      } else {
        expect(pathname).to.eq('/dashboard')
      }
    })
  })
})

