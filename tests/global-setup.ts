import { chromium, FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';

// Global test user credentials
export const TEST_USER = {
  email: 'test-e2e@stallplass.no',
  password: 'test-password-123',
  name: 'E2E Test User'
};

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Ensure auth directory exists
  const authDir = './tests/.auth';
  if (!existsSync(authDir)) {
    mkdirSync(authDir, { recursive: true });
  }

  // Clean up any existing test user
  try {
    console.log('🧹 Cleaning up existing test user...');
    execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "DELETE FROM auth.users WHERE email = '${TEST_USER.email}'; DELETE FROM public.users WHERE email = '${TEST_USER.email}';" > /dev/null 2>&1`);
  } catch (error) {
    console.log('⚠️ Initial cleanup completed (user may not exist)');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Creating test user...');
    
    // Navigate to registration page
    await page.goto('http://localhost:3000/registrer');
    
    // Wait for form to load
    await page.waitForSelector('input[name="email"]', { state: 'visible', timeout: 10000 });
    
    // Fill out registration form
    await page.fill('input[name="name"]', TEST_USER.name);
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    
    // Submit registration
    const registerButton = page.locator('button[type="submit"]', { hasText: /registrer|opprett konto/i });
    await registerButton.click();
    
    console.log('🔄 Registration form submitted, waiting for response...');
    
    // Wait a bit and check current state
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('Current URL after registration:', currentUrl);
    
    // Check for any error messages first (but only non-empty ones)
    const errorElements = page.locator('[class*="error"], [role="alert"], .text-red-500');
    const errorMessages = await errorElements.allTextContents();
    const nonEmptyErrors = errorMessages.filter(msg => msg.trim().length > 0);
    
    if (nonEmptyErrors.length > 0) {
      console.log('❌ Registration errors found:', nonEmptyErrors);
      throw new Error(`Registration failed: ${nonEmptyErrors.join(', ')}`);
    }
    
    // Try different success indicators
    try {
      await Promise.race([
        page.waitForURL('/stall', { timeout: 10000 }),
        page.waitForSelector('text=Registrering vellykket', { timeout: 10000 }),
        page.waitForSelector('text=Konto opprettet', { timeout: 10000 }),
        page.waitForSelector('text=Bekreft e-post', { timeout: 10000 }),
        page.waitForSelector('text=Velkommen', { timeout: 10000 })
      ]);
      console.log('✅ Registration success indicator found');
    } catch (error) {
      console.log('⚠️ No clear success indicator, checking final URL:', page.url());
      
      // If we're at stall page or got redirected elsewhere, that's probably success
      if (page.url().includes('/stall') || page.url() !== 'http://localhost:3000/registrer') {
        console.log('✅ Registration appears successful based on URL change');
      } else {
        throw new Error('Registration appears to have failed - still on registration page');
      }
    }
    
    // Save the authenticated state for all tests to use
    await page.context().storageState({ path: './tests/.auth/user.json' });
    
    console.log('✅ Global setup completed - test user created and authenticated');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;