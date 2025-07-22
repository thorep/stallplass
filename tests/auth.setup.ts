import { test as setup, expect } from '@playwright/test';

const authFile = './tests/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/logg-inn');

  // TODO: Add authentication logic here
  // For now, we'll skip auth and rely on test data
  // In a real scenario, you'd authenticate with a test user
  
  // Save signed-in state to auth file
  await page.context().storageState({ path: authFile });
});