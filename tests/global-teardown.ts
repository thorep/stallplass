import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { TEST_USER } from './global-setup';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Clean up test user and any test stables
    console.log('🗑️ Cleaning up test data...');
    
    execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
      DELETE FROM stables WHERE name LIKE 'E2E Test Stable%';
      DELETE FROM auth.users WHERE email = '${TEST_USER.email}';
      DELETE FROM public.users WHERE email = '${TEST_USER.email}';
    " > /dev/null 2>&1`);
    
    console.log('✅ Global teardown completed - test data cleaned up');
  } catch (error) {
    console.log('⚠️ Global teardown had issues (this is ok):', error);
  }
}

export default globalTeardown;