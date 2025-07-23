import { test, expect } from '@playwright/test';

test.describe('User2 Search', () => {
  test('shows search page for logged in user', async ({ page }) => {
    // User is already logged in as user2 via storageState
    await page.goto('/staller');
    
    // Should see search interface
    await expect(page.locator('input[placeholder*="Søk"]')).toBeVisible();
  });

  test('can access messaging when logged in', async ({ page }) => {
    await page.goto('/meldinger');
    
    // Should not redirect to login
    expect(page.url()).toContain('/meldinger');
  });
});