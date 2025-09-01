import { defineConfig } from 'cypress'
import { GenerateCtrfReport } from 'cypress-ctrf-json-reporter'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    // Default to iPhone 12 viewport (390x844) for all tests
    viewportWidth: 390,
    viewportHeight: 844,
    setupNodeEvents(on, config) {
      // CTRF JSON reporter for CI dashboards / artifacts
      new GenerateCtrfReport({
        on,
        outputFile: 'results.json',
        outputDir: 'cypress/results'
      })
    },
  },
})
