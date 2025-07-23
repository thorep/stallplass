import { test as setup, expect } from '@playwright/test';

const user3AuthFile = 'e2e/.auth/user3.json';
const user4AuthFile = 'e2e/.auth/user4.json';

setup('authenticate as user3', async ({ page }) => {
  await page.goto('/logg-inn');
  
  // Wait for login form to be fully loaded
  await page.waitForSelector('[data-cy="login-email-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-password-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-submit-button"]', { state: 'visible' });
  
  // Fill login form
  await page.fill('[data-cy="login-email-input"]', 'user3@test.com');
  await page.fill('[data-cy="login-password-input"]', 'test123');
  
  // Submit form and wait for navigation
  await page.click('[data-cy="login-submit-button"]');
  
  // Wait for successful redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 });
  expect(page.url()).toContain('/dashboard');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Save auth state
  await page.context().storageState({ path: user3AuthFile });
});

setup('authenticate as user4', async ({ page }) => {
  await page.goto('/logg-inn');
  
  // Wait for login form to be fully loaded
  await page.waitForSelector('[data-cy="login-email-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-password-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-submit-button"]', { state: 'visible' });
  
  // Fill login form
  await page.fill('[data-cy="login-email-input"]', 'user4@test.com');
  await page.fill('[data-cy="login-password-input"]', 'test123');
  
  // Submit form and wait for navigation
  await page.click('[data-cy="login-submit-button"]');
  
  // Wait for successful redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 15000 });
  expect(page.url()).toContain('/dashboard');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Save auth state
  await page.context().storageState({ path: user4AuthFile });
});