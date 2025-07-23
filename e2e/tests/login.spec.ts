import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('can login as user1@test.com', async ({ page }) => {
    await page.goto('/logg-inn');
    
    await page.fill('input[type="email"]', 'user1@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Verify we're logged in and redirected somewhere
    expect(page.url()).not.toContain('/logg-inn');
  });

  test('can login as user2@test.com', async ({ page }) => {
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