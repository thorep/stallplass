import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 20000,
    requestTimeout: 30000,
    responseTimeout: 30000,
    pageLoadTimeout: 30000,
    experimentalStudio: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    env: {
      // Test user credentials
      testUser1Email: 'user3@test.com',
      testUser1Password: 'test123',
      testUser2Email: 'user4@test.com',
      testUser2Password: 'test123'
    }
  }
})