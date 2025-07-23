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
    
    // Click create stable button
    await page.click('text=Opprett');
    
    // Should navigate to create page
    await expect(page).toHaveURL('/ny-stall');
  });

  test('stable owner can navigate to create stable from main overview button', async ({ page }) => {
    await page.goto('/stall');
    
    // Should be on Overview tab by default
    // Wait for the button to be visible and clickable (target the actual button)
    await expect(page.locator('button:has-text("Opprett din første stall")')).toBeVisible();
    
    // Click the main "Opprett din første stall" button
    await page.click('button:has-text("Opprett din første stall")');
    
    // Wait for navigation to complete
    await page.waitForURL('/ny-stall');
    
    // Verify we're on the create stable form
    await expect(page.locator('h1')).toContainText('Legg til ny stall');
  });
});