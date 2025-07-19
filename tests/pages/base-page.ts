import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common navigation elements
  get headerLogo(): Locator {
    return this.page.locator('[data-testid="header-logo"]').or(this.page.locator('img[alt*="Stallplass"]'));
  }

  get navigationMenu(): Locator {
    return this.page.locator('[data-testid="navigation-menu"]').or(this.page.locator('nav'));
  }

  get userMenu(): Locator {
    return this.page.locator('[data-testid="user-menu"]');
  }

  get loginButton(): Locator {
    return this.page.locator('[data-testid="login-button"]').or(this.page.locator('text=Logg inn'));
  }

  get registerButton(): Locator {
    return this.page.locator('[data-testid="register-button"]').or(this.page.locator('text=Registrer'));
  }

  get logoutButton(): Locator {
    return this.page.locator('[data-testid="logout-button"]').or(this.page.locator('text=Logg ut'));
  }

  // Common actions
  async goto(path: string = '') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for any loading spinners to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async clickRegister() {
    await this.registerButton.click();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await expect(this.loginButton).toBeVisible();
  }

  // Utility methods
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  async waitForToast(expectedText?: string) {
    const toast = this.page.locator('[data-testid="toast"]').or(this.page.locator('.toast'));
    await expect(toast).toBeVisible();
    
    if (expectedText) {
      await expect(toast).toContainText(expectedText);
    }
    
    // Wait for toast to disappear
    await toast.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async fillForm(formData: Record<string, string>) {
    for (const [fieldName, value] of Object.entries(formData)) {
      const field = this.page.locator(`[name="${fieldName}"]`).or(this.page.locator(`#${fieldName}`));
      await field.fill(value);
    }
  }

  async submitForm() {
    await this.page.locator('button[type="submit"]').click();
  }

  // Check for common error states
  async checkForErrors() {
    const errorElements = this.page.locator('[data-testid="error"]').or(this.page.locator('.error'));
    const errorCount = await errorElements.count();
    
    if (errorCount > 0) {
      const errors = await errorElements.allTextContents();
      throw new Error(`Page contains errors: ${errors.join(', ')}`);
    }
  }

  // Wait for API calls to complete
  async waitForApiCall(urlPattern: string | RegExp) {
    return this.page.waitForResponse(response => {
      const url = response.url();
      const pattern = typeof urlPattern === 'string' ? new RegExp(urlPattern) : urlPattern;
      return pattern.test(url) && response.status() < 400;
    });
  }
}