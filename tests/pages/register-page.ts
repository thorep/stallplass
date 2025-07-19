import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class RegisterPage extends BasePage {
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly phoneInput: Locator;
  readonly termsCheckbox: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.displayNameInput = page.locator('input[name="displayName"]').or(page.locator('input[name="name"]'));
    this.emailInput = page.locator('input[type="email"]').or(page.locator('input[name="email"]'));
    this.passwordInput = page.locator('input[name="password"]').first();
    this.confirmPasswordInput = page.locator('input[name="confirmPassword"]').or(page.locator('input[name="passwordConfirm"]'));
    this.phoneInput = page.locator('input[type="tel"]').or(page.locator('input[name="phone"]'));
    this.termsCheckbox = page.locator('input[type="checkbox"]').or(page.locator('input[name="terms"]'));
    this.submitButton = page.locator('button[type="submit"]').or(page.locator('text=Registrer'));
    this.loginLink = page.locator('text=Logg inn her').or(page.locator('text=Har du allerede konto?'));
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error'));
  }

  async goto() {
    await super.goto('/registrer');
    await expect(this.emailInput).toBeVisible();
  }

  async register(userData: {
    displayName: string;
    email: string;
    password: string;
    phone: string;
    acceptTerms?: boolean;
  }) {
    await this.displayNameInput.fill(userData.displayName);
    await this.emailInput.fill(userData.email);
    await this.passwordInput.fill(userData.password);
    await this.confirmPasswordInput.fill(userData.password);
    await this.phoneInput.fill(userData.phone);

    if (userData.acceptTerms !== false) {
      await this.termsCheckbox.check();
    }

    await this.submitButton.click();
  }

  async registerAndWaitForRedirect(userData: {
    displayName: string;
    email: string;
    password: string;
    phone: string;
    acceptTerms?: boolean;
  }, expectedUrl: string | RegExp = /\/(dashboard|profil|velkommen)/) {
    await this.register(userData);
    await this.page.waitForURL(expectedUrl, { timeout: 15000 });
  }

  async expectRegistrationError(expectedErrorText?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedErrorText) {
      await expect(this.errorMessage).toContainText(expectedErrorText);
    }
  }

  async goToLogin() {
    await this.loginLink.click();
    await this.page.waitForURL(/\/logg-inn/);
  }

  async checkFormValidation() {
    // Try to submit empty form and check for validation errors
    await this.submitButton.click();
    
    const validationErrors = this.page.locator('[data-testid="validation-error"]').or(this.page.locator('.validation-error'));
    await expect(validationErrors.first()).toBeVisible();
  }
}