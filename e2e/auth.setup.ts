import { test as setup, expect } from '@playwright/test';

const user1AuthFile = 'e2e/.auth/user1.json';
const user2AuthFile = 'e2e/.auth/user2.json';

setup('authenticate as user1', async ({ page }) => {
  await page.goto('/logg-inn');
  await page.fill('input[type="email"]', 'user1@test.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('**', { waitUntil: 'networkidle' });
  expect(page.url()).not.toContain('/logg-inn');
  
  // Save auth state
  await page.context().storageState({ path: user1AuthFile });
});

setup('authenticate as user2', async ({ page }) => {
  await page.goto('/logg-inn');
  await page.fill('input[type="email"]', 'user2@test.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('**', { waitUntil: 'networkidle' });
  expect(page.url()).not.toContain('/logg-inn');
  
  // Save auth state
  await page.context().storageState({ path: user2AuthFile });
});