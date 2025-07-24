// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Disable uncaught exception handling for known issues
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore React hydration errors and other known issues
  if (err.message.includes('Hydration') || 
      err.message.includes('ResizeObserver') ||
      err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  // Allow other errors to fail the test
  return true
})

// Global before hook to ensure clean state
beforeEach(() => {
  // Clear local storage and session storage
  cy.clearLocalStorage()
  cy.clearCookies()
})