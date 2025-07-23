import { test, expect } from '@playwright/test';

test.describe('Public Navigation - Anonymous User Experience', () => {
  test('anonymous user sees correct public header links', async ({ page }) => {
    await page.goto('/');
    
    // Should see public navigation links
    await expect(page.locator('a[href="/staller"]')).toBeVisible();
    await expect(page.locator('a[href="/tjenester"]')).toBeVisible();
    await expect(page.locator('a[href="/logg-inn"]')).toBeVisible();
    
    // Should NOT see authenticated user links
    await expect(page.locator('a[href="/stall"]')).not.toBeVisible();
    await expect(page.locator('a[href="/meldinger"]')).not.toBeVisible();
    
    // Test that login link actually works
    await page.click('a[href="/logg-inn"]');
    await expect(page).toHaveURL('/logg-inn');
  });

  test('anonymous user can browse stables without authentication', async ({ page }) => {
    await page.goto('/staller');
    
    // Should be able to access stable search page with filters
    await expect(page.locator('select').first()).toBeVisible(); // Location filters
    
    // Should still see login option in header
    await expect(page.locator('a[href="/logg-inn"]')).toBeVisible();
  });

  test('anonymous user can browse services directory without authentication', async ({ page }) => {
    await page.goto('/tjenester');
    
    // Should be able to access services page
    expect(page.url()).toContain('/tjenester');
    
    // Should still see login option in header
    await expect(page.locator('a[href="/logg-inn"]')).toBeVisible();
  });

  test('protected pages redirect to login when not authenticated', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/stall');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/logg-inn');
  });

  test('messaging page redirects to login when not authenticated', async ({ page }) => {
    // Try to access messages without login
    await page.goto('/meldinger');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/logg-inn');
  });
});