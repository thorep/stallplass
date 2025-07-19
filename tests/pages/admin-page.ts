import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class AdminPage extends BasePage {
  readonly dashboardTab: Locator;
  readonly stablesTab: Locator;
  readonly usersTab: Locator;
  readonly paymentsTab: Locator;
  readonly pricingTab: Locator;
  readonly roadmapTab: Locator;
  readonly statsCards: Locator;
  readonly recentActivity: Locator;

  constructor(page: Page) {
    super(page);
    this.dashboardTab = page.locator('[data-testid="admin-dashboard-tab"]').or(page.locator('text=Dashboard'));
    this.stablesTab = page.locator('[data-testid="admin-stables-tab"]').or(page.locator('text=Staller'));
    this.usersTab = page.locator('[data-testid="admin-users-tab"]').or(page.locator('text=Brukere'));
    this.paymentsTab = page.locator('[data-testid="admin-payments-tab"]').or(page.locator('text=Betalinger'));
    this.pricingTab = page.locator('[data-testid="admin-pricing-tab"]').or(page.locator('text=Priser'));
    this.roadmapTab = page.locator('[data-testid="admin-roadmap-tab"]').or(page.locator('text=Roadmap'));
    this.statsCards = page.locator('[data-testid="stats-card"]');
    this.recentActivity = page.locator('[data-testid="recent-activity"]');
  }

  async goto() {
    await super.goto('/admin');
    await expect(this.dashboardTab).toBeVisible();
  }

  async switchToStablesManagement() {
    await this.stablesTab.click();
    await expect(this.page.locator('[data-testid="stables-table"]').or(this.page.locator('table'))).toBeVisible();
  }

  async switchToUsersManagement() {
    await this.usersTab.click();
    await expect(this.page.locator('[data-testid="users-table"]').or(this.page.locator('table'))).toBeVisible();
  }

  async switchToPaymentsManagement() {
    await this.paymentsTab.click();
    await expect(this.page.locator('[data-testid="payments-table"]').or(this.page.locator('table'))).toBeVisible();
  }

  async switchToPricingManagement() {
    await this.pricingTab.click();
    await expect(this.page.locator('[data-testid="pricing-form"]').or(this.page.locator('text=Grunnpris'))).toBeVisible();
  }

  async getDashboardStats() {
    const stats = await this.statsCards.allTextContents();
    return stats;
  }

  // Stables management
  async approveStable(stableName: string) {
    await this.switchToStablesManagement();
    const stableRow = this.page.locator(`tr:has-text("${stableName}")`);
    await stableRow.locator('button:has-text("Godkjenn")').click();
    await this.waitForToast('Stall godkjent');
  }

  async rejectStable(stableName: string, reason?: string) {
    await this.switchToStablesManagement();
    const stableRow = this.page.locator(`tr:has-text("${stableName}")`);
    await stableRow.locator('button:has-text("Avvis")').click();
    
    if (reason) {
      await this.page.locator('textarea[name="reason"]').fill(reason);
    }
    
    await this.page.locator('button:has-text("Bekreft avvisning")').click();
    await this.waitForToast('Stall avvist');
  }

  // Users management
  async searchUser(email: string) {
    await this.switchToUsersManagement();
    await this.page.locator('input[placeholder*="Søk brukere"]').fill(email);
    await this.page.locator('button:has-text("Søk")').click();
  }

  async banUser(email: string, reason?: string) {
    await this.searchUser(email);
    const userRow = this.page.locator(`tr:has-text("${email}")`);
    await userRow.locator('button:has-text("Utesteng")').click();
    
    if (reason) {
      await this.page.locator('textarea[name="reason"]').fill(reason);
    }
    
    await this.page.locator('button:has-text("Bekreft utestengelse")').click();
    await this.waitForToast('Bruker utestengt');
  }

  async makeUserAdmin(email: string) {
    await this.searchUser(email);
    const userRow = this.page.locator(`tr:has-text("${email}")`);
    await userRow.locator('button:has-text("Gjør til admin")').click();
    await this.page.locator('button:has-text("Bekreft")').click();
    await this.waitForToast('Bruker er nå administrator');
  }

  // Pricing management
  async updateBasePrice(newPrice: number) {
    await this.switchToPricingManagement();
    await this.page.locator('button:has-text("Rediger")').first().click();
    await this.page.locator('input[type="number"]').first().fill(newPrice.toString());
    await this.page.locator('button:has-text("Lagre")').click();
    await this.waitForToast('Grunnpris oppdatert');
  }

  async addDiscount(months: number, percentage: number) {
    await this.switchToPricingManagement();
    await this.page.locator('button:has-text("Legg til rabatt")').click();
    await this.page.locator('input[name="months"]').fill(months.toString());
    await this.page.locator('input[name="percentage"]').fill(percentage.toString());
    await this.page.locator('button:has-text("Legg til")').click();
    await this.waitForToast('Rabatt opprettet');
  }

  // Payments management
  async viewPaymentDetails(paymentId: string) {
    await this.switchToPaymentsManagement();
    const paymentRow = this.page.locator(`tr:has-text("${paymentId}")`);
    await paymentRow.locator('button:has-text("Detaljer")').click();
    await expect(this.page.locator('[data-testid="payment-modal"]')).toBeVisible();
  }

  async refundPayment(paymentId: string, reason?: string) {
    await this.viewPaymentDetails(paymentId);
    await this.page.locator('button:has-text("Refunder")').click();
    
    if (reason) {
      await this.page.locator('textarea[name="reason"]').fill(reason);
    }
    
    await this.page.locator('button:has-text("Bekreft refundering")').click();
    await this.waitForToast('Betaling refundert');
  }
}