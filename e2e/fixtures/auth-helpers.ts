import { Page } from '@playwright/test';
import { testUsers } from './test-data';

export async function loginAsStableOwner(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', testUsers.stableOwner.email);
  await page.fill('input[type="password"]', testUsers.stableOwner.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/stall');
}

export async function loginAsRider(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', testUsers.horseRider.email);
  await page.fill('input[type="password"]', testUsers.horseRider.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/staller');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logg ut');
  await page.waitForURL('/');
}