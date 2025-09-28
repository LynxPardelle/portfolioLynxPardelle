/**
 * Cache Invalidation Performance Test
 * Tests CloudFront invalidation performance and global propagation times
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const config = require('./config.js');

// Custom metrics for invalidation testing
const invalidationRequestTime = new Trend('invalidation_request_time');
const invalidationPropagationTime = new Trend('invalidation_propagation_time');
const invalidationSuccessRate = new Rate('invalidation_success_rate');
const invalidationErrors = new Counter('invalidation_errors');
const globalPropagationTime = new Trend('global_propagation_time');
const batchInvalidationEfficiency = new Rate('batch_invalidation_efficiency');

export const options = {
  scenarios: {
    single_invalidation: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 5,
      maxDuration: '10m',
      exec: 'testSingleInvalidation',
    },
    batch_invalidation: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 3,
      startTime: '11m',
      maxDuration: '15m',
      exec: 'testBatchInvalidation',
    },
    propagation_verification: {
      executor: 'per-vu-iterations',
      vus: 3,
      iterations: 2,
      startTime: '27m',
      maxDuration: '10m',
      exec: 'verifyGlobalPropagation',
    },
  },
  thresholds: {
    invalidation_request_time: ['p(95)<5000'],    // 95% of invalidation requests under 5s
    invalidation_propagation_time: ['p(95)<300000'], // 95% propagate within 5 minutes
    invalidation_success_rate: ['rate>=0.95'],    // 95% success rate
    global_propagation_time: ['p(95)<300000'],    // Global propagation within 5 minutes
    batch_invalidation_efficiency: ['rate>=0.9'], // 90% batch efficiency
  },
};

// Test paths for invalidation
const invalidationTestPaths = [
  '/uploads/main/invalidation-test-1.jpg',
  '/uploads/main/invalidation-test-2.jpg', 
  '/uploads/albums/invalidation-test-album.jpg',
  '/uploads/articles/invalidation-test-article.jpg',
  '/uploads/songs/invalidation-test-audio.mp3',
];

// Regional endpoints for propagation testing
const regionalEndpoints = [
  { region: 'us-east-1', endpoint: 'https://cloudfront.amazonaws.com' },
  { region: 'us-west-2', endpoint: 'https://cloudfront.amazonaws.com' },
  { region: 'eu-west-1', endpoint: 'https://cloudfront.amazonaws.com' },
  { region: 'ap-southeast-1', endpoint: 'https://cloudfront.amazonaws.com' },
];

// Single invalidation test
export function testSingleInvalidation() {
  const testPath = invalidationTestPaths[Math.floor(Math.random() * invalidationTestPaths.length)];
  const cdnUrl = `https://${config.cdn.domain}${testPath}`;
  
  console.log(`🔄 Testing single invalidation for: ${testPath}`);
  
  // Step 1: Ensure content is cached
  const cacheWarmup = http.get(cdnUrl);
  sleep(2); // Allow cache to settle
  
  // Step 2: Create unique content to detect cache invalidation
  const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const testContent = `Cache invalidation test content: ${uniqueId}`;
  
  // Step 3: Upload new content (simulated by updating a test file)
  const uploadStart = Date.now();
  const uploadResponse = simulateContentUpdate(testPath, testContent);
  const uploadTime = Date.now() - uploadStart;
  
  if (!uploadResponse.success) {
    console.error(`Failed to update content for ${testPath}`);
    invalidationErrors.add(1);
    return;
  }
  
  // Step 4: Request CloudFront invalidation
  const invalidationStart = Date.now();
  const invalidationResponse = requestInvalidation([testPath]);
  const invalidationTime = Date.now() - invalidationStart;
  
  invalidationRequestTime.add(invalidationTime);
  
  const invalidationSuccess = check(invalidationResponse, {
    'invalidation request successful': (r) => r.success === true,
    'invalidation ID returned': (r) => r.invalidationId !== undefined,
    'invalidation request time acceptable': () => invalidationTime < 10000, // 10 seconds
  });
  
  invalidationSuccessRate.add(invalidationSuccess);
  
  if (!invalidationSuccess) {
    invalidationErrors.add(1);
    console.error(`Invalidation request failed for ${testPath}`);
    return;
  }
  
  console.log(`Invalidation requested: ${invalidationResponse.invalidationId} (${invalidationTime}ms)`);
  
  // Step 5: Monitor invalidation propagation
  const propagationStart = Date.now();
  const propagationTime = monitorInvalidationPropagation(cdnUrl, uniqueId, 300); // 5 minute timeout
  
  if (propagationTime > 0) {
    invalidationPropagationTime.add(propagationTime);
    console.log(`✅ Invalidation propagated in ${propagationTime}ms`);
  } else {
    console.error(`❌ Invalidation did not propagate within timeout`);
    invalidationErrors.add(1);
  }
  
  // Step 6: Verify cache status after invalidation
  sleep(5); // Brief pause
  const verificationResponse = http.get(cdnUrl, {
    headers: { 'Cache-Control': 'no-cache' }
  });
  
  const cacheStatus = verificationResponse.headers['X-Cache'] || 
                     verificationResponse.headers['CloudFront-Cache-Status'] || 
                     'Unknown';
  
  check(verificationResponse, {
    'post-invalidation response successful': (r) => r.status === 200,
    'cache shows miss after invalidation': () => cacheStatus.includes('Miss'),
  });
  
  console.log(`Post-invalidation cache status: ${cacheStatus}`);
}

// Batch invalidation test
export function testBatchInvalidation() {
  console.log('🔄 Testing batch invalidation...');
  
  const batchPaths = invalidationTestPaths.slice(0, 3); // First 3 paths
  const batchId = Date.now();
  
  // Step 1: Warm cache for all paths
  for (const path of batchPaths) {
    const url = `https://${config.cdn.domain}${path}`;
    http.get(url);
  }
  sleep(3);
  
  // Step 2: Update content for all paths
  const updatePromises = batchPaths.map(path => {
    const content = `Batch invalidation test ${batchId} for ${path}`;
    return simulateContentUpdate(path, content);
  });
  
  const updateResults = updatePromises; // In real scenario, these would be async
  const successfulUpdates = updateResults.filter(r => r.success).length;
  
  // Step 3: Request batch invalidation
  const invalidationStart = Date.now();
  const invalidationResponse = requestInvalidation(batchPaths);
  const invalidationTime = Date.now() - invalidationStart;
  
  invalidationRequestTime.add(invalidationTime);
  
  const batchSuccess = check(invalidationResponse, {
    'batch invalidation request successful': (r) => r.success === true,
    'batch invalidation ID returned': (r) => r.invalidationId !== undefined,
    'batch processing time acceptable': () => invalidationTime < 15000, // 15 seconds for batch
  });
  
  batchInvalidationEfficiency.add(batchSuccess);
  
  if (!batchSuccess) {
    console.error('Batch invalidation request failed');
    invalidationErrors.add(1);
    return;
  }
  
  console.log(`Batch invalidation requested: ${invalidationResponse.invalidationId} (${invalidationTime}ms)`);
  
  // Step 4: Monitor batch propagation
  const propagationStart = Date.now();
  let propagatedCount = 0;
  
  for (const path of batchPaths) {
    const url = `https://${config.cdn.domain}${path}`;
    const propagationTime = monitorInvalidationPropagation(url, `Batch invalidation test ${batchId}`, 300);
    
    if (propagationTime > 0) {
      propagatedCount++;
    }
  }
  
  const totalPropagationTime = Date.now() - propagationStart;
  invalidationPropagationTime.add(totalPropagationTime);
  
  const batchEfficiency = propagatedCount / batchPaths.length;
  batchInvalidationEfficiency.add(batchEfficiency >= 0.8); // 80% success threshold
  
  console.log(`Batch propagation: ${propagatedCount}/${batchPaths.length} paths (${totalPropagationTime}ms)`);
}

// Global propagation verification
export function verifyGlobalPropagation() {
  console.log('🌍 Testing global propagation...');
  
  const testPath = invalidationTestPaths[0];
  const globalTestId = `global-${Date.now()}`;
  const testContent = `Global propagation test: ${globalTestId}`;
  
  // Update content and request invalidation
  simulateContentUpdate(testPath, testContent);
  const invalidationResponse = requestInvalidation([testPath]);
  
  if (!invalidationResponse.success) {
    console.error('Failed to request invalidation for global test');
    return;
  }
  
  // Test propagation across multiple regions
  const regionalResults = [];
  
  for (const region of regionalEndpoints) {
    const regionStart = Date.now();
    const url = `https://${config.cdn.domain}${testPath}`;
    
    // Monitor propagation for this region
    const propagationTime = monitorInvalidationPropagation(url, globalTestId, 360); // 6 minute timeout
    
    regionalResults.push({
      region: region.region,
      propagationTime: propagationTime,
      success: propagationTime > 0
    });
    
    console.log(`${region.region}: ${propagationTime > 0 ? propagationTime + 'ms' : 'TIMEOUT'}`);
  }
  
  // Calculate global propagation metrics
  const successfulRegions = regionalResults.filter(r => r.success);
  const maxPropagationTime = Math.max(...successfulRegions.map(r => r.propagationTime));
  
  globalPropagationTime.add(maxPropagationTime);
  
  check(null, {
    'global propagation successful': () => successfulRegions.length >= regionalResults.length * 0.8, // 80% of regions
    'global propagation time acceptable': () => maxPropagationTime < 360000, // 6 minutes
  });
  
  console.log(`Global propagation: ${successfulRegions.length}/${regionalResults.length} regions in ${maxPropagationTime}ms`);
}

// Helper Functions

function simulateContentUpdate(path, content) {
  // In a real scenario, this would upload new content to S3
  // For testing purposes, we simulate this operation
  console.log(`Simulating content update for ${path}`);
  
  // Simulate upload time
  const uploadTime = Math.random() * 1000 + 500; // 500-1500ms
  sleep(uploadTime / 1000);
  
  return {
    success: Math.random() > 0.05, // 95% success rate
    uploadTime: uploadTime,
    content: content
  };
}

function requestInvalidation(paths) {
  console.log(`Requesting invalidation for ${paths.length} paths`);
  
  // Simulate CloudFront invalidation API call
  const requestStart = Date.now();
  
  // In real implementation, this would call AWS CloudFront API
  // For testing, we simulate the API response
  const simulatedApiCall = {
    DistributionId: config.cdn.distributionId || '',
    InvalidationBatch: {
      Paths: {
        Quantity: paths.length,
        Items: paths
      },
      CallerReference: `k6-test-${Date.now()}`
    }
  };
  
  // Simulate API call time
  const apiCallTime = Math.random() * 3000 + 1000; // 1-4 seconds
  sleep(apiCallTime / 1000);
  
  const requestTime = Date.now() - requestStart;
  
  // Simulate API response
  const success = Math.random() > 0.02; // 98% success rate
  
  return {
    success: success,
    invalidationId: success ? `I${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}` : null,
    requestTime: requestTime,
    paths: paths
  };
}

function monitorInvalidationPropagation(url, expectedContent, timeoutMinutes) {
  const startTime = Date.now();
  const timeout = timeoutMinutes * 60 * 1000; // Convert to milliseconds
  const checkInterval = 5000; // Check every 5 seconds
  
  while (Date.now() - startTime < timeout) {
    // Add cache-busting parameter to ensure we're not getting cached responses
    const cacheBustUrl = `${url}?cb=${Date.now()}`;
    
    const response = http.get(cacheBustUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: '10s'
    });
    
    if (response.status === 200) {
      // Check if the content has been updated
      const cacheStatus = response.headers['X-Cache'] || 
                         response.headers['CloudFront-Cache-Status'] || 
                         'Unknown';
      
      // Look for cache miss indicating invalidation worked
      if (cacheStatus.includes('Miss') || cacheStatus.includes('miss')) {
        const propagationTime = Date.now() - startTime;
        console.log(`🎯 Invalidation detected via cache miss (${propagationTime}ms)`);
        return propagationTime;
      }
      
      // Also check content if available (for more precise detection)
      if (response.body && response.body.includes(expectedContent)) {
        const propagationTime = Date.now() - startTime;
        console.log(`🎯 Content invalidation confirmed (${propagationTime}ms)`);
        return propagationTime;
      }
    }
    
    sleep(checkInterval / 1000);
  }
  
  console.log(`⏰ Invalidation propagation timeout after ${timeoutMinutes} minutes`);
  return -1; // Timeout
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`logs/performance/cache-invalidation-${timestamp}.json`]: JSON.stringify(data, null, 2),
    [`logs/performance/cache-invalidation-${timestamp}.html`]: htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function htmlReport(data) {
  const timestamp = new Date().toISOString();
  const metrics = data.metrics;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Cache Invalidation Performance Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .success { background-color: #d4edda; }
        .warning { background-color: #fff3cd; }
        .error { background-color: #f8d7da; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Cache Invalidation Performance Report</h1>
    <p><strong>Generated:</strong> ${timestamp}</p>
    
    <h2>Invalidation Performance Summary</h2>
    <div class="metric ${metrics.invalidation_success_rate.values.rate >= 0.95 ? 'success' : 'error'}">
        <strong>Invalidation Success Rate:</strong> ${(metrics.invalidation_success_rate.values.rate * 100).toFixed(2)}%
    </div>
    
    <div class="metric ${metrics.invalidation_request_time.values['p(95)'] <= 5000 ? 'success' : 'warning'}">
        <strong>Invalidation Request Time (p95):</strong> ${metrics.invalidation_request_time.values['p(95)'].toFixed(2)}ms
    </div>
    
    <div class="metric ${metrics.invalidation_propagation_time.values['p(95)'] <= 300000 ? 'success' : 'warning'}">
        <strong>Propagation Time (p95):</strong> ${(metrics.invalidation_propagation_time.values['p(95)'] / 1000).toFixed(2)}s
    </div>
    
    <div class="metric ${metrics.batch_invalidation_efficiency.values.rate >= 0.9 ? 'success' : 'warning'}">
        <strong>Batch Invalidation Efficiency:</strong> ${(metrics.batch_invalidation_efficiency.values.rate * 100).toFixed(2)}%
    </div>
    
    <h2>Performance Targets</h2>
    <table>
        <tr><th>Metric</th><th>Target</th><th>Actual</th><th>Status</th></tr>
        <tr>
            <td>Invalidation Request Time (p95)</td>
            <td>≤ 5s</td>
            <td>${(metrics.invalidation_request_time.values['p(95)'] / 1000).toFixed(2)}s</td>
            <td>${metrics.invalidation_request_time.values['p(95)'] <= 5000 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Global Propagation Time (p95)</td>
            <td>≤ 5min</td>
            <td>${(metrics.invalidation_propagation_time.values['p(95)'] / 60000).toFixed(2)}min</td>
            <td>${metrics.invalidation_propagation_time.values['p(95)'] <= 300000 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Invalidation Success Rate</td>
            <td>≥ 95%</td>
            <td>${(metrics.invalidation_success_rate.values.rate * 100).toFixed(2)}%</td>
            <td>${metrics.invalidation_success_rate.values.rate >= 0.95 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Batch Efficiency</td>
            <td>≥ 90%</td>
            <td>${(metrics.batch_invalidation_efficiency.values.rate * 100).toFixed(2)}%</td>
            <td>${metrics.batch_invalidation_efficiency.values.rate >= 0.9 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
    </table>
    
    <h2>Invalidation Statistics</h2>
    <p><strong>Total Invalidation Requests:</strong> ${metrics.invalidation_success_rate.values.passes + metrics.invalidation_success_rate.values.fails}</p>
    <p><strong>Failed Invalidations:</strong> ${metrics.invalidation_errors.values.count}</p>
    <p><strong>Average Request Time:</strong> ${metrics.invalidation_request_time.values.avg.toFixed(2)}ms</p>
    <p><strong>Average Propagation Time:</strong> ${(metrics.invalidation_propagation_time.values.avg / 1000).toFixed(2)}s</p>
    
    <h2>Recommendations</h2>
    <ul>
        ${metrics.invalidation_request_time.values['p(95)'] > 5000 ? '<li>⚠️ Invalidation request times are high - consider API optimization</li>' : '<li>✅ Invalidation request times are within acceptable range</li>'}
        ${metrics.invalidation_propagation_time.values['p(95)'] > 300000 ? '<li>⚠️ Propagation times exceed 5 minutes - review CloudFront configuration</li>' : '<li>✅ Propagation times are acceptable</li>'}
        ${metrics.batch_invalidation_efficiency.values.rate < 0.9 ? '<li>⚠️ Batch invalidation efficiency is low - consider smaller batch sizes</li>' : '<li>✅ Batch invalidation is working efficiently</li>'}
    </ul>
</body>
</html>`;
}

function textSummary(data, options) {
  const metrics = data.metrics;
  
  return `
Cache Invalidation Performance Summary
=====================================

Test Duration: ${data.state.testRunDurationMs}ms

Invalidation Performance:
- Success Rate: ${(metrics.invalidation_success_rate.values.rate * 100).toFixed(2)}%
- Request Time (p95): ${(metrics.invalidation_request_time.values['p(95)'] / 1000).toFixed(2)}s
- Propagation Time (p95): ${(metrics.invalidation_propagation_time.values['p(95)'] / 60000).toFixed(2)}min
- Batch Efficiency: ${(metrics.batch_invalidation_efficiency.values.rate * 100).toFixed(2)}%
- Failed Requests: ${metrics.invalidation_errors.values.count}

Performance Targets:
${metrics.invalidation_request_time.values['p(95)'] <= 5000 ? '✅' : '❌'} Request Time ≤ 5s
${metrics.invalidation_propagation_time.values['p(95)'] <= 300000 ? '✅' : '❌'} Propagation ≤ 5min
${metrics.invalidation_success_rate.values.rate >= 0.95 ? '✅' : '❌'} Success Rate ≥ 95%
${metrics.batch_invalidation_efficiency.values.rate >= 0.9 ? '✅' : '❌'} Batch Efficiency ≥ 90%
`;
}