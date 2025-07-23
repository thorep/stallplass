import { defineConfig, devices } from '@playwright/test';

/**
 * API Testing Configuration for Playwright
 * Based on https://playwright.dev/docs/api-testing
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Extra HTTP headers to send with every request. */
    extraHTTPHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    
    // API tests with user1 authentication
    {
      name: 'api-user1',
      testMatch: /.*\.user1\.api\.spec\.ts/,
    },

    // API tests with user2 authentication  
    {
      name: 'api-user2',
      testMatch: /.*\.user2\.api\.spec\.ts/,
    },

    // API tests without authentication (public endpoints)
    {
      name: 'api-public',
      testMatch: /.*\.public\.api\.spec\.ts/,
    },

    // Admin API tests
    {
      name: 'api-admin',
      testMatch: /.*\.admin\.api\.spec\.ts/,
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'NODE_ENV=test npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      NODE_ENV: 'test'
    },
  },
});