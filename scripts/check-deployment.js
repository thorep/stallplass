#!/usr/bin/env node
/**
 * Check if migrations are properly configured for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Vercel deployment configuration...\n');

// Check if vercel.json exists
const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  console.log('✅ vercel.json found');
  console.log('📋 Build command:', vercelConfig.buildCommand);
  console.log('📋 Install command:', vercelConfig.installCommand);
  
  if (vercelConfig.buildCommand && vercelConfig.buildCommand.includes('prisma migrate deploy')) {
    console.log('✅ Migrations are configured to run during deployment');
  } else {
    console.log('⚠️  Migrations are NOT configured to run during deployment');
  }
} else {
  console.log('⚠️  No vercel.json found');
}

// Check if migration files exist
const migrationsPath = path.join(process.cwd(), 'prisma', 'migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath).filter(file => 
    fs.statSync(path.join(migrationsPath, file)).isDirectory()
  );
  
  console.log(`✅ Found ${migrations.length} migration(s):`);
  migrations.forEach(migration => {
    console.log(`   - ${migration}`);
  });
} else {
  console.log('⚠️  No migrations directory found');
}

// Check package.json scripts
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('\n📋 Available database scripts:');
  Object.entries(packageJson.scripts).forEach(([script, command]) => {
    if (script.startsWith('db:')) {
      console.log(`   ${script}: ${command}`);
    }
  });
}

console.log('\n🚀 Deployment will run: npx prisma migrate deploy');
console.log('📖 Check build logs in Vercel dashboard to verify migration success');