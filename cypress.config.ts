import { defineConfig } from 'cypress'

export default defineConfig({
  // Block analytics/survey widgets that can interfere with tests
  blockHosts: ['*.posthog.com', '*.i.posthog.com', 'eu-assets.i.posthog.com'],
  // CTRF JSON reporter (opt-in if package installed)
  reporter: 'cypress-ctrf-json-reporter',
  reporterOptions: {
    outputDir: 'cypress/results',
    filename: 'results.json',
    overwrite: true,
  },
  // Component Testing configuration for Next.js (auto-detected bundler: webpack 5)
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
  },
})
