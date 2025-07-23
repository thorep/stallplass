import { test, expect } from '@playwright/test';

test.describe('Authentication - User Login Flow', () => {
  test('test user 1 can successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/logg-inn');
    
    // Wait for login form to be fully loaded
    await page.waitForSelector('[data-cy="login-email-input"]', { state: 'visible' });
    
    await page.fill('[data-cy="login-email-input"]', 'user1@test.com');
    await page.fill('[data-cy="login-password-input"]', 'test123');
    await page.click('[data-cy="login-submit-button"]');
    
    // Wait for successful redirect to dashboard
    await page.waitForURL('/stall', { timeout: 15000 });
    
    // Verify we're logged in and redirected to dashboard
    expect(page.url()).toContain('/stall');
  });

  test('test user 2 can successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/logg-inn');
    
    // Wait for login form to be fully loaded
    await page.waitForSelector('[data-cy="login-email-input"]', { state: 'visible' });
    
    await page.fill('[data-cy="login-email-input"]', 'user2@test.com');
    await page.fill('[data-cy="login-password-input"]', 'test123');
    await page.click('[data-cy="login-submit-button"]');
    
    // Wait for successful redirect to dashboard
    await page.waitForURL('/stall', { timeout: 15000 });
    
    // Verify we're logged in and redirected to dashboard
    expect(page.url()).toContain('/stall');
  });
});