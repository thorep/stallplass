import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    this.passwordInput = page.locator('input[type="password"]').or(page.locator('input[name="password"]'));
    this.submitButton = page.locator('button[type="submit"]').or(page.locator('text=Logg inn'));
    this.forgotPasswordLink = page.locator('text=Glemt passord?');
    this.registerLink = page.locator('text=Registrer deg her').or(page.locator('text=Opprett konto'));
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error'));
  }

  async goto() {
    await super.goto('/logg-inn');
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginAndWaitForRedirect(email: string, password: string, expectedUrl: string | RegExp = /\/(dashboard|profil)/) {
    await this.login(email, password);
    await this.page.waitForURL(expectedUrl, { timeout: 10000 });
  }

  async expectLoginError(expectedErrorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedErrorText) {
      await expect(this.errorMessage).toContainText(expectedErrorText);
    }
  }

  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL(/\/registrer/);
  }

  async goToForgotPassword() {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL(/\/glemt-passord/);
  }
}