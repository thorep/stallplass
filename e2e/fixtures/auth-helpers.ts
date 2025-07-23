import { Page } from '@playwright/test';
import { testUsers } from './test-data';

export async function loginAsUser1(page: Page) {
  await page.goto('/logg-inn');
  await page.fill('input[type="email"]', testUsers.user1.email);
  await page.fill('input[type="password"]', testUsers.user1.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**', { waitUntil: 'networkidle' });
}

export async function loginAsUser2(page: Page) {
  await page.goto('/logg-inn');
  await page.fill('input[type="email"]', testUsers.user2.email);
  await page.fill('input[type="password"]', testUsers.user2.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**', { waitUntil: 'networkidle' });
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logg ut');
  await page.waitForURL('/');
}