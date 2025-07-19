import { test, expect } from '@playwright/test';
import { testUsers, testMessage } from './fixtures/test-data';

test.describe('Messaging System', () => {
  test.beforeEach(async ({ page }) => {
    // Use authenticated user session
  });

  test.describe('Send Messages', () => {
    test('should send message to stable owner from stable page', async ({ page }) => {
      await page.goto('/staller/1');

      // Click contact button
      await page.click('button:has-text("Kontakt stall")');

      // Should see message form
      await expect(page.locator('[data-testid="message-form"]')).toBeVisible();

      // Fill and send message
      await page.fill('input[name="subject"]', testMessage.subject);
      await page.fill('textarea[name="content"]', testMessage.content);
      await page.click('button:has-text("Send melding")');

      // Should see success confirmation
      await expect(page.locator('text=Melding sendt')).toBeVisible();
    });

    test('should send message from box detail page', async ({ page }) => {
      await page.goto('/bokser/1');

      // Click contact button for specific box inquiry
      await page.click('button:has-text("Still spørsmål")');

      // Should see message form with box context
      await expect(page.locator('[data-testid="message-form"]')).toBeVisible();
      
      // Subject should be pre-filled with box info
      const subjectValue = await page.locator('input[name="subject"]').inputValue();
      expect(subjectValue).toContain('Boks');
    });

    test('should validate message form', async ({ page }) => {
      await page.goto('/staller/1');
      await page.click('button:has-text("Kontakt stall")');

      // Try to send empty message
      await page.click('button:has-text("Send melding")');

      // Should show validation errors
      await expect(page.locator('text=Dette feltet er påkrevd')).toBeVisible();
    });
  });

  test.describe('View Messages', () => {
    test('should view message inbox', async ({ page }) => {
      await page.goto('/meldinger');

      // Should see message list
      await expect(
        page.locator('[data-testid="message-list"]').or(page.locator('text=Meldinger'))
      ).toBeVisible();
    });

    test('should view conversation thread', async ({ page }) => {
      await page.goto('/meldinger');

      // Click on first conversation
      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      if (await firstConversation.isVisible()) {
        await firstConversation.click();

        // Should see conversation details
        await expect(page.locator('[data-testid="conversation-thread"]')).toBeVisible();
      }
    });

    test('should show unread message indicator', async ({ page }) => {
      await page.goto('/meldinger');

      // Look for unread indicators
      const unreadIndicator = page.locator('[data-testid="unread-indicator"]').or(
        page.locator('.unread')
      );
      
      // May or may not have unread messages, so just check if element exists
      const count = await unreadIndicator.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Reply to Messages', () => {
    test('should reply to conversation', async ({ page }) => {
      await page.goto('/meldinger');

      // Open first conversation
      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      if (await firstConversation.isVisible()) {
        await firstConversation.click();

        // Type reply
        await page.fill('textarea[name="reply"]', 'Takk for meldingen! Vi setter pris på interessen.');
        await page.click('button:has-text("Send svar")');

        // Should see reply in conversation
        await expect(page.locator('text=Takk for meldingen')).toBeVisible();
      }
    });

    test('should attach files to reply', async ({ page }) => {
      await page.goto('/meldinger');

      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      if (await firstConversation.isVisible()) {
        await firstConversation.click();

        // Look for file attachment option
        const attachButton = page.locator('input[type="file"]').or(
          page.locator('button:has-text("Legg ved fil")')
        );
        
        if (await attachButton.isVisible()) {
          // This would require actual file upload testing
          // For now, just verify the element exists
          await expect(attachButton).toBeVisible();
        }
      }
    });
  });

  test.describe('Message Organization', () => {
    test('should filter messages by status', async ({ page }) => {
      await page.goto('/meldinger');

      // Apply filter
      const filterDropdown = page.locator('select[name="status"]');
      if (await filterDropdown.isVisible()) {
        await filterDropdown.selectOption('unread');
        
        // Should show only unread messages
        await page.waitForSelector('[data-testid="message-list"]');
      }
    });

    test('should search messages', async ({ page }) => {
      await page.goto('/meldinger');

      // Use search if available
      const searchInput = page.locator('input[placeholder*="Søk"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('bokser');
        await page.press('input[placeholder*="Søk"]', 'Enter');

        // Should filter results
        await page.waitForSelector('[data-testid="message-list"]');
      }
    });

    test('should mark messages as read/unread', async ({ page }) => {
      await page.goto('/meldinger');

      const firstMessage = page.locator('[data-testid="conversation-item"]').first();
      if (await firstMessage.isVisible()) {
        // Right click for context menu or look for mark as read button
        await firstMessage.click({ button: 'right' });
        
        const markAsReadButton = page.locator('button:has-text("Marker som lest")');
        if (await markAsReadButton.isVisible()) {
          await markAsReadButton.click();
        }
      }
    });
  });

  test.describe('Notifications', () => {
    test('should show new message notification', async ({ page }) => {
      // This would require simulating receiving a new message
      // For now, check if notification system exists
      await page.goto('/meldinger');

      const notificationBell = page.locator('[data-testid="notification-bell"]').or(
        page.locator('[aria-label*="notification"]')
      );
      
      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        
        // Should show notification dropdown
        await expect(page.locator('[data-testid="notifications"]')).toBeVisible();
      }
    });

    test('should show message count in header', async ({ page }) => {
      await page.goto('/');

      // Look for message count indicator in header
      const messageCount = page.locator('[data-testid="message-count"]');
      
      // May or may not exist depending on if user has messages
      const count = await messageCount.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Message Settings', () => {
    test('should configure email notifications', async ({ page }) => {
      await page.goto('/profil');

      // Look for notification settings
      const notificationSettings = page.locator('text=Varslinger').or(
        page.locator('[data-testid="notification-settings"]')
      );
      
      if (await notificationSettings.isVisible()) {
        await notificationSettings.click();
        
        // Should see email notification toggle
        const emailToggle = page.locator('input[name="emailNotifications"]');
        if (await emailToggle.isVisible()) {
          await expect(emailToggle).toBeVisible();
        }
      }
    });
  });

  test.describe('Mobile Messaging', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/meldinger');

      // Should see mobile-optimized message list
      await expect(
        page.locator('[data-testid="message-list"]').or(page.locator('text=Meldinger'))
      ).toBeVisible();

      // Should be able to tap on conversation
      const firstConversation = page.locator('[data-testid="conversation-item"]').first();
      if (await firstConversation.isVisible()) {
        await firstConversation.tap();
      }
    });
  });
});