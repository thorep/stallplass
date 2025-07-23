import { test, expect } from '@playwright/test';

test.describe('Box Creation Flow', () => {
  test('logged in user can create multiple boxes with different configurations for testing filters', async ({ page }) => {
    // Navigate to stable management dashboard
    await page.goto('/stall');
    await expect(page).toHaveURL('/stall');
    
    // Navigate to "Mine staller" tab to access existing stable
    await page.click('button:has-text("Mine staller")');
    
    // Wait for stable list to load and find a stable to add boxes to
    // If user has no stables, the stable creation test should run first
    await expect(page.locator('text=Test Stall')).toBeVisible({ timeout: 10000 });
    
    // Find the first stable and look for the add box button
    const addBoxButton = page.locator('[data-cy="add-box-button"]');
    const addFirstBoxButton = page.locator('[data-cy="add-first-box-button"]');
    
    // Click appropriate button based on whether boxes already exist
    if (await addFirstBoxButton.isVisible()) {
      await addFirstBoxButton.click();
    } else {
      await expect(addBoxButton).toBeVisible({ timeout: 10000 });
      await addBoxButton.click();
    }
    
    // Wait for box management modal to appear
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 10000 });

    // Create Box 1: Premium Indoor Box
    await page.fill('[data-cy="box-name-input"]', 'Premium Stall A');
    await page.fill('[data-cy="box-price-input"]', '6000');
    await page.fill('[data-cy="box-size-input"]', '15.5');
    await page.selectOption('[data-cy="box-type-select"]', 'BOKS');
    await page.selectOption('[data-cy="box-max-horse-size-select"]', 'Large');
    await page.fill('[data-cy="box-description-textarea"]', 'Luksuriøs inneboks med store vinduer og optimal ventilasjon. Perfekt for store hester.');
    
    // Ensure availability is checked
    await expect(page.locator('[data-cy="box-available-checkbox"]')).toBeChecked();
    
    // Save the first box
    await page.click('[data-cy="save-box-button"]');
    
    // Wait for modal to close and box to appear in the list
    await expect(page.locator('h2:has-text("Legg til ny boks")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Premium Stall A')).toBeVisible({ timeout: 10000 });

    // Create Box 2: Budget Outdoor Box
    await page.click('[data-cy="add-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 10000 });
    
    await page.fill('[data-cy="box-name-input"]', 'Utegang Nord');
    await page.fill('[data-cy="box-price-input"]', '3500');
    await page.fill('[data-cy="box-size-input"]', '25.0');
    await page.selectOption('[data-cy="box-type-select"]', 'UTEGANG');
    await page.selectOption('[data-cy="box-max-horse-size-select"]', 'Medium');
    await page.fill('[data-cy="box-description-textarea"]', 'Romslig utegang med god tilgang til beiteområde. Ideell for hester som liker å være ute.');
    
    // Keep availability checked
    await expect(page.locator('[data-cy="box-available-checkbox"]')).toBeChecked();
    
    await page.click('[data-cy="save-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Utegang Nord')).toBeVisible({ timeout: 10000 });

    // Create Box 3: Mid-range Indoor Box for Ponies
    await page.click('[data-cy="add-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 10000 });
    
    await page.fill('[data-cy="box-name-input"]', 'Ponni Paradise');
    await page.fill('[data-cy="box-price-input"]', '4200');
    await page.fill('[data-cy="box-size-input"]', '10.0');
    await page.selectOption('[data-cy="box-type-select"]', 'BOKS');
    await page.selectOption('[data-cy="box-max-horse-size-select"]', 'Pony');
    await page.fill('[data-cy="box-description-textarea"]', 'Koselig boks spesielt tilpasset ponnier og mindre hester. Trygg og komfortabel.');
    
    await page.click('[data-cy="save-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Ponni Paradise')).toBeVisible({ timeout: 10000 });

    // Create Box 4: Expensive Large Outdoor Box (Unavailable for testing filters)
    await page.click('[data-cy="add-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 10000 });
    
    await page.fill('[data-cy="box-name-input"]', 'VIP Utegang');
    await page.fill('[data-cy="box-price-input"]', '8500');
    await page.fill('[data-cy="box-size-input"]', '30.0');
    await page.selectOption('[data-cy="box-type-select"]', 'UTEGANG');
    await page.selectOption('[data-cy="box-max-horse-size-select"]', 'Large');
    await page.fill('[data-cy="box-description-textarea"]', 'Eksklusiv stor utegang med premium fasiliteter. Kun for de mest krevende hestene.');
    
    // Make this box unavailable for filter testing
    await page.uncheck('[data-cy="box-available-checkbox"]');
    
    await page.click('[data-cy="save-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=VIP Utegang')).toBeVisible({ timeout: 10000 });

    // Create Box 5: Small Indoor Box for Small Horses
    await page.click('[data-cy="add-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 10000 });
    
    await page.fill('[data-cy="box-name-input"]', 'Kompakt Boks B');
    await page.fill('[data-cy="box-price-input"]', '4800');
    await page.fill('[data-cy="box-size-input"]', '12.0');
    await page.selectOption('[data-cy="box-type-select"]', 'BOKS');
    await page.selectOption('[data-cy="box-max-horse-size-select"]', 'Small');
    await page.fill('[data-cy="box-description-textarea"]', 'Praktisk boks for mindre hester. God plass og gode fasiliteter til en rimelig pris.');
    
    await page.click('[data-cy="save-box-button"]');
    await expect(page.locator('h2:has-text("Legg til ny boks")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Kompakt Boks B')).toBeVisible({ timeout: 10000 });

    // Verify all boxes are displayed in the stable management interface
    const boxNames = [
      'Premium Stall A',
      'Utegang Nord', 
      'Ponni Paradise',
      'VIP Utegang',
      'Kompakt Boks B'
    ];
    
    for (const boxName of boxNames) {
      await expect(page.locator(`text=${boxName}`)).toBeVisible({ timeout: 5000 });
    }

    // Verify the variety of configurations were created for filtering tests:
    // - Price range: 3500 - 8500 NOK
    // - Box types: Both BOKS and UTEGANG
    // - Horse sizes: Pony, Small, Medium, Large
    // - Sizes: 10.0 - 30.0 m²
    // - Availability: 4 available, 1 unavailable
    console.log('Created 5 boxes with diverse configurations for filter testing:');
    console.log('1. Premium Stall A: 6000 NOK, BOKS, Large, 15.5m², Available');
    console.log('2. Utegang Nord: 3500 NOK, UTEGANG, Medium, 25.0m², Available');
    console.log('3. Ponni Paradise: 4200 NOK, BOKS, Pony, 10.0m², Available');
    console.log('4. VIP Utegang: 8500 NOK, UTEGANG, Large, 30.0m², Unavailable');
    console.log('5. Kompakt Boks B: 4800 NOK, BOKS, Small, 12.0m², Available');
  });

  test('box creation form shows validation errors for required fields', async ({ page }) => {
    // Navigate to stable management and attempt to create box with empty form
    await page.goto('/stall');
    await page.click('button:has-text("Mine staller")');
    
    // Click add box button (use either variant)
    const addBoxButton = page.locator('[data-cy="add-box-button"]');
    const addFirstBoxButton = page.locator('[data-cy="add-first-box-button"]');
    
    if (await addFirstBoxButton.isVisible()) {
      await addFirstBoxButton.click();
    } else {
      await expect(addBoxButton).toBeVisible({ timeout: 10000 });
      await addBoxButton.click();
    }
    
    // Wait for modal to appear
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 10000 });
    
    // Try to submit empty form
    await page.click('[data-cy="save-box-button"]');
    
    // Form should not submit and should still show modal
    await expect(page.locator('h2:has-text("Legg til ny boks")')).toBeVisible({ timeout: 5000 });
    
    // Verify required field validation (HTML5 validation should prevent submission)
    const nameInput = page.locator('[data-cy="box-name-input"]');
    const priceInput = page.locator('[data-cy="box-price-input"]');
    
    // Check that required fields have required attribute
    await expect(nameInput).toHaveAttribute('required');
    await expect(priceInput).toHaveAttribute('required');
  });

  test('user can edit existing box and change its configuration', async ({ page }) => {
    // Navigate to stable management
    await page.goto('/stall');
    await page.click('button:has-text("Mine staller")');
    
    // Wait for boxes to load and find a box to edit
    await expect(page.locator('text=Premium Stall A')).toBeVisible({ timeout: 10000 });
    
    // Find and click edit button for the first box (Premium Stall A)
    // Note: The edit functionality is typically implemented with edit buttons in the box cards
    // We'll look for the box and an associated edit button or clickable area
    const boxCard = page.locator('text=Premium Stall A').locator('..').locator('..');
    
    // Look for edit button, pen icon, or similar edit trigger near the box
    const editButton = boxCard.locator('button:has([data-testid="edit"]), button:has([class*="pen"]), button:has([class*="edit"])').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // Alternative: some implementations might allow clicking the box card itself to edit
      await boxCard.click();
    }
    
    // Wait for edit modal to appear
    await expect(page.locator('h2:has-text("Rediger boks")')).toBeVisible({ timeout: 10000 });
    
    // Verify form is pre-filled with existing data
    await expect(page.locator('[data-cy="box-name-input"]')).toHaveValue('Premium Stall A');
    await expect(page.locator('[data-cy="box-price-input"]')).toHaveValue('6000');
    
    // Make changes to the box
    await page.fill('[data-cy="box-name-input"]', 'Premium Stall A - Updated');
    await page.fill('[data-cy="box-price-input"]', '6500');
    await page.selectOption('[data-cy="box-max-horse-size-select"]', 'Medium');
    
    // Save changes
    await page.click('[data-cy="save-box-button"]');
    
    // Verify modal closes and changes are reflected
    await expect(page.locator('h2:has-text("Rediger boks")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Premium Stall A - Updated')).toBeVisible({ timeout: 10000 });
  });
});