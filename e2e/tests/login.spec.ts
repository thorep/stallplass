import { test, expect } from '@playwright/test';

test.describe('Authentication - User Login Flow', () => {
  test('test user 1 can successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/logg-inn');
    
    await page.fill('input[type="email"]', 'user1@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Verify we're logged in and redirected somewhere
    expect(page.url()).not.toContain('/logg-inn');
  });

  test('test user 2 can successfully log in with valid credentials', async ({ page }) => {
    await page.goto('/logg-inn');
    
    await page.fill('input[type="email"]', 'user2@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Verify we're logged in and redirected somewhere
    expect(page.url()).not.toContain('/logg-inn');
  });
});