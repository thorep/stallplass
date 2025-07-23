import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation - Tab Functionality', () => {
  test('logged in stable owner can click all dashboard navigation tabs and content loads correctly', async ({ page }) => {
    // User is already logged in as user1 via storageState
    await page.goto('/stall');
    
    // Should see main dashboard heading (h1 element exists)
    await expect(page.locator('h1')).toBeVisible();

    // Verify all 5 navigation tabs are visible and clickable
    const oversiktTab = page.locator('button:has-text("Oversikt")');
    const mineStaller = page.locator('button:has-text("Mine staller")');
    const leieforholdTab = page.locator('button:has-text("Leieforhold")');
    const tjenesterTab = page.locator('button:has-text("Tjenester")');
    const analyseTab = page.locator('button:has-text("Analyse")');

    // All tabs should be visible and clickable
    await expect(oversiktTab).toBeVisible();
    await expect(mineStaller).toBeVisible();
    await expect(leieforholdTab).toBeVisible();
    await expect(tjenesterTab).toBeVisible();
    await expect(analyseTab).toBeVisible();

    // Test "Oversikt" tab - should show some statistics or metrics
    await oversiktTab.click();
    await expect(page.locator('main')).toContainText(/plasser|leieforhold|stats/i); // Generic stats content

    // Test "Mine staller" tab - should show stable management interface
    await mineStaller.click();
    await expect(page.locator('main')).toContainText(/stall|barn|stable/i); // Generic stable content
    
    // Test "Leieforhold" tab - should show rental relationships interface
    await leieforholdTab.click();
    await expect(page.locator('main')).toContainText(/leie|rent|forhold/i); // Generic rental content
    
    // Test "Tjenester" tab - should show services management interface  
    await tjenesterTab.click();
    await expect(page.locator('main')).toContainText(/tjenest|service/i); // Generic services content

    // Test "Analyse" tab - should show analytics interface
    await analyseTab.click();
    await expect(page.locator('main')).toContainText(/vis|analys|stat/i); // Generic analytics content
  });
});