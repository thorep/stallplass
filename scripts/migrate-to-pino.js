#!/usr/bin/env node

/**
 * Migration utility to help replace console.log statements with Pino logger
 * This is a reference script - review changes carefully before applying
 */

const fs = require('fs');
const path = require('path');

// Files to process (you can modify this list)
const srcDirs = ['src/app/api', 'src/services', 'src/hooks'];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let modified = content;
  let hasChanges = false;

  // Skip if already has logger import
  if (content.includes('from \'@/lib/logger\'')) {
    console.log(`Skipping ${filePath} - already has logger import`);
    return;
  }

  // Add logger import if console statements found
  if (content.includes('console.')) {
    // Add import after existing imports
    const importMatch = content.match(/(import.*?;[\s\S]*?)(?=\n\n|\nexport|\nconst|\nfunction|\nclass)/);
    if (importMatch) {
      modified = content.replace(
        importMatch[0],
        importMatch[0] + '\nimport { logger } from \'@/lib/logger\';'
      );
      hasChanges = true;
    }
  }

  // Replace console.log patterns
  const replacements = [
    // console.log with object
    {
      pattern: /console\.log\('([^']+):', ([^)]+)\);/g,
      replacement: 'logger.info({ data: $2 }, \'$1\');'
    },
    // console.log with simple message
    {
      pattern: /console\.log\('([^']+)'\);/g,
      replacement: 'logger.info(\'$1\');'
    },
    // console.error with message and error
    {
      pattern: /console\.error\('([^']+):', ([^)]+)\);/g,
      replacement: 'logger.error({ error: $2 }, \'$1\');'
    },
    // console.error with simple message
    {
      pattern: /console\.error\('([^']+)'\);/g,
      replacement: 'logger.error(\'$1\');'
    },
    // console.warn
    {
      pattern: /console\.warn\('([^']+)'\);/g,
      replacement: 'logger.warn(\'$1\');'
    }
  ];

  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(modified)) {
      modified = modified.replace(pattern, replacement);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    console.log(`\nProposed changes for ${filePath}:`);
    console.log('This is a reference - review and apply manually\n');
    
    // Show diff-like output
    const originalLines = content.split('\n');
    const modifiedLines = modified.split('\n');
    
    for (let i = 0; i < Math.max(originalLines.length, modifiedLines.length); i++) {
      const original = originalLines[i] || '';
      const mod = modifiedLines[i] || '';
      
      if (original !== mod) {
        if (original) console.log(`- ${original}`);
        if (mod) console.log(`+ ${mod}`);
      }
    }
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dirPath} does not exist, skipping...`);
    return;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      processFile(fullPath);
    }
  });
}

console.log('Pino Migration Helper - Scanning for console.* statements...\n');
console.log('Note: This tool shows proposed changes. Review and apply manually.\n');

srcDirs.forEach(dir => {
  console.log(`Scanning ${dir}...`);
  scanDirectory(dir);
});

console.log('Migration scan complete!');
console.log('\nNext steps:');
console.log('1. Review the proposed changes above');
console.log('2. Manually update files to use structured logging');
console.log('3. Test that logging works as expected');
console.log('4. Remove this script when migration is complete');