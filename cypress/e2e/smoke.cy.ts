/// <reference types="cypress" />

describe('Smoke', () => {
  it('responds on / and renders', () => {
    // Ensure the server responds before visiting (faster feedback in CI)
    cy.request('/').its('status').should('eq', 200)
    cy.visit('/')
    cy.get('body').should('exist')
  })
})

