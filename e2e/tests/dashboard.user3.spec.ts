import { test, expect } from '@playwright/test';

test.describe('Dashboard - Stable Owner Features', () => {
  test('logged in user can access dashboard with stable management', async ({ page }) => {
    // User is already logged in as user1 via storageState
    await page.goto('/dashboard');
    
    // Should see dashboard content (wait for page to load)
    await expect(page.locator('h1')).toContainText('Dashboard', { timeout: 10000 });
    await expect(page.locator('text=Mine staller')).toBeVisible();
  });

  test('stable owner can navigate to create stable from Mine staller tab', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Navigate to Mine staller tab first
    await page.click('text=Mine staller');
    
    // Check if user has existing stables or is new user by checking which button is visible
    const createFirstButton = page.locator('[data-cy="create-first-stable-button"]');
    const addStableButton = page.locator('[data-cy="add-stable-button"]');
    
    // Wait a moment for the page to load and then check which button is visible
    await page.waitForTimeout(2000);
    
    if (await createFirstButton.isVisible()) {
      // No existing stables - use the "create first stable" button
      await createFirstButton.click();
    } else if (await addStableButton.isVisible()) {
      // User has existing stables - use the "add stable" button
      await addStableButton.click();
    } else {
      throw new Error('Neither create-first-stable-button nor add-stable-button is visible');
    }
    
    // Should navigate to create page
    await page.waitForURL('/ny-stall', { timeout: 30000 });
    await expect(page).toHaveURL('/ny-stall');
  });

  test('stable owner can navigate to create stable from main overview button', async ({ page }) => {
    await page.goto('/dashboard');
    
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
      await page.waitForTimeout(2000); // Wait for tab content to load
      
      // Check which button is available in the Mine staller tab
      const createFirstButtonInTab = page.locator('[data-cy="create-first-stable-button"]');
      const addStableButton = page.locator('[data-cy="add-stable-button"]');
      
      if (await createFirstButtonInTab.isVisible()) {
        await createFirstButtonInTab.click();
      } else if (await addStableButton.isVisible()) {
        await addStableButton.click();
      } else {
        throw new Error('No stable creation button found in Mine staller tab');
      }
    }
    
    // Wait for navigation to complete
    await page.waitForURL('/ny-stall', { timeout: 30000 });
    
    // Verify we're on the create stable form
    await expect(page.locator('h1')).toContainText('Legg til ny stall');
  });
});