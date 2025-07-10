// Health check script for production monitoring
// Run with: node scripts/health-check.js

const https = require('https');
const fs = require('fs');

const config = {
  url: process.env.VITE_APP_URL || 'https://uninest.yourdomain.com',
  timeout: 10000,
  expectedTitle: 'UniNest',
  healthEndpoints: [
    '/',
    '/browse',
    '/login'
  ]
};

async function checkEndpoint(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, { timeout: config.timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          responseTime,
          size: data.length,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    }).on('error', (err) => {
      reject({
        url,
        error: err.message,
        success: false
      });
    }).on('timeout', () => {
      reject({
        url,
        error: 'Timeout',
        success: false
      });
    });
  });
}

async function runHealthCheck() {
  console.log('🏥 UniNest Production Health Check');
  console.log('=' .repeat(50));
  console.log(`Target: ${config.url}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  const results = [];
  
  for (const endpoint of config.healthEndpoints) {
    const fullUrl = `${config.url}${endpoint}`;
    
    try {
      console.log(`Checking ${fullUrl}...`);
      const result = await checkEndpoint(fullUrl);
      results.push(result);
      
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.status} - ${result.responseTime}ms - ${result.size} bytes`);
      
    } catch (error) {
      results.push(error);
      console.log(`❌ ${error.error}`);
    }
  }
  
  console.log('');
  console.log('📊 Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const avgResponseTime = results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / successful || 0;
  
  console.log(`Status: ${successful}/${total} endpoints healthy`);
  console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
  
  if (successful === total) {
    console.log('🎉 All systems operational!');
    process.exit(0);
  } else {
    console.log('🚨 Some endpoints are unhealthy');
    process.exit(1);
  }
}

// Save results to file if requested
if (process.argv.includes('--save')) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `health-check-${timestamp}.json`;
  
  runHealthCheck().then(() => {
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${filename}`);
  });
} else {
  runHealthCheck();
}
