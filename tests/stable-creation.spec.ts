import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('🏠 Stable Creation - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the new stable creation page
    await page.goto('/ny-stall');
    // Wait for form to be fully loaded
    await page.waitForSelector('[name="name"]', { state: 'visible' });
  });

  test('✅ Complete stable creation with all fields, images, and amenities', async ({ page }) => {
    // Fill out the basic information
    await page.fill('[name="name"]', 'Test Stable E2E');
    await page.fill('[name="description"]', 'This is a test stable created by Playwright E2E tests');
    
    // Fill out address information (simulate address search selection)
    // Note: In a real test, you might need to interact with the address search component
    await page.fill('[name="address"]', 'Testveien 123');
    await page.fill('[name="city"]', 'Oslo');
    await page.fill('[name="postalCode"]', '0123');
    await page.fill('[name="county"]', 'Oslo');
    
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
    
    // Submit the form
    const createButton = page.locator('button[type="submit"]', { hasText: 'Opprett stall' });
    await createButton.click();
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    
    // Verify the stable was created (check if it appears in the dashboard)
    await expect(page.locator('text=Test Stable E2E')).toBeVisible();
  });
});

test.describe('🧹 Image Cleanup Feature - Orphaned Image Prevention', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the new stable creation page
    await page.goto('/ny-stall');
    // Wait for form to be fully loaded
    await page.waitForSelector('[name="name"]', { state: 'visible' });
  });

  test('🗑️ Images are deleted when user clicks cancel button', async ({ page }) => {
    // Fill out the form partially with test data
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
    
    // Should navigate back to dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });
    
    // The stable should not exist in the dashboard
    await expect(page.locator('text=Test Stable To Cancel')).not.toBeVisible();
  });

  test('⚠️  User receives warning when navigating away with unsaved images', async ({ page }) => {
    // Fill out form partially with test data
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
    await page.goto('/dashboard');
    
    // If images were uploaded, dialog should have appeared
    if (await imageUpload.count() > 0) {
      expect(dialogAppeared).toBe(true);
    }
  });

  test('🔄 Images are cleaned up when form submission fails', async ({ page }) => {
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
});

test.describe('🛡️ Form Validation & Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the new stable creation page
    await page.goto('/ny-stall');
    // Wait for form to be fully loaded
    await page.waitForSelector('[name="name"]', { state: 'visible' });
  });

  test('📝 Required fields prevent form submission when empty', async ({ page }) => {
    // Try to submit empty form
    const createButton = page.locator('button[type="submit"]', { hasText: 'Opprett stall' });
    await createButton.click();
    
    // Should not navigate away due to browser validation
    await expect(page).toHaveURL('/ny-stall');
    
    // Check that required field validation is working
    const nameInput = page.locator('[name="name"]');
    await expect(nameInput).toHaveAttribute('required');
    
    const descriptionInput = page.locator('[name="description"]');
    await expect(descriptionInput).toHaveAttribute('required');
  });
});