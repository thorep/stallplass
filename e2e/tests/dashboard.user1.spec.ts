import { test, expect } from '@playwright/test';

test.describe('Dashboard - Stable Owner Features', () => {
  test('logged in user can access dashboard with stable management', async ({ page }) => {
    // User is already logged in as user1 via storageState
    await page.goto('/stall');
    
    // Should see dashboard content
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('text=Mine staller')).toBeVisible();
  });

  test('stable owner can navigate to create stable from Mine staller tab', async ({ page }) => {
    await page.goto('/stall');
    
    // Navigate to Mine staller tab first
    await page.click('text=Mine staller');
    
    // Wait for the stables list to load and look for create button
    await page.waitForTimeout(2000);
    
    // Click create stable button - could be "Legg til ny stall" if user has existing stables
    const createButton = page.locator('button:has-text("Legg til ny stall")');
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Should navigate to create page
    await page.waitForURL('/ny-stall', { timeout: 10000 });
    await expect(page).toHaveURL('/ny-stall');
  });

  test('stable owner can navigate to create stable from main overview button', async ({ page }) => {
    await page.goto('/stall');
    
    // Should be on Overview tab by default
    // Check if user has existing stables or is new user
    const createFirstButton = page.locator('button:has-text("Opprett din første stall")');
    const mineStaller = page.locator('button:has-text("Mine staller")');
    
    if (await createFirstButton.isVisible()) {
      // New user with no stables - use the "create first stable" button
      await createFirstButton.click();
    } else {
      // User has existing stables - go to Mine staller tab and create new stable
      await mineStaller.click();
      await page.waitForTimeout(2000);
      const createButton = page.locator('button:has-text("Legg til ny stall")');
      await expect(createButton).toBeVisible();
      await createButton.click();
    }
    
    // Wait for navigation to complete
    await page.waitForURL('/ny-stall');
    
    // Verify we're on the create stable form
    await expect(page.locator('h1')).toContainText('Legg til ny stall');
  });
});