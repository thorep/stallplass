import { defineConfig } from "cypress";

export default defineConfig({
  blockHosts: ["*.posthog.com", "*.i.posthog.com", "eu-assets.i.posthog.com"],

  reporter: "cypress-multi-reporters",
  reporterOptions: {
    reporterEnabled: "spec, mocha-ctrf-json-reporter",
    // nøkkelnavn = camelCase(reporternavn) + 'ReporterOptions'
    mochaCtrfJsonReporterReporterOptions: {
      outputDir: "cypress/results",
      filename: "results.json",
      overwrite: true,
      // evt. flere felt støttet av mocha-ctrf-json-reporter
    },
  },

  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    screenshotsFolder: "cypress/screenshots",
    videosFolder: "cypress/videos",
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    experimentalRunAllSpecs: true,
    experimentalStudio: true,
  },
  component: {
    devServer: { framework: "next", bundler: "webpack" },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.ts",
  },
});
