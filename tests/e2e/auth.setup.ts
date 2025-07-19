import { test as setup, expect } from '@playwright/test';
import { testUsers } from './fixtures/test-data';

const authFile = 'playwright/.auth/user.json';
const adminAuthFile = 'playwright/.auth/admin.json';

setup('authenticate as regular user', async ({ page }) => {
  // Go to login page
  await page.goto('/logg-inn');

  // Fill in login form
  await page.fill('input[type="email"]', testUsers.regularUser.email);
  await page.fill('input[type="password"]', testUsers.regularUser.password);
  
  // Click login button
  await page.click('button[type="submit"]');

  // Wait for successful login - check for user menu or dashboard
  await expect(page.locator('[data-testid="user-menu"]').or(page.locator('text=Dashboard'))).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

setup('authenticate as admin user', async ({ page }) => {
  // Go to login page
  await page.goto('/logg-inn');

  // Fill in login form
  await page.fill('input[type="email"]', testUsers.admin.email);
  await page.fill('input[type="password"]', testUsers.admin.password);
  
  // Click login button
  await page.click('button[type="submit"]');

  // Wait for successful login and admin access
  await expect(page.locator('[data-testid="admin-menu"]').or(page.locator('text=Admin Dashboard'))).toBeVisible();

  // Save admin authentication state
  await page.context().storageState({ path: adminAuthFile });
});

setup('create test user if not exists', async ({ page }) => {
  // Go to registration page
  await page.goto('/registrer');

  // Check if we can register (might already exist)
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.isVisible()) {
    // Fill registration form
    await page.fill('input[name="displayName"]', testUsers.regularUser.displayName);
    await page.fill('input[type="email"]', testUsers.regularUser.email);
    await page.fill('input[type="password"]', testUsers.regularUser.password);
    await page.fill('input[name="confirmPassword"]', testUsers.regularUser.password);
    await page.fill('input[type="tel"]', testUsers.regularUser.phone);

    // Submit registration
    await page.click('button[type="submit"]');

    // Handle success or "user already exists" scenarios
    await page.waitForURL(/\/(dashboard|logg-inn)/, { timeout: 10000 }).catch(() => {
      // User might already exist, that's fine
    });
  }
});