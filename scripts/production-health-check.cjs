#!/usr/bin/env node

/**
 * Comprehensive Production Health Check Script
 * Verifies that all critical systems are working correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  REQUIRED_ENV_VARS: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ],
  REQUIRED_FILES: [
    'dist/index.html',
    'dist/assets',
    'dist/manifest.webmanifest'
  ],
  TIMEOUT: 10000 // 10 seconds
};

let healthStatus = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

// Utility functions
const log = (message, type = 'info') => {
  const colors = {
    info: '\x1b[34m',    // Blue
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    reset: '\x1b[0m'     // Reset
  };
  
  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${icon[type]} ${message}${colors.reset}`);
};

const checkPassed = (message) => {
  healthStatus.passed++;
  healthStatus.details.push({ type: 'success', message });
  log(message, 'success');
};

const checkFailed = (message) => {
  healthStatus.failed++;
  healthStatus.details.push({ type: 'error', message });
  log(message, 'error');
};

const checkWarning = (message) => {
  healthStatus.warnings++;
  healthStatus.details.push({ type: 'warning', message });
  log(message, 'warning');
};

// Health check functions
function checkEnvironmentVariables() {
  log('🔍 Checking environment variables...', 'info');
  
  try {
    // Check if .env file exists
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      checkWarning('.env file not found - using system environment variables');
    }
    
    for (const envVar of CONFIG.REQUIRED_ENV_VARS) {
      const value = process.env[envVar] || 
                   (envContent.match(new RegExp(`${envVar}=(.+)`))?.[1]);
      
      if (!value) {
        checkFailed(`Environment variable ${envVar} is not set`);
      } else if (value.includes('your-') || value.includes('placeholder')) {
        checkFailed(`Environment variable ${envVar} contains placeholder value`);
      } else {
        checkPassed(`Environment variable ${envVar} is set`);
      }
    }
  } catch (error) {
    checkFailed(`Error checking environment variables: ${error.message}`);
  }
}

function checkBuildFiles() {
  log('🔍 Checking build files...', 'info');
  
  for (const file of CONFIG.REQUIRED_FILES) {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        checkPassed(`Build directory ${file} exists`);
      } else {
        const sizeKB = Math.round(stats.size / 1024);
        checkPassed(`Build file ${file} exists (${sizeKB}KB)`);
      }
    } else {
      checkFailed(`Build file/directory ${file} is missing`);
    }
  }
}

function checkDependencyVulnerabilities() {
  log('🔍 Checking for security vulnerabilities...', 'info');
  
  try {
    const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(auditResult);
    
    if (audit.vulnerabilities) {
      const vulnCount = Object.keys(audit.vulnerabilities).length;
      if (vulnCount === 0) {
        checkPassed('No security vulnerabilities found');
      } else {
        const highVulns = Object.values(audit.vulnerabilities)
          .filter(v => v.severity === 'high' || v.severity === 'critical').length;
        
        if (highVulns > 0) {
          checkFailed(`${highVulns} high/critical security vulnerabilities found`);
        } else {
          checkWarning(`${vulnCount} low/moderate security vulnerabilities found`);
        }
      }
    }
  } catch (error) {
    checkWarning('Unable to check security vulnerabilities - npm audit failed');
  }
}

function checkPackageJson() {
  log('🔍 Checking package.json configuration...', 'info');
  
  try {
    const packagePath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'build:prod', 'lint', 'type-check'];
    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        checkPassed(`Script "${script}" is defined`);
      } else {
        checkFailed(`Required script "${script}" is missing`);
      }
    }
    
    // Check version
    if (packageJson.version) {
      checkPassed(`Package version: ${packageJson.version}`);
    } else {
      checkWarning('Package version not set');
    }
    
    // Check dependencies
    if (packageJson.dependencies) {
      const depCount = Object.keys(packageJson.dependencies).length;
      checkPassed(`${depCount} runtime dependencies`);
    }
    
    if (packageJson.devDependencies) {
      const devDepCount = Object.keys(packageJson.devDependencies).length;
      checkPassed(`${devDepCount} development dependencies`);
    }
    
  } catch (error) {
    checkFailed(`Error checking package.json: ${error.message}`);
  }
}

function checkTypeScript() {
  log('🔍 Checking TypeScript configuration...', 'info');
  
  try {
    execSync('npm run type-check', { stdio: 'pipe' });
    checkPassed('TypeScript type checking passed');
  } catch (error) {
    checkFailed('TypeScript type checking failed');
  }
}

function checkLinting() {
  log('🔍 Checking code linting...', 'info');
  
  try {
    execSync('npm run lint', { stdio: 'pipe' });
    checkPassed('ESLint checks passed');
  } catch (error) {
    checkWarning('ESLint found issues - check with `npm run lint`');
  }
}

// Main health check function
async function runHealthCheck() {
  console.log('\n🏥 UniNest Production Health Check\n');
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  // Run all health checks
  checkEnvironmentVariables();
  checkBuildFiles();
  checkPackageJson();
  checkDependencyVulnerabilities();
  checkTypeScript();
  checkLinting();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Health Check Summary');
  console.log('='.repeat(50));
  
  log(`✅ Passed: ${healthStatus.passed}`, 'success');
  if (healthStatus.warnings > 0) {
    log(`⚠️  Warnings: ${healthStatus.warnings}`, 'warning');
  }
  if (healthStatus.failed > 0) {
    log(`❌ Failed: ${healthStatus.failed}`, 'error');
  }
  
  console.log(`⏱️  Duration: ${duration}ms`);
  
  // Production readiness assessment
  console.log('\n🎯 Production Readiness Assessment:');
  
  if (healthStatus.failed === 0) {
    if (healthStatus.warnings === 0) {
      log('🚀 EXCELLENT! Ready for production deployment', 'success');
    } else {
      log('✅ GOOD! Ready for production with minor warnings', 'success');
    }
  } else {
    log('🛑 NOT READY! Fix critical issues before deployment', 'error');
  }
  
  // Exit with appropriate code
  process.exit(healthStatus.failed > 0 ? 1 : 0);
}

// Run the health check
runHealthCheck().catch(error => {
  log(`Fatal error during health check: ${error.message}`, 'error');
  process.exit(1);
});
