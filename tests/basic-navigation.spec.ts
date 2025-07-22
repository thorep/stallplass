import { test, expect } from '@playwright/test';

test.describe('Basic Navigation Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Check that we're on the right page
    await expect(page).toHaveTitle(/Stallplass/);
    
    // Check for main navigation or content
    const hasContent = await page.locator('nav, header, main, .container').count();
    expect(hasContent).toBeGreaterThan(0);
    
    console.log('✅ Homepage loaded successfully');
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/logg-inn');
    
    // Wait for login form
    await page.waitForSelector('input[name="email"]', { state: 'visible' });
    
    // Check form fields exist
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Login page loaded successfully');
  });

  test('should navigate to stable creation page', async ({ page }) => {
    await page.goto('/ny-stall');
    
    // Wait for form to load
    await page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 10000 });
    
    // Check basic form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    
    console.log('✅ Stable creation page loaded successfully');
  });
});