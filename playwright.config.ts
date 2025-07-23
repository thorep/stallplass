import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup projects
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    
    // Tests that don't need auth (public and login tests)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.(spec|test)\.ts$/,
      testIgnore: [/.*\.user1\.spec\.ts/, /.*\.user2\.spec\.ts/, /.*\.setup\.ts/],
    },
    
    // Tests that need user1 auth
    {
      name: 'chromium-user1',
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: 'e2e/.auth/user1.json' 
      },
      dependencies: ['setup'],
      testMatch: /.*\.user1\.spec\.ts/,
    },
    
    // Tests that need user2 auth
    {
      name: 'chromium-user2',
      use: { 
        ...devices['Desktop Chrome'], 
        storageState: 'e2e/.auth/user2.json' 
      },
      dependencies: ['setup'],
      testMatch: /.*\.user2\.spec\.ts/,
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});