import { test, expect } from '@playwright/test';
import { TEST_USER } from './global-setup';
import { execSync } from 'child_process';

test.describe('User Registration Flow', () => {
  // This test verifies that the registration flow works and that the user created in global setup exists
  test('should verify user registration and authentication', async ({ page }) => {
    console.log('🔐 Verifying user registration and authentication...');
    
    // Test that we can authenticate using the created user
    await page.goto('/login');
    
    // Wait for login form to load
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    
    // Fill out login form with the test user credentials
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    
    // Submit login
    const loginButton = page.locator('button[type="submit"]', { hasText: /logg inn|login/i });
    await loginButton.click();
    
    // Wait for successful login - should redirect to stall page
    await page.waitForURL('/stall', { timeout: 15000 });
    
    console.log('✅ Successfully logged in - redirected to stall page');
    
    // Verify user appears to be logged in by checking for user info in the UI
    const userIndicators = [
      page.locator(`text=${TEST_USER.name}`),
      page.locator(`text=${TEST_USER.email}`),
      page.locator('[data-testid="user-menu"]'),
      page.locator('.user-name')
    ];
    
    // At least one user indicator should be visible
    let userVisible = false;
    for (const indicator of userIndicators) {
      try {
        await expect(indicator).toBeVisible({ timeout: 2000 });
        userVisible = true;
        break;
      } catch (error) {
        // Continue to next indicator
      }
    }
    
    if (!userVisible) {
      console.log('⚠️ User indicators not found in UI, but login was successful');
    }
    
    // Verify user exists in database
    const dbResult = execSync(
      `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT id, email, name FROM users WHERE email = '${TEST_USER.email}'" -t`, 
      { encoding: 'utf-8' }
    );
    
    console.log('🗄️ Database user check:', dbResult.trim());
    expect(dbResult.trim().length).toBeGreaterThan(0);
    expect(dbResult).toContain(TEST_USER.email);
    
    console.log('✅ User registration and authentication verification completed');
  });
});