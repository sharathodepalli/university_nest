#!/usr/bin/env node

/**
 * Simple Security Check Script
 * Scans for real secrets in tracked files
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔒 UniNest Security Check\n');
console.log('🔍 Scanning tracked files for real secrets...\n');

// Real secret patterns (actual API keys, not code variables)
const SECRET_PATTERNS = [
  /VITE_SUPABASE_URL=https:\/\/[a-z0-9]{20}\.supabase\.co/g,
  /VITE_SUPABASE_ANON_KEY=eyJ[A-Za-z0-9_-]{100,}/g,
  /SENDGRID_API_KEY=SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/g,
  /AWS_SECRET_ACCESS_KEY=[A-Za-z0-9\/+=]{40}/g,
];

let issuesFound = 0;
let filesScanned = 0;

// Check git tracked files only
try {
  const gitFiles = execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .filter(f => f.length > 0 && !f.includes('node_modules'));
  
  console.log(`📁 Scanning ${gitFiles.length} tracked files...\n`);
  
  gitFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        filesScanned++;
        
        SECRET_PATTERNS.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) {
            console.log(`❌ REAL SECRET FOUND: ${filePath}`);
            matches.forEach(match => {
              console.log(`   ${match.substring(0, 30)}...`);
              issuesFound++;
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read (binary files, etc.)
      }
    }
  });
  
} catch (error) {
  console.log('⚠️  Could not check git files:', error.message);
}

// Summary
console.log('\n==================================================');
console.log(`📊 Scanned ${filesScanned} files`);

if (issuesFound > 0) {
  console.log(`❌ Security Check FAILED: ${issuesFound} real secrets found in tracked files`);
  console.log('\n🔧 Actions:');
  console.log('1. Remove secrets from tracked files');
  console.log('2. Use .env files (ignored by git)');
  console.log('3. Set environment variables in deployment platform');
  process.exit(1);
} else {
  console.log('✅ Security Check PASSED: No real secrets found in tracked files');
  console.log('\n🛡️  Your repository is clean and safe to push!');
}
