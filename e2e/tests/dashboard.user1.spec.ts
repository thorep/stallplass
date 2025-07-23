import { test, expect } from '@playwright/test';

test.describe('User1 Dashboard', () => {
  test('shows dashboard after login', async ({ page }) => {
    // User is already logged in as user1 via storageState
    await page.goto('/stall');
    
    // Should see dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Mine staller')).toBeVisible();
  });

  test('can navigate to create stable', async ({ page }) => {
    await page.goto('/stall');
    
    // Click create stable button
    await page.click('text=Opprett');
    
    // Should navigate to create page
    await expect(page).toHaveURL('/ny-stall');
  });
});