/**
 * CDN Latency Test
 * k6 script for testing CloudFront CDN performance with cache warming
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const config = require('./config.js');

// Custom metrics
const cdnHitLatency = new Trend('cdn_hit_latency');
const cdnMissLatency = new Trend('cdn_miss_latency');
const cacheHitRate = new Rate('cache_hit_rate');
const cdnErrorRate = new Rate('cdn_error_rate');
const ttfb = new Trend('time_to_first_byte');
const cacheStatus = new Counter('cache_status_counter');
const regionalLatency = new Trend('regional_latency');

export const options = {
  scenarios: {
    cache_warming: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '5m',
      exec: 'warmCache',
    },
    cdn_latency_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '10m',
      startTime: '1m', // Start after cache warming
      exec: 'testCdnLatency',
    },
    regional_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '5m',
      startTime: '12m', // Start after main test
      exec: 'testRegionalLatency',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    cdn_hit_latency: ['p(95)<150'],   // 95% of cache hits under 150ms
    cdn_miss_latency: ['p(95)<500'],  // 95% of cache misses under 500ms
    cache_hit_rate: ['rate>=0.8'],    // 80% cache hit rate minimum
    cdn_error_rate: ['rate<0.01'],    // Less than 1% CDN errors
    ttfb: ['p(95)<100'],              // 95% TTFB under 100ms
  },
};

// Test assets for CDN testing
const testAssets = [
  { path: '/uploads/main/test-image-1.jpg', type: 'image', size: 'medium' },
  { path: '/uploads/main/test-image-2.jpg', type: 'image', size: 'small' },
  { path: '/uploads/albums/test-album-cover.jpg', type: 'image', size: 'large' },
  { path: '/uploads/songs/test-audio-thumb.jpg', type: 'image', size: 'small' },
  { path: '/uploads/videos/test-video-poster.jpg', type: 'image', size: 'medium' },
  { path: '/uploads/articles/test-article-image.jpg', type: 'image', size: 'small' },
];

// Cache warming function
export function warmCache() {
  console.log('🔥 Starting CDN cache warming phase...');
  
  for (const asset of testAssets) {
    const url = `https://${config.cdn.domain}${asset.path}`;
    console.log(`Warming cache for: ${url}`);
    
    // Initial request to warm the cache
    const warmupResponse = http.get(url, {
      headers: {
        'User-Agent': 'k6-cache-warmer/1.0',
      },
      timeout: '30s',
    });
    
    check(warmupResponse, {
      'warmup request successful': (r) => r.status === 200 || r.status === 404, // 404 is OK for test assets
    });
    
    // Multiple requests to ensure cache warming
    for (let i = 0; i < 3; i++) {
      http.get(url);
      sleep(0.5);
    }
    
    sleep(1); // Brief pause between assets
  }
  
  console.log('🔥 Cache warming completed. Waiting for propagation...');
  sleep(config.cdn.cacheWarmupDelay / 1000); // Convert ms to seconds
}

// Main CDN latency testing function
export function testCdnLatency() {
  // Select random asset
  const asset = testAssets[Math.floor(Math.random() * testAssets.length)];
  const url = `https://${config.cdn.domain}${asset.path}`;
  
  const startTime = Date.now();
  
  const response = http.get(url, {
    headers: {
      'User-Agent': 'k6-cdn-test/1.0',
      'Cache-Control': 'no-cache', // 10% of requests bypass cache
    },
    timeout: '10s',
  });
  
  const endTime = Date.now();
  const latency = endTime - startTime;
  
  // Extract cache status from headers
  const cacheStatus = getCacheStatus(response);
  const isHit = cacheStatus.includes('Hit') || cacheStatus.includes('hit');
  const isMiss = cacheStatus.includes('Miss') || cacheStatus.includes('miss');
  
  // Record metrics based on cache status
  if (isHit) {
    cdnHitLatency.add(latency);
    cacheHitRate.add(1);
  } else if (isMiss) {
    cdnMissLatency.add(latency);
    cacheHitRate.add(0);
  }
  
  // Record TTFB (Time to First Byte)
  const ttfbValue = response.timings.waiting;
  ttfb.add(ttfbValue);
  
  // Track cache status
  cacheStatus.add(cacheStatus, 1);
  
  const success = check(response, {
    'CDN response status is 200': (r) => r.status === 200,
    'CDN response time acceptable': (r) => latency < 1000,
    'CDN response has content': (r) => r.body.length > 0,
    'CDN response has cache headers': (r) => r.headers['Cache-Control'] !== undefined,
    'CDN TTFB acceptable': (r) => r.timings.waiting < 200,
  });
  
  if (!success) {
    cdnErrorRate.add(1);
    console.error(`CDN request failed: ${url} - ${response.status} (${latency}ms)`);
  } else {
    cdnErrorRate.add(0);
  }
  
  // Log detailed information for sample of requests
  if (Math.random() < 0.05) { // 5% of requests
    console.log(`CDN: ${asset.path} | ${response.status} | ${latency}ms | Cache: ${cacheStatus} | TTFB: ${ttfbValue}ms`);
  }
  
  // Test cache headers validation
  validateCacheHeaders(response, asset);
  
  // Random sleep to distribute load
  sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

// Regional latency testing
export function testRegionalLatency() {
  const asset = testAssets[Math.floor(Math.random() * testAssets.length)];
  const url = `https://${config.cdn.domain}${asset.path}`;
  
  // Simulate different geographic regions by adding region headers
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
  const region = regions[Math.floor(Math.random() * regions.length)];
  
  const startTime = Date.now();
  
  const response = http.get(url, {
    headers: {
      'CloudFront-Viewer-Country': getCountryFromRegion(region),
      'User-Agent': `k6-regional-test/${region}`,
    },
    timeout: '10s',
  });
  
  const latency = Date.now() - startTime;
  regionalLatency.add(latency, { region: region });
  
  check(response, {
    'regional response successful': (r) => r.status === 200,
    'regional latency acceptable': (r) => latency < 800,
  });
  
  sleep(1);
}

// Helper functions
function getCacheStatus(response) {
  // Check various cache status headers
  return response.headers['X-Cache'] || 
         response.headers['CloudFront-Cache-Status'] ||
         response.headers['CF-Cache-Status'] ||
         'Unknown';
}

function getCountryFromRegion(region) {
  const regionMap = {
    'us-east-1': 'US',
    'us-west-2': 'US', 
    'eu-west-1': 'GB',
    'ap-southeast-1': 'SG'
  };
  return regionMap[region] || 'US';
}

function validateCacheHeaders(response, asset) {
  const cacheControl = response.headers['Cache-Control'];
  const etag = response.headers['ETag'];
  const lastModified = response.headers['Last-Modified'];
  
  check(response, {
    'has Cache-Control header': (r) => cacheControl !== undefined,
    'has ETag or Last-Modified': (r) => etag !== undefined || lastModified !== undefined,
    'Cache-Control allows caching': (r) => cacheControl && !cacheControl.includes('no-cache'),
    'appropriate max-age': (r) => {
      if (!cacheControl) return false;
      const maxAge = cacheControl.match(/max-age=(\d+)/);
      return maxAge && parseInt(maxAge[1]) > 3600; // At least 1 hour
    }
  });
}

// Advanced CDN testing scenarios
export function testCacheInvalidation() {
  // This would typically be called after a cache invalidation
  const asset = testAssets[0]; // Use first asset
  const url = `https://${config.cdn.domain}${asset.path}`;
  
  console.log('Testing cache invalidation effects...');
  
  // Force cache miss with query parameter
  const cacheBustUrl = `${url}?t=${Date.now()}`;
  
  const response = http.get(cacheBustUrl, {
    headers: {
      'Cache-Control': 'no-cache',
    }
  });
  
  const cacheStatus = getCacheStatus(response);
  const isMiss = cacheStatus.includes('Miss') || cacheStatus.includes('miss');
  
  check(response, {
    'invalidation forces cache miss': (r) => isMiss,
    'invalidated content loads successfully': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`logs/performance/cdn-latency-${timestamp}.json`]: JSON.stringify(data, null, 2),
    [`logs/performance/cdn-latency-${timestamp}.html`]: htmlReport(data),
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
    <title>CDN Latency Test Report - ${timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .success { background-color: #d4edda; }
        .warning { background-color: #fff3cd; }
        .error { background-color: #f8d7da; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .chart { width: 100%; height: 200px; background: #f9f9f9; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>CDN Latency Test Report</h1>
    <p><strong>Generated:</strong> ${timestamp}</p>
    
    <h2>CDN Performance Summary</h2>
    <div class="metric ${metrics.cache_hit_rate.values.rate >= 0.8 ? 'success' : 'warning'}">
        <strong>Cache Hit Rate:</strong> ${(metrics.cache_hit_rate.values.rate * 100).toFixed(2)}%
    </div>
    
    <div class="metric ${metrics.cdn_hit_latency.values['p(95)'] <= 150 ? 'success' : 'warning'}">
        <strong>Cache Hit Latency (p95):</strong> ${metrics.cdn_hit_latency.values['p(95)'].toFixed(2)}ms
    </div>
    
    <div class="metric ${metrics.cdn_miss_latency.values['p(95)'] <= 500 ? 'success' : 'warning'}">
        <strong>Cache Miss Latency (p95):</strong> ${metrics.cdn_miss_latency.values['p(95)'].toFixed(2)}ms
    </div>
    
    <div class="metric ${metrics.ttfb.values['p(95)'] <= 100 ? 'success' : 'warning'}">
        <strong>Time to First Byte (p95):</strong> ${metrics.ttfb.values['p(95)'].toFixed(2)}ms
    </div>
    
    <h2>Performance Targets vs Actual</h2>
    <table>
        <tr><th>Metric</th><th>Target</th><th>Actual</th><th>Status</th></tr>
        <tr>
            <td>Cache Hit Latency (p95)</td>
            <td>≤ 150ms</td>
            <td>${metrics.cdn_hit_latency.values['p(95)'].toFixed(2)}ms</td>
            <td>${metrics.cdn_hit_latency.values['p(95)'] <= 150 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Cache Miss Latency (p95)</td>
            <td>≤ 500ms</td>
            <td>${metrics.cdn_miss_latency.values['p(95)'].toFixed(2)}ms</td>
            <td>${metrics.cdn_miss_latency.values['p(95)'] <= 500 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Cache Hit Rate</td>
            <td>≥ 80%</td>
            <td>${(metrics.cache_hit_rate.values.rate * 100).toFixed(2)}%</td>
            <td>${metrics.cache_hit_rate.values.rate >= 0.8 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>CDN Error Rate</td>
            <td>< 1%</td>
            <td>${(metrics.cdn_error_rate.values.rate * 100).toFixed(2)}%</td>
            <td>${metrics.cdn_error_rate.values.rate < 0.01 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
    </table>
    
    <h2>Latency Distribution</h2>
    <div class="chart">
        <p>Cache Hit Latency:</p>
        <ul>
            <li>Min: ${metrics.cdn_hit_latency.values.min.toFixed(2)}ms</li>
            <li>Avg: ${metrics.cdn_hit_latency.values.avg.toFixed(2)}ms</li>
            <li>p95: ${metrics.cdn_hit_latency.values['p(95)'].toFixed(2)}ms</li>
            <li>Max: ${metrics.cdn_hit_latency.values.max.toFixed(2)}ms</li>
        </ul>
    </div>
    
    <h2>Regional Performance</h2>
    <p>Regional latency metrics would be displayed here with geographic breakdown.</p>
    
    <h2>Raw Metrics</h2>
    <details>
        <summary>View detailed metrics</summary>
        <pre>${JSON.stringify(metrics, null, 2)}</pre>
    </details>
</body>
</html>`;
}

function textSummary(data, options) {
  const metrics = data.metrics;
  
  return `
CDN Latency Test Summary
========================

Test Duration: ${data.state.testRunDurationMs}ms

CDN Performance:
- Cache Hit Rate: ${(metrics.cache_hit_rate.values.rate * 100).toFixed(2)}%
- Cache Hit Latency (p95): ${metrics.cdn_hit_latency.values['p(95)'].toFixed(2)}ms
- Cache Miss Latency (p95): ${metrics.cdn_miss_latency.values['p(95)'].toFixed(2)}ms
- TTFB (p95): ${metrics.ttfb.values['p(95)'].toFixed(2)}ms
- CDN Error Rate: ${(metrics.cdn_error_rate.values.rate * 100).toFixed(2)}%

Performance Targets:
${metrics.cdn_hit_latency.values['p(95)'] <= 150 ? '✅' : '❌'} Cache Hit Latency ≤ 150ms
${metrics.cdn_miss_latency.values['p(95)'] <= 500 ? '✅' : '❌'} Cache Miss Latency ≤ 500ms  
${metrics.cache_hit_rate.values.rate >= 0.8 ? '✅' : '❌'} Cache Hit Rate ≥ 80%
${metrics.cdn_error_rate.values.rate < 0.01 ? '✅' : '❌'} CDN Error Rate < 1%
`;
}