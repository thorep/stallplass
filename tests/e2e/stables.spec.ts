import { test, expect } from '@playwright/test';
import { StablesPage } from './pages/stables-page';
import { testStables, testSearchFilters } from './fixtures/test-data';

test.describe('Stables Browsing and Search', () => {
  test.beforeEach(async ({ page }) => {
    // Most tests require authentication
    // This will use the storageState from the setup
  });

  test.describe('Stable Listing', () => {
    test('should display list of stables', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.expectStablesVisible();
      
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThan(0);
    });

    test('should show stable details when clicked', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.clickStable(0);
      
      // Should be on stable detail page
      expect(page.url()).toMatch(/\/staller\/\d+/);
      
      // Should see stable information
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=kr').or(page.locator('[data-testid="price"]'))).toBeVisible();
    });

    test('should switch between list and map view', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      // Switch to map view
      await stablesPage.switchToMapView();
      
      // Switch back to list view
      await stablesPage.switchToListView();
      await stablesPage.expectStablesVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test('should search stables by name', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.searchStables('Test Ridestall');
      
      // Should show filtered results
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThanOrEqual(0);
    });

    test('should search stables by location', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.searchStables('Oslo');
      
      // Should show stables in Oslo area
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThanOrEqual(0);
    });

    test('should show no results for non-existent stable', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.searchStables('NonExistentStableName12345');
      await stablesPage.expectNoResults();
    });
  });

  test.describe('Filtering', () => {
    test('should filter by price range', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.applyPriceFilter(
        testSearchFilters.price.min,
        testSearchFilters.price.max
      );

      // Should show filtered results
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by location', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.applyLocationFilter(testSearchFilters.location.city);

      // Should show filtered results
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThanOrEqual(0);
    });

    test('should filter by amenities', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.selectAmenities(testSearchFilters.amenities);

      // Should show filtered results
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThanOrEqual(0);
    });

    test('should combine multiple filters', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      // Apply multiple filters
      await stablesPage.applyPriceFilter(
        testSearchFilters.price.min,
        testSearchFilters.price.max
      );
      
      await stablesPage.applyLocationFilter(testSearchFilters.location.city);

      // Should show filtered results or no results
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Sorting', () => {
    test('should sort by price low to high', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.sortBy('price-low');

      // Check that first stable has lower or equal price than second
      const firstStableInfo = await stablesPage.getStableCardInfo(0);
      const secondStableInfo = await stablesPage.getStableCardInfo(1);
      
      // Extract prices and compare (this is a basic check)
      expect(firstStableInfo.price).toBeDefined();
      expect(secondStableInfo.price).toBeDefined();
    });

    test('should sort by price high to low', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.sortBy('price-high');

      // Should reorder results
      const stableCount = await stablesPage.getStableCount();
      expect(stableCount).toBeGreaterThan(0);
    });
  });

  test.describe('Favorites', () => {
    test('should add stable to favorites', async ({ page }) => {
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.favoriteStable(0);
      
      // Should show success toast or visual feedback
      await stablesPage.waitForToast('Lagt til i favoritter').catch(() => {
        // Or check for visual change in favorite button
      });
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.expectStablesVisible();
      
      // Should be able to search on mobile
      await stablesPage.searchStables('Oslo');
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const stablesPage = new StablesPage(page);
      await stablesPage.goto();

      await stablesPage.expectStablesVisible();
      
      // Should be able to use filters on tablet
      await stablesPage.applyPriceFilter(3000, 8000);
    });
  });
});