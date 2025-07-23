import { Page } from '@playwright/test';
import { testUsers } from './test-data';

export async function loginAsUser3(page: Page) {
  await page.goto('/logg-inn');
  await page.fill('input[type="email"]', testUsers.user3.email);
  await page.fill('input[type="password"]', testUsers.user3.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**', { waitUntil: 'networkidle' });
}

export async function loginAsUser4(page: Page) {
  await page.goto('/logg-inn');
  await page.fill('input[type="email"]', testUsers.user4.email);
  await page.fill('input[type="password"]', testUsers.user4.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**', { waitUntil: 'networkidle' });
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logg ut');
  await page.waitForURL('/');
}