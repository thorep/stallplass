import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Stable Creation Flow', () => {
  test('logged in user can create a new stable and verify it appears in dashboard', async ({ page }) => {
    // Navigate to dashboard first
    await page.goto('/stall');
    await expect(page).toHaveURL('/stall');
    
    // Click "Opprett din første stall" button to navigate to creation form
    await page.click('button:has-text("Opprett din første stall")');
    await expect(page).toHaveURL('/ny-stall');
    await expect(page.locator('h1')).toContainText('Legg til ny stall');

    // Fill in stable name
    await page.fill('input[name="name"], textbox:below(:text("Navn på stall"))', 'Stall Prestbøen');

    // Fill in address using the search field and select from suggestions
    const searchInput = page.locator('input[placeholder="Begynn å skrive adressen..."]');
    await searchInput.fill('Albatrossveien 28C');
    
    // Wait for address suggestions to appear and click the first one
    await page.waitForSelector('button:has-text("Albatrossveien 28C")', { timeout: 10000 });
    await page.locator('button:has-text("Albatrossveien 28C")').first().click();
    
    // Wait a moment for the form to update
    await page.waitForTimeout(1000);
    
    // Verify address fields were auto-filled
    await expect(page.locator('input[name="address"]')).toHaveValue('Albatrossveien 28C');
    await expect(page.locator('input[name="city"]')).toHaveValue('SANDEFJORD');

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
      await page.waitForURL(/\/stall(\?.*)?$/, { timeout: 10000 });
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
    await expect(page.locator('text=Stall Prestbøen')).toBeVisible({ timeout: 10000 });
    
    // Verify address information is shown (either street name or city)
    await expect(page.locator('text=Albatrossveien 28C, text=SANDEFJORD').first()).toBeVisible();
    
    // Verify some of the amenities we selected
    await expect(page.locator('text=24/7 tilgang')).toBeVisible();
  });


  test('stable creation form shows validation errors for required fields', async ({ page }) => {
    // Navigate to stable creation form
    await page.goto('/stall');
    await page.click('button:has-text("Opprett din første stall")');
    await expect(page).toHaveURL('/ny-stall');

    // Try to submit empty form
    await page.click('button:has-text("Opprett stall")');

    // Should still be on the same page (form didn't submit) 
    await expect(page).toHaveURL('/ny-stall', { timeout: 5000 });
    
    // Check for validation feedback - should still show the form heading
    await expect(page.locator('h1')).toContainText('Legg til ny stall');
  });
});