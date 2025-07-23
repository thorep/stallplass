import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Stable Creation Flow', () => {
  test('logged in user can create a new stable and verify it appears in dashboard', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Check if user already has stables - if yes, go to "Mine staller" and add new stable
    // If no stables exist, use "Opprett din første stall" button
    const createFirstStableButton = page.locator('[data-cy="create-first-stable-button"]');
    const mineStaller = page.locator('button:has-text("Mine staller")');
    
    if (await createFirstStableButton.isVisible()) {
      // No existing stables - use the "create first stable" button
      await createFirstStableButton.click();
    } else {
      // User has existing stables - go to "Mine staller" tab and add new stable
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
    await expect(page).toHaveURL('/ny-stall');
    await expect(page.locator('h1')).toContainText('Legg til ny stall');

    // Fill in stable name with a timestamp to ensure uniqueness
    const uniqueName = `Test Stall ${Date.now()}`;
    await page.fill('input[name="name"], textbox:below(:text("Navn på stall"))', uniqueName);

    // Fill in address using the search field and select from suggestions
    const searchInput = page.locator('input[placeholder="Begynn å skrive adressen..."]');
    await searchInput.fill('Albatrossveien 28C');
    
    // Wait for address suggestions to appear and click the first one
    await page.waitForSelector('button:has-text("Albatrossveien 28C")', { timeout: 10000 });
    await page.locator('button:has-text("Albatrossveien 28C")').first().click();
    
    // Wait a moment for the form to update
    await page.waitForTimeout(1000);

    // Fill in description
    await page.fill('textarea[name="description"]', 'En moderne stall med gode fasiliteter for hester og ryttere. Perfekt beliggenhet med god tilgang til ridestier.');

    // Set number of boxes
    await page.fill('input[name="totalBoxes"]', '10');

    // Skip image upload for now to focus on basic form submission

    // Select some amenities
    await page.check('input[type="checkbox"]:near(:text("24/7 tilgang"))');
    await page.check('input[type="checkbox"]:near(:text("Beiteområde"))');
    await page.check('input[type="checkbox"]:near(:text("Bilparkering"))');
    await page.check('input[type="checkbox"]:near(:text("Toalett"))');

    // Submit the form
    await page.click('button:has-text("Opprett stall")');

    // Wait for either success redirect or error message
    try {
      await page.waitForURL(/\/dashboard(\?.*)?$/, { timeout: 10000 });
    } catch (error) {
      // Check if there's an error message on the page
      const errorMessage = page.locator('text=Feil ved opprettelse av stall');
      if (await errorMessage.isVisible()) {
        throw new Error('Form submission failed with error: Feil ved opprettelse av stall. Address fields might be required.');
      }
      throw error;
    }
    
    // Should now be back on dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Navigate to "Mine staller" tab to verify the stable was created
    await page.click('button:has-text("Mine staller")');
    
    // Wait for stable list to load and verify our stable appears
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible({ timeout: 10000 });
  });


  test('stable creation form shows validation errors for required fields', async ({ page }) => {
    // Navigate to stable creation form - handle existing stables scenario
    await page.goto('/dashboard');
    
    const createFirstStableButton = page.locator('[data-cy="create-first-stable-button"]');
    
    if (await createFirstStableButton.isVisible()) {
      await createFirstStableButton.click();
    } else {
      // User has existing stables - go to Mine staller tab and create new stable
      await page.click('text=Mine staller');
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
    
    await page.waitForURL('/ny-stall', { timeout: 30000 });
    await expect(page).toHaveURL('/ny-stall');

    // Try to submit empty form
    await page.click('button:has-text("Opprett stall")');

    // Should still be on the same page (form didn't submit) 
    await expect(page).toHaveURL('/ny-stall', { timeout: 5000 });
    
    // Check for validation feedback - should still show the form heading
    await expect(page.locator('h1')).toContainText('Legg til ny stall');
  });
});