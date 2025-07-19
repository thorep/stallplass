import { test, expect } from '@playwright/test';
import { AdminPage } from './pages/admin-page';
import { testUsers } from './fixtures/test-data';

test.describe('Admin Dashboard', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // Ensure we have admin authentication
    const adminPage = new AdminPage(page);
    await adminPage.goto();
  });

  test.describe('Dashboard Overview', () => {
    test('should display admin dashboard with stats', async ({ page }) => {
      const adminPage = new AdminPage(page);

      // Should see dashboard stats
      const stats = await adminPage.getDashboardStats();
      expect(stats.length).toBeGreaterThan(0);

      // Should see navigation tabs
      await expect(adminPage.stablesTab).toBeVisible();
      await expect(adminPage.usersTab).toBeVisible();
      await expect(adminPage.paymentsTab).toBeVisible();
      await expect(adminPage.pricingTab).toBeVisible();
    });

    test('should navigate between admin sections', async ({ page }) => {
      const adminPage = new AdminPage(page);

      // Test navigation to each section
      await adminPage.switchToStablesManagement();
      await adminPage.switchToUsersManagement();
      await adminPage.switchToPaymentsManagement();
      await adminPage.switchToPricingManagement();
    });
  });

  test.describe('Stables Management', () => {
    test('should approve a pending stable', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToStablesManagement();

      // Look for a pending stable and approve it
      const pendingStable = page.locator('tr:has(td:has-text("Venter"))').first();
      
      if (await pendingStable.isVisible()) {
        const stableName = await pendingStable.locator('td').first().textContent();
        await adminPage.approveStable(stableName || 'Test Stable');
      }
    });

    test('should reject a pending stable with reason', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToStablesManagement();

      // Look for a pending stable and reject it
      const pendingStable = page.locator('tr:has(td:has-text("Venter"))').first();
      
      if (await pendingStable.isVisible()) {
        const stableName = await pendingStable.locator('td').first().textContent();
        await adminPage.rejectStable(
          stableName || 'Test Stable',
          'Manglende informasjon om fasiliteter'
        );
      }
    });

    test('should view stable details', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToStablesManagement();

      // Click on first stable's view button
      const viewButton = page.locator('button:has-text("Se detaljer")').first();
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
        
        // Should see stable details modal or page
        await expect(
          page.locator('[data-testid="stable-details"]').or(page.locator('h2'))
        ).toBeVisible();
      }
    });
  });

  test.describe('Users Management', () => {
    test('should search for users', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.searchUser(testUsers.regularUser.email);

      // Should see search results
      await expect(
        page.locator(`tr:has-text("${testUsers.regularUser.email}")`)
      ).toBeVisible();
    });

    test('should make user admin', async ({ page }) => {
      const adminPage = new AdminPage(page);
      
      // Create a test user first or use existing
      await adminPage.makeUserAdmin(testUsers.regularUser.email);
    });

    test('should view user details', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.searchUser(testUsers.regularUser.email);

      const userRow = page.locator(`tr:has-text("${testUsers.regularUser.email}")`);
      await userRow.locator('button:has-text("Detaljer")').click();

      // Should see user details modal
      await expect(
        page.locator('[data-testid="user-details"]').or(page.locator('text=Brukerdetaljer'))
      ).toBeVisible();
    });
  });

  test.describe('Payments Management', () => {
    test('should view payments list', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToPaymentsManagement();

      // Should see payments table
      await expect(
        page.locator('[data-testid="payments-table"]').or(page.locator('table'))
      ).toBeVisible();
    });

    test('should view payment details', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToPaymentsManagement();

      // Click on first payment if available
      const firstPayment = page.locator('tr').nth(1);
      if (await firstPayment.isVisible()) {
        const paymentId = await firstPayment.locator('td').first().textContent();
        if (paymentId) {
          await adminPage.viewPaymentDetails(paymentId);
        }
      }
    });

    test('should filter payments by status', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToPaymentsManagement();

      // Apply filter
      await page.selectOption('select[name="status"]', 'completed');
      await page.click('button:has-text("Filtrer")');

      // Should show filtered results
      await expect(page.locator('table')).toBeVisible();
    });
  });

  test.describe('Pricing Management', () => {
    test('should update base price', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.updateBasePrice(5000);

      // Should see updated price
      await expect(page.locator('text=5000')).toBeVisible();
    });

    test('should add new discount', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.addDiscount(6, 15);

      // Should see new discount in list
      await expect(
        page.locator('text=6 måneder').and(page.locator('text=15%'))
      ).toBeVisible();
    });

    test('should update sponsored placement price', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToPricingManagement();

      // Find sponsored placement section and update
      await page.locator('button:has-text("Rediger")').nth(1).click();
      await page.locator('input[type="number"]').nth(1).fill('3');
      await page.locator('button:has-text("Lagre")').click();

      await adminPage.waitForToast('Pris oppdatert');
    });
  });

  test.describe('Analytics and Reports', () => {
    test('should view user growth stats', async ({ page }) => {
      const adminPage = new AdminPage(page);

      // Should see stats cards
      const stats = await adminPage.getDashboardStats();
      expect(stats.length).toBeGreaterThan(0);

      // Should contain relevant metrics
      const statsText = stats.join(' ');
      expect(statsText).toMatch(/\d+/); // Should contain numbers
    });

    test('should export user data', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.switchToUsersManagement();

      // Look for export button
      const exportButton = page.locator('button:has-text("Eksporter")');
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Should trigger download or show export options
        await expect(
          page.locator('text=Eksport startet').or(page.locator('[data-testid="export-modal"]'))
        ).toBeVisible();
      }
    });
  });

  test.describe('Security and Permissions', () => {
    test('should only allow admin users access', async ({ page }) => {
      // This is tested in auth.spec.ts but we can add more specific checks here
      
      // Should see admin-only UI elements
      await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    });

    test('should log admin actions', async ({ page }) => {
      const adminPage = new AdminPage(page);
      
      // Perform an admin action
      await adminPage.switchToPricingManagement();
      await adminPage.updateBasePrice(4800);

      // Check if action is logged (if you have activity log)
      if (await page.locator('[data-testid="activity-log"]').isVisible()) {
        await expect(
          page.locator('text=Pris oppdatert').or(page.locator('text=Base price updated'))
        ).toBeVisible();
      }
    });
  });
});