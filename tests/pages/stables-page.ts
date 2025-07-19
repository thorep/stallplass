import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class StablesPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly filterButton: Locator;
  readonly priceFilter: Locator;
  readonly locationFilter: Locator;
  readonly amenitiesFilter: Locator;
  readonly sortDropdown: Locator;
  readonly stableCards: Locator;
  readonly mapView: Locator;
  readonly listView: Locator;
  readonly resultsCount: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.locator('[data-testid="search-input"]').or(page.locator('input[placeholder*="Søk"]'));
    this.searchButton = page.locator('[data-testid="search-button"]').or(page.locator('button:has-text("Søk")'));
    this.filterButton = page.locator('[data-testid="filter-button"]').or(page.locator('text=Filtre'));
    this.priceFilter = page.locator('[data-testid="price-filter"]');
    this.locationFilter = page.locator('[data-testid="location-filter"]');
    this.amenitiesFilter = page.locator('[data-testid="amenities-filter"]');
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]').or(page.locator('select'));
    this.stableCards = page.locator('[data-testid="stable-card"]').or(page.locator('.stable-card'));
    this.mapView = page.locator('[data-testid="map-view"]');
    this.listView = page.locator('[data-testid="list-view"]');
    this.resultsCount = page.locator('[data-testid="results-count"]');
    this.noResultsMessage = page.locator('[data-testid="no-results"]').or(page.locator('text=Ingen staller funnet'));
  }

  async goto() {
    await super.goto('/staller');
    await expect(this.searchInput).toBeVisible();
  }

  async searchStables(query: string) {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForSearchResults();
  }

  async waitForSearchResults() {
    // Wait for either results or no results message
    await Promise.race([
      this.stableCards.first().waitFor({ state: 'visible', timeout: 10000 }),
      this.noResultsMessage.waitFor({ state: 'visible', timeout: 10000 })
    ]);
  }

  async applyPriceFilter(minPrice: number, maxPrice: number) {
    await this.filterButton.click();
    await this.page.locator('input[name="minPrice"]').fill(minPrice.toString());
    await this.page.locator('input[name="maxPrice"]').fill(maxPrice.toString());
    await this.page.locator('button:has-text("Bruk filter")').click();
    await this.waitForSearchResults();
  }

  async applyLocationFilter(city: string) {
    await this.filterButton.click();
    await this.page.locator('input[name="city"]').fill(city);
    await this.page.locator('button:has-text("Bruk filter")').click();
    await this.waitForSearchResults();
  }

  async selectAmenities(amenities: string[]) {
    await this.filterButton.click();
    
    for (const amenity of amenities) {
      await this.page.locator(`input[type="checkbox"][value="${amenity}"]`).or(
        this.page.locator(`label:has-text("${amenity}") input[type="checkbox"]`)
      ).check();
    }
    
    await this.page.locator('button:has-text("Bruk filter")').click();
    await this.waitForSearchResults();
  }

  async sortBy(option: 'price-low' | 'price-high' | 'distance' | 'rating') {
    await this.sortDropdown.selectOption(option);
    await this.waitForSearchResults();
  }

  async clickStable(index: number = 0) {
    const stable = this.stableCards.nth(index);
    await expect(stable).toBeVisible();
    await stable.click();
    await this.page.waitForURL(/\/staller\/\d+/);
  }

  async getStableCount(): Promise<number> {
    await this.stableCards.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.stableCards.count();
  }

  async expectStablesVisible() {
    await expect(this.stableCards.first()).toBeVisible();
  }

  async expectNoResults() {
    await expect(this.noResultsMessage).toBeVisible();
  }

  async switchToMapView() {
    await this.page.locator('button:has-text("Kart")').click();
    await expect(this.mapView).toBeVisible();
  }

  async switchToListView() {
    await this.page.locator('button:has-text("Liste")').click();
    await expect(this.stableCards.first()).toBeVisible();
  }

  // Helper methods for stable card interactions
  async getStableCardInfo(index: number = 0) {
    const card = this.stableCards.nth(index);
    const name = await card.locator('[data-testid="stable-name"]').or(card.locator('h3')).textContent();
    const price = await card.locator('[data-testid="stable-price"]').textContent();
    const location = await card.locator('[data-testid="stable-location"]').textContent();
    
    return { name, price, location };
  }

  async favoriteStable(index: number = 0) {
    const card = this.stableCards.nth(index);
    await card.locator('[data-testid="favorite-button"]').or(card.locator('button[aria-label*="favoritt"]')).click();
  }
}