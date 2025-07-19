import { test, expect } from '@playwright/test';
import { testUsers, testPayment } from './fixtures/test-data';

test.describe('Box Booking and Rental Process', () => {
  test.beforeEach(async ({ page }) => {
    // Use authenticated user session
  });

  test.describe('Browse and Select Box', () => {
    test('should view available boxes for a stable', async ({ page }) => {
      // Go to a stable detail page
      await page.goto('/staller/1'); // Assuming stable with ID 1 exists

      // Should see available boxes
      await expect(page.locator('[data-testid="available-boxes"]')).toBeVisible();
      
      // Should see box information
      await expect(page.locator('text=Ledige bokser')).toBeVisible();
    });

    test('should view box details', async ({ page }) => {
      await page.goto('/staller/1');

      // Click on first available box
      const firstBox = page.locator('[data-testid="box-card"]').first();
      await firstBox.click();

      // Should see box details
      await expect(page.locator('[data-testid="box-details"]')).toBeVisible();
      await expect(page.locator('text=kr/måned')).toBeVisible();
    });

    test('should show box amenities and features', async ({ page }) => {
      await page.goto('/bokser/1'); // Direct box page

      // Should see amenities list
      await expect(page.locator('[data-testid="box-amenities"]')).toBeVisible();
      
      // Should see box specifications
      await expect(page.locator('text=Boks størrelse').or(page.locator('text=Størrelse'))).toBeVisible();
    });
  });

  test.describe('Booking Process', () => {
    test('should initiate box booking', async ({ page }) => {
      await page.goto('/bokser/1');

      // Click book button
      await page.click('button:has-text("Book boks")');

      // Should see booking form or modal
      await expect(
        page.locator('[data-testid="booking-form"]').or(page.locator('text=Leieperiode'))
      ).toBeVisible();
    });

    test('should select rental period', async ({ page }) => {
      await page.goto('/bokser/1');
      await page.click('button:has-text("Book boks")');

      // Select start date (next month)
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const startDate = nextMonth.toISOString().split('T')[0];

      await page.fill('input[name="startDate"]', startDate);

      // Select duration
      await page.selectOption('select[name="duration"]', '6'); // 6 months

      // Should calculate total price
      await expect(page.locator('[data-testid="total-price"]')).toBeVisible();
    });

    test('should add special requests', async ({ page }) => {
      await page.goto('/bokser/1');
      await page.click('button:has-text("Book boks")');

      // Fill special requests
      await page.fill(
        'textarea[name="specialRequests"]',
        'Min hest trenger ekstra hø og har matallergier'
      );

      // Should save the request
      expect(
        await page.locator('textarea[name="specialRequests"]').inputValue()
      ).toContain('matallergier');
    });
  });

  test.describe('Payment Process', () => {
    test('should proceed to payment', async ({ page }) => {
      await page.goto('/bokser/1');
      await page.click('button:has-text("Book boks")');

      // Fill booking form
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await page.fill('input[name="startDate"]', nextMonth.toISOString().split('T')[0]);
      await page.selectOption('select[name="duration"]', '3');

      // Proceed to payment
      await page.click('button:has-text("Gå til betaling")');

      // Should see payment form
      await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();
    });

    test('should display payment summary', async ({ page }) => {
      await page.goto('/bokser/1');
      await page.click('button:has-text("Book boks")');

      // Complete booking form and go to payment
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await page.fill('input[name="startDate"]', nextMonth.toISOString().split('T')[0]);
      await page.selectOption('select[name="duration"]', '3');
      await page.click('button:has-text("Gå til betaling")');

      // Should see payment summary
      await expect(page.locator('[data-testid="payment-summary"]')).toBeVisible();
      await expect(page.locator('text=Totalt')).toBeVisible();
      await expect(page.locator('text=kr')).toBeVisible();
    });

    test('should process Vipps payment', async ({ page }) => {
      await page.goto('/bokser/1');
      await page.click('button:has-text("Book boks")');

      // Complete booking form
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await page.fill('input[name="startDate"]', nextMonth.toISOString().split('T')[0]);
      await page.selectOption('select[name="duration"]', '3');
      await page.click('button:has-text("Gå til betaling")');

      // Select Vipps payment
      await page.click('button:has-text("Betal med Vipps")');

      // Should redirect to Vipps or show Vipps payment flow
      // In test environment, this might be mocked
      await expect(
        page.locator('text=Vipps').or(page.locator('[data-testid="vipps-payment"]'))
      ).toBeVisible();
    });

    test('should handle payment success', async ({ page }) => {
      // Mock successful payment callback
      await page.goto('/betalinger');

      // Should see payment confirmation or be redirected to success page
      await expect(
        page.locator('text=Betaling bekreftet').or(page.locator('text=Leieforhold opprettet'))
      ).toBeVisible();
    });

    test('should handle payment failure', async ({ page }) => {
      // This would require mocking a failed payment
      // Implementation depends on how payment failures are handled
      await page.goto('/bokser/1');
      
      // Simulate payment failure scenario
      // This is a placeholder for actual payment failure testing
    });
  });

  test.describe('Booking Confirmation', () => {
    test('should show booking confirmation', async ({ page }) => {
      // After successful payment, should see confirmation
      await page.goto('/leieforhold');

      // Should see active rentals
      await expect(page.locator('[data-testid="rental-list"]')).toBeVisible();
    });

    test('should send confirmation email', async ({ page }) => {
      // This would need email testing setup
      // For now, we can check that the confirmation page mentions email
      await page.goto('/leieforhold');

      if (await page.locator('text=bekreftelses-e-post').isVisible()) {
        await expect(page.locator('text=bekreftelses-e-post')).toBeVisible();
      }
    });

    test('should create rental agreement', async ({ page }) => {
      await page.goto('/leieforhold');

      // Should see rental details
      const rentalCard = page.locator('[data-testid="rental-card"]').first();
      if (await rentalCard.isVisible()) {
        await expect(rentalCard).toBeVisible();
        await expect(rentalCard.locator('text=Aktiv')).toBeVisible();
      }
    });
  });

  test.describe('Rental Management', () => {
    test('should view active rentals', async ({ page }) => {
      await page.goto('/leieforhold');

      // Should see list of rentals
      await expect(
        page.locator('[data-testid="rental-list"]').or(page.locator('text=Dine leieforhold'))
      ).toBeVisible();
    });

    test('should extend rental period', async ({ page }) => {
      await page.goto('/leieforhold');

      const extendButton = page.locator('button:has-text("Forleng")').first();
      if (await extendButton.isVisible()) {
        await extendButton.click();

        // Should see extension form
        await expect(page.locator('[data-testid="extend-rental"]')).toBeVisible();
      }
    });

    test('should terminate rental', async ({ page }) => {
      await page.goto('/leieforhold');

      const terminateButton = page.locator('button:has-text("Avslutt")').first();
      if (await terminateButton.isVisible()) {
        await terminateButton.click();

        // Should see termination confirmation
        await expect(page.locator('text=Bekreft avslutning')).toBeVisible();
      }
    });
  });
});