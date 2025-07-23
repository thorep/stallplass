import { test, expect } from '@playwright/test';

test.describe('Dashboard - Stable Owner Features', () => {
  test('logged in user can access dashboard with stable management', async ({ page }) => {
    // User is already logged in as user1 via storageState
    await page.goto('/stall');
    
    // Should see dashboard content (wait for page to load)
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
    await expect(page.locator('text=Mine staller')).toBeVisible();
  });

  test('stable owner can navigate to create stable from Mine staller tab', async ({ page }) => {
    await page.goto('/stall');
    
    // Navigate to Mine staller tab first
    await page.click('text=Mine staller');
    
    // Wait for the create stable button to be available (using data-cy selector)
    const createButton = page.locator('[data-cy="add-stable-button"]');
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    
    // Should navigate to create page
    await page.waitForURL('/ny-stall', { timeout: 10000 });
    await expect(page).toHaveURL('/ny-stall');
  });

  test('stable owner can navigate to create stable from main overview button', async ({ page }) => {
    await page.goto('/stall');
    
    // Should be on Overview tab by default
    // Check if user has existing stables or is new user
    const createFirstButton = page.locator('[data-cy="create-first-stable-button"]');
    const mineStaller = page.locator('button:has-text("Mine staller")');
    
    if (await createFirstButton.isVisible()) {
      // New user with no stables - use the "create first stable" button
      await createFirstButton.click();
    } else {
      // User has existing stables - go to Mine staller tab and create new stable
      await mineStaller.click();
      const createButton = page.locator('[data-cy="add-stable-button"]');
      await expect(createButton).toBeVisible({ timeout: 10000 });
      await createButton.click();
    }
    
    // Wait for navigation to complete
    await page.waitForURL('/ny-stall');
    
    // Verify we're on the create stable form
    await expect(page.locator('h1')).toContainText('Legg til ny stall');
  });
});