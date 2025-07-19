import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { RegisterPage } from './pages/register-page';
import { testUsers, generateRandomEmail, generateRandomPhone } from './fixtures/test-data';

test.describe('Authentication', () => {
  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      const userData = {
        displayName: 'Test User',
        email: generateRandomEmail(),
        password: 'TestPassword123!',
        phone: generateRandomPhone(),
      };

      await registerPage.registerAndWaitForRedirect(userData);

      // Should be redirected to dashboard or welcome page
      expect(page.url()).toMatch(/\/(dashboard|velkommen|profil)/);
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      // Try to register with invalid email
      await registerPage.register({
        displayName: 'Test User',
        email: 'invalid-email',
        password: 'weak',
        phone: 'invalid-phone',
      });

      await registerPage.expectRegistrationError();
    });

    test('should prevent registration with existing email', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      // Try to register with existing email
      await registerPage.register(testUsers.regularUser);

      await registerPage.expectRegistrationError('E-postadresse er allerede registrert');
    });

    test('should require terms acceptance', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      const userData = {
        displayName: 'Test User',
        email: generateRandomEmail(),
        password: 'TestPassword123!',
        phone: generateRandomPhone(),
        acceptTerms: false,
      };

      await registerPage.register(userData);
      await registerPage.expectRegistrationError('Du må akseptere vilkårene');
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.loginAndWaitForRedirect(
        testUsers.regularUser.email,
        testUsers.regularUser.password
      );

      // Should be redirected to dashboard
      expect(page.url()).toMatch(/\/(dashboard|profil)/);
      
      // Should see user menu or profile indicator
      await expect(
        page.locator('[data-testid="user-menu"]').or(page.locator('text=' + testUsers.regularUser.displayName))
      ).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('wrong@email.com', 'wrongpassword');
      await loginPage.expectLoginError('Ugyldig e-post eller passord');
    });

    test('should show error for empty fields', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('', '');
      await loginPage.expectLoginError();
    });

    test('should navigate to registration from login', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.goToRegister();
      expect(page.url()).toContain('/registrer');
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      
      // First login
      await loginPage.goto();
      await loginPage.loginAndWaitForRedirect(
        testUsers.regularUser.email,
        testUsers.regularUser.password
      );

      // Then logout
      await loginPage.logout();
      
      // Should be redirected to home page and see login button
      expect(page.url()).toMatch(/\/(|logg-inn)/);
      await expect(loginPage.loginButton).toBeVisible();
    });
  });

  test.describe('Admin Authentication', () => {
    test('should login as admin and access admin dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.loginAndWaitForRedirect(
        testUsers.admin.email,
        testUsers.admin.password,
        /\/admin/
      );

      // Should be redirected to admin dashboard
      expect(page.url()).toContain('/admin');
      
      // Should see admin-specific content
      await expect(
        page.locator('text=Admin Dashboard').or(page.locator('[data-testid="admin-dashboard"]'))
      ).toBeVisible();
    });

    test('should prevent non-admin user from accessing admin dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Login as regular user
      await loginPage.loginAndWaitForRedirect(
        testUsers.regularUser.email,
        testUsers.regularUser.password
      );

      // Try to access admin page
      await page.goto('/admin');
      
      // Should be redirected away or see unauthorized message
      await expect(
        page.locator('text=Ikke autorisert').or(page.locator('text=Unauthorized'))
      ).toBeVisible().catch(async () => {
        // Or redirected away from admin page
        expect(page.url()).not.toContain('/admin');
      });
    });
  });

  test.describe('Password Reset', () => {
    test('should show password reset form', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.goToForgotPassword();
      
      // Should see password reset form
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('text=Tilbakestill passord')).toBeVisible();
    });

    test('should send password reset email', async ({ page }) => {
      await page.goto('/glemt-passord');

      await page.fill('input[type="email"]', testUsers.regularUser.email);
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(
        page.locator('text=E-post sendt').or(page.locator('text=Tilbakestillingslenke sendt'))
      ).toBeVisible();
    });
  });
});