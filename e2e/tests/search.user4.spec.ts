import { test, expect } from '@playwright/test';

test.describe('Search & Messaging - User Features', () => {
  test('logged in user can access stable search with filters', async ({ page }) => {
    // User is already logged in as user2 via storageState
    await page.goto('/staller');
    
    // Should see filter interface (location dropdowns, price inputs)
    await expect(page.locator('select').first()).toBeVisible(); // Location filters
  });

  test('logged in user can access messaging interface', async ({ page }) => {
    await page.goto('/meldinger');
    
    // Should not redirect to login
    expect(page.url()).toContain('/meldinger');
  });
});