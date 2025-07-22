import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Stable Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the new stable creation page
    await page.goto('/ny-stall');
  });

  test('should create a new stable successfully', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[name="name"]', { state: 'visible' });
    
    // Fill out the basic information
    await page.fill('[name="name"]', 'Test Stable E2E');
    await page.fill('[name="description"]', 'This is a test stable created by Playwright E2E tests');
    
    // Handle address search - type in address to trigger search
    const addressInput = page.locator('input[placeholder*="Søk etter adresse"]');
    await addressInput.fill('Stortorget 1');
    
    // Wait for search results and select first result
    await page.waitForSelector('button:has-text("Stortorget")', { timeout: 10000 });
    await page.click('button:has-text("Stortorget")');
    
    // Wait for address fields to be populated
    await page.waitForFunction(() => {
      const addressField = document.querySelector('[name="address"]') as HTMLInputElement;
      return addressField && addressField.value !== '';
    });
    
    // Set total boxes
    await page.fill('[name="totalBoxes"]', '15');
    
    // Upload a test image (create a small test image file)
    const testImagePath = path.join(__dirname, 'fixtures', 'test-stable-image.jpg');
    
    // Check if image upload component exists
    const imageUpload = page.locator('[data-testid="image-upload-input"]');
    if (await imageUpload.count() > 0) {
      await imageUpload.setInputFiles(testImagePath);
      
      // Wait for image upload to complete
      await expect(page.locator('img[alt*="Bilde"]')).toBeVisible({ timeout: 15000 });
    }
    
    // Select some amenities if available
    const amenityCheckboxes = page.locator('input[type="checkbox"]');
    const amenityCount = await amenityCheckboxes.count();
    if (amenityCount > 0) {
      // Select the first 2 amenities
      for (let i = 0; i < Math.min(2, amenityCount); i++) {
        await amenityCheckboxes.nth(i).check();
      }
    }
    
    // Submit the form - try multiple possible button texts
    const possibleButtons = [
      page.locator('button[type="submit"]', { hasText: 'Opprett stall' }),
      page.locator('button[type="submit"]', { hasText: 'Opprett' }),
      page.locator('button[type="submit"]', { hasText: 'Lagre' }),
      page.locator('button[type="submit"]')
    ];
    
    let buttonFound = false;
    for (const button of possibleButtons) {
      if (await button.count() > 0) {
        await button.click();
        buttonFound = true;
        break;
      }
    }
    
    if (!buttonFound) {
      throw new Error('Could not find submit button');
    }
    
    // Wait for navigation to stall page
    await expect(page).toHaveURL('/stall', { timeout: 15000 });
    
    // Verify the stable was created (check if it appears in the stall page)
    await expect(page.locator('text=Test Stable E2E')).toBeVisible();
  });

  test('should clean up images when canceling stable creation', async ({ page }) => {
    // Fill out the form partially
    await page.fill('[name="name"]', 'Test Stable To Cancel');
    await page.fill('[name="description"]', 'This stable will be canceled');
    
    // Upload a test image if possible
    const testImagePath = path.join(__dirname, 'fixtures', 'test-stable-image.jpg');
    const imageUpload = page.locator('[data-testid="image-upload-input"]');
    
    if (await imageUpload.count() > 0) {
      await imageUpload.setInputFiles(testImagePath);
      
      // Wait for image upload to complete
      await expect(page.locator('img[alt*="Bilde"]')).toBeVisible({ timeout: 15000 });
    }
    
    // Click cancel button
    const cancelButton = page.locator('button', { hasText: 'Avbryt' });
    await cancelButton.click();
    
    // Should navigate back to stall page
    await expect(page).toHaveURL('/stall', { timeout: 10000 });
    
    // The stable should not exist in the stall page
    await expect(page.locator('text=Test Stable To Cancel')).not.toBeVisible();
  });

  test('should warn user before leaving with unsaved images', async ({ page }) => {
    // Fill out form partially
    await page.fill('[name="name"]', 'Test Stable Navigation');
    
    // Upload a test image if possible
    const testImagePath = path.join(__dirname, 'fixtures', 'test-stable-image.jpg');
    const imageUpload = page.locator('[data-testid="image-upload-input"]');
    
    if (await imageUpload.count() > 0) {
      await imageUpload.setInputFiles(testImagePath);
      
      // Wait for image upload to complete
      await expect(page.locator('img[alt*="Bilde"]')).toBeVisible({ timeout: 15000 });
    }
    
    // Set up dialog handler for beforeunload warning
    let dialogAppeared = false;
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('beforeunload');
      dialogAppeared = true;
      await dialog.accept();
    });
    
    // Try to navigate away
    await page.goto('/stall');
    
    // If images were uploaded, dialog should have appeared
    if (await imageUpload.count() > 0) {
      expect(dialogAppeared).toBe(true);
    }
  });

  test('should handle form submission failure gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/stables', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Fill out the form
    await page.fill('[name="name"]', 'Test Stable Error');
    await page.fill('[name="description"]', 'This will fail to create');
    await page.fill('[name="address"]', 'Error Street 1');
    await page.fill('[name="city"]', 'Error City');
    await page.fill('[name="postalCode"]', '9999');
    
    // Submit the form
    const createButton = page.locator('button[type="submit"]', { hasText: 'Opprett stall' });
    await createButton.click();
    
    // Should show error message
    await expect(page.locator('text=Feil ved opprettelse av stall')).toBeVisible();
    
    // Should remain on the same page
    await expect(page).toHaveURL('/ny-stall');
    
    // Form should be cleared of images (due to cleanup)
    await expect(page.locator('img')).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    const possibleButtons = [
      page.locator('button[type="submit"]', { hasText: 'Opprett stall' }),
      page.locator('button[type="submit"]', { hasText: 'Opprett' }),
      page.locator('button[type="submit"]', { hasText: 'Lagre' }),
      page.locator('button[type="submit"]')
    ];
    
    let buttonFound = false;
    for (const button of possibleButtons) {
      if (await button.count() > 0) {
        await button.click();
        buttonFound = true;
        break;
      }
    }
    
    if (!buttonFound) {
      throw new Error('Could not find submit button');
    }
    
    // Should not navigate away due to browser validation
    await expect(page).toHaveURL('/ny-stall');
    
    // Check that required field validation is working
    const nameInput = page.locator('[name="name"]');
    await expect(nameInput).toHaveAttribute('required');
    
    const descriptionInput = page.locator('[name="description"]');
    await expect(descriptionInput).toHaveAttribute('required');
  });
});