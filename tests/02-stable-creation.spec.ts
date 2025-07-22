import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { TEST_USER } from './global-setup';

// This test uses the user created in global setup
test.describe('Stable Creation - Full E2E Test', () => {
  const testStableName = `E2E Test Stable ${Date.now()}`;
  
  // Use the auth state created by global setup
  test.use({ storageState: './tests/.auth/user.json' });
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/ny-stall');
    // Wait for form to be fully loaded
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 10000 });
  });

  test('should create a new stable and save it to database', async ({ page }) => {
    console.log('🏠 Testing stable creation with real authenticated user...');
    
    // Fill out all required fields with realistic data
    await page.fill('input[name="name"]', testStableName);
    await page.fill('textarea[name="description"]', 'This is an E2E test stable created by a real registered user.');
    await page.fill('input[name="totalBoxes"]', '8');
    
    // Select some amenities if available
    const amenityCheckboxes = page.locator('input[type="checkbox"]');
    const amenityCount = await amenityCheckboxes.count();
    if (amenityCount > 0) {
      console.log(`Found ${amenityCount} amenities, selecting the first one`);
      await amenityCheckboxes.first().check();
    }
    
    console.log('📝 Form filled out, submitting...');
    
    // Submit the form
    const createButton = page.locator('button[type="submit"]', { hasText: 'Opprett stall' });
    await createButton.click();
    
    // Wait for either success (redirect to stall page) or error message
    try {
      await page.waitForURL('/stall', { timeout: 15000 });
      console.log('✅ Successfully redirected to stall page');
      
      // Verify the stable was actually created in the database
      const dbResult = execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT id, name, description, total_boxes, owner_id FROM stables WHERE name = '${testStableName}'" -t`, 
        { encoding: 'utf-8' });
      
      console.log('🗄️ Database query result:', dbResult.trim());
      
      // Check if stable exists in database
      expect(dbResult.trim().length).toBeGreaterThan(0);
      expect(dbResult).toContain(testStableName);
      
      // Verify stable appears in stall page
      await expect(page.locator(`text=${testStableName}`)).toBeVisible({ timeout: 5000 });
      
      console.log('✅ STABLE CREATION TEST PASSED - Full E2E flow works!');
      console.log('   ✓ User registration works');
      console.log('   ✓ Authentication works');  
      console.log('   ✓ Form submission works');
      console.log('   ✓ Database persistence works');
      console.log('   ✓ UI updates work');
      
    } catch (timeoutError) {
      console.log('⏰ Timeout waiting for stall page redirect, checking for validation issues...');
      
      // Check current URL and form state
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);
      
      // Look for validation errors
      const errorMessages = await page.locator('[class*="error"], [role="alert"], .text-red-500').allTextContents();
      if (errorMessages.length > 0) {
        console.log('❌ Form validation errors:', errorMessages);
        throw new Error(`Form validation failed: ${errorMessages.join(', ')}`);
      }
      
      // Check for API error messages
      const apiError = await page.locator('text=Feil ved opprettelse av stall').count();
      if (apiError > 0) {
        console.log('❌ API error during stable creation');
        throw new Error('API error during stable creation');
      }
      
      // If no specific errors found, report the timeout
      console.log('🤔 No specific error found - may be address validation requirement');
      console.log('ℹ️  Note: Address fields may be required for full form submission');
      throw new Error(`Form submission timed out. Current URL: ${currentUrl}`);
    }
  });

  // Clean up test data after each test (global teardown will handle final cleanup)
  test.afterEach(async () => {
    try {
      console.log('🧹 Cleaning up test stable data...');
      execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "DELETE FROM stables WHERE name LIKE 'E2E Test Stable%'" > /dev/null 2>&1`);
      console.log('✅ Test stable cleanup completed');
    } catch (error) {
      console.log('⚠️ Stable cleanup failed (this is ok):', error);
    }
  });
});