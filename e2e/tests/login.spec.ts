import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('can login as owner@test.com', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'owner@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Verify we're logged in and redirected somewhere
    expect(page.url()).not.toContain('/login');
  });

  test('can login as rider@test.com', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'rider@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Verify we're logged in and redirected somewhere
    expect(page.url()).not.toContain('/login');
  });
});