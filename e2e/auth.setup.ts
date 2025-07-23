import { test as setup, expect } from '@playwright/test';

const user1AuthFile = 'e2e/.auth/user1.json';
const user2AuthFile = 'e2e/.auth/user2.json';

setup('authenticate as user1', async ({ page }) => {
  await page.goto('/logg-inn');
  
  // Wait for login form to be fully loaded
  await page.waitForSelector('[data-cy="login-email-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-password-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-submit-button"]', { state: 'visible' });
  
  // Fill login form
  await page.fill('[data-cy="login-email-input"]', 'user1@test.com');
  await page.fill('[data-cy="login-password-input"]', 'test123');
  
  // Submit form and wait for navigation
  await page.click('[data-cy="login-submit-button"]');
  
  // Wait for successful redirect to dashboard
  await page.waitForURL('/stall', { timeout: 15000 });
  expect(page.url()).toContain('/stall');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Save auth state
  await page.context().storageState({ path: user1AuthFile });
});

setup('authenticate as user2', async ({ page }) => {
  await page.goto('/logg-inn');
  
  // Wait for login form to be fully loaded
  await page.waitForSelector('[data-cy="login-email-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-password-input"]', { state: 'visible' });
  await page.waitForSelector('[data-cy="login-submit-button"]', { state: 'visible' });
  
  // Fill login form
  await page.fill('[data-cy="login-email-input"]', 'user2@test.com');
  await page.fill('[data-cy="login-password-input"]', 'test123');
  
  // Submit form and wait for navigation
  await page.click('[data-cy="login-submit-button"]');
  
  // Wait for successful redirect to dashboard
  await page.waitForURL('/stall', { timeout: 15000 });
  expect(page.url()).toContain('/stall');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Save auth state
  await page.context().storageState({ path: user2AuthFile });
});