import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('shows correct header links when not logged in', async ({ page }) => {
    await page.goto('/');
    
    // Check main navigation links are visible
    await expect(page.locator('a[href="/staller"]')).toBeVisible();
    await expect(page.locator('a[href="/tjenester"]')).toBeVisible();
    await expect(page.locator('a[href="/logg-inn"]')).toBeVisible();
    
    // Check these links actually work by clicking one
    await page.click('a[href="/staller"]');
    await expect(page).toHaveURL('/staller');
  });

  test('shows correct header links when logged in as owner', async ({ page }) => {
    // Login first
    await page.goto('/logg-inn');
    await page.fill('input[type="email"]', 'owner@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Go to homepage to check header
    await page.goto('/');
    
    // Should see main navigation
    await expect(page.locator('a[href="/staller"]')).toBeVisible();
    await expect(page.locator('a[href="/tjenester"]')).toBeVisible();
    
    // Should see dashboard/profile links (not login)
    await expect(page.locator('a[href="/stall"]')).toBeVisible();
    await expect(page.locator('a[href="/logg-inn"]')).not.toBeVisible();
  });

  test('shows correct header links when logged in as rider', async ({ page }) => {
    // Login as rider
    await page.goto('/logg-inn');
    await page.fill('input[type="email"]', 'rider@test.com');
    await page.fill('input[type="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**', { waitUntil: 'networkidle' });
    
    // Go to homepage to check header
    await page.goto('/');
    
    // Should see main navigation
    await expect(page.locator('a[href="/staller"]')).toBeVisible();
    await expect(page.locator('a[href="/tjenester"]')).toBeVisible();
    
    // Should not see login link
    await expect(page.locator('a[href="/logg-inn"]')).not.toBeVisible();
  });
});