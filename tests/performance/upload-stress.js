/**
 * Upload Stress Test
 * k6 script for testing concurrent file upload scenarios
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

const config = require('./config.js');

// Custom metrics
const uploadSuccessRate = new Rate('upload_success_rate');
const uploadDuration = new Trend('upload_duration');
const uploadFailures = new Counter('upload_failures');
const s3UploadDuration = new Trend('s3_upload_duration');
const cdnUrlGeneration = new Trend('cdn_url_generation');

export const options = {
  scenarios: {
    upload_stress: {
      executor: 'ramping-vus',
      stages: [
        { duration: '2m', target: 10 }, // Ramp up to 10 users
        { duration: '5m', target: 10 }, // Stay at 10 users
        { duration: '2m', target: 20 }, // Ramp up to 20 users
        { duration: '5m', target: 20 }, // Stay at 20 users
        { duration: '2m', target: 30 }, // Ramp up to 30 users
        { duration: '5m', target: 30 }, // Stay at 30 users
        { duration: '3m', target: 0 },  // Ramp down to 0 users
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<10000'], // 95% of requests under 10s
    http_req_failed: ['rate<0.05'],     // Less than 5% failures
    upload_success_rate: ['rate>0.95'], // 95% upload success rate
    upload_duration: ['p(95)<5000'],    // 95% of uploads under 5s
  },
};

// Test data generation
function generateTestFile(size, filename) {
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  
  // Fill with random data to simulate real files
  for (let i = 0; i < size; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  
  return {
    data: buffer,
    filename: filename,
    content_type: getContentType(filename)
  };
}

function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg', 
    'png': 'image/png',
    'gif': 'image/gif',
    'mp3': 'audio/mpeg',
    'mp4': 'video/mp4',
    'txt': 'text/plain',
    'pdf': 'application/pdf'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function selectFileType() {
  const rand = Math.random() * 100;
  
  if (rand < 60) {
    // 60% small files
    return {
      size: Math.floor(Math.random() * 1024 * 1024) + 1024, // 1KB - 1MB
      filename: `small-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
      category: 'small'
    };
  } else if (rand < 90) {
    // 30% medium files
    return {
      size: Math.floor(Math.random() * 9 * 1024 * 1024) + 1024 * 1024, // 1MB - 10MB
      filename: `medium-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`,
      category: 'medium'
    };
  } else {
    // 10% large files
    return {
      size: Math.floor(Math.random() * 40 * 1024 * 1024) + 10 * 1024 * 1024, // 10MB - 50MB
      filename: `large-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp4`,
      category: 'large'
    };
  }
}

export default function() {
  const fileSpec = selectFileType();
  const testFile = generateTestFile(fileSpec.size, fileSpec.filename);
  
  console.log(`Uploading ${fileSpec.category} file: ${fileSpec.filename} (${Math.round(fileSpec.size / 1024)}KB)`);
  
  // Create form data for multipart upload
  const fd = new FormData();
  fd.append('file', http.file(testFile.data, testFile.filename, testFile.content_type));
  fd.append('category', fileSpec.category);
  fd.append('description', `Performance test file - ${fileSpec.category}`);
  
  const uploadStartTime = Date.now();
  
  // Upload file
  const uploadResponse = http.post(`${config.baseUrl}${config.apiPrefix}/main/files`, fd.body(), {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + fd.boundary,
    },
    timeout: '60s', // Longer timeout for large files
  });
  
  const uploadEndTime = Date.now();
  const uploadTime = uploadEndTime - uploadStartTime;
  
  uploadDuration.add(uploadTime);
  
  // Check upload response
  const uploadSuccess = check(uploadResponse, {
    'upload status is 200': (r) => r.status === 200,
    'upload response has success': (r) => r.json('success') === true,
    'upload response has file': (r) => r.json('file') !== undefined,
    'upload response has s3Key': (r) => r.json('file.s3Key') !== undefined,
    'upload response has cdnUrl': (r) => r.json('file.cdnUrl') !== undefined,
  });
  
  uploadSuccessRate.add(uploadSuccess);
  
  if (!uploadSuccess) {
    uploadFailures.add(1);
    console.error(`Upload failed for ${fileSpec.filename}: ${uploadResponse.status} ${uploadResponse.body}`);
    return;
  }
  
  const responseData = uploadResponse.json();
  const fileData = responseData.file;
  
  // Record S3-specific metrics
  if (fileData.uploadTime) {
    s3UploadDuration.add(fileData.uploadTime);
  }
  
  if (fileData.cdnUrl) {
    cdnUrlGeneration.add(10); // Assume 10ms for CDN URL generation
  }
  
  // Verify CDN URL is accessible (for small subset of uploads)
  if (Math.random() < 0.1 && fileData.cdnUrl) { // 10% of uploads
    sleep(1); // Wait for CDN propagation
    
    const cdnCheckStart = Date.now();
    const cdnResponse = http.get(fileData.cdnUrl, {
      timeout: '10s',
    });
    const cdnCheckTime = Date.now() - cdnCheckStart;
    
    check(cdnResponse, {
      'CDN response is successful': (r) => r.status === 200,
      'CDN response time acceptable': (r) => cdnCheckTime < 2000,
    });
    
    console.log(`CDN check for ${fileSpec.filename}: ${cdnResponse.status} (${cdnCheckTime}ms)`);
  }
  
  // Test file metadata retrieval
  if (fileData._id) {
    const metadataResponse = http.get(`${config.baseUrl}${config.apiPrefix}/main/files/${fileData._id}`);
    
    check(metadataResponse, {
      'metadata retrieval successful': (r) => r.status === 200,
      'metadata has correct file info': (r) => {
        const data = r.json();
        return data.file && data.file.s3Key && data.file.cdnUrl;
      }
    });
  }
  
  // Random sleep to simulate real user behavior
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    [`logs/performance/upload-stress-${timestamp}.json`]: JSON.stringify(data, null, 2),
    [`logs/performance/upload-stress-${timestamp}.html`]: htmlReport(data),
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
    <title>Upload Stress Test Report - ${timestamp}</title>
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
    <h1>Upload Stress Test Report</h1>
    <p><strong>Generated:</strong> ${timestamp}</p>
    
    <h2>Key Metrics</h2>
    <div class="metric ${metrics.http_req_failed.values.rate < 0.05 ? 'success' : 'error'}">
        <strong>Request Failure Rate:</strong> ${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%
    </div>
    
    <div class="metric ${metrics.upload_success_rate.values.rate > 0.95 ? 'success' : 'error'}">
        <strong>Upload Success Rate:</strong> ${(metrics.upload_success_rate.values.rate * 100).toFixed(2)}%
    </div>
    
    <div class="metric">
        <strong>Upload Duration (p95):</strong> ${metrics.upload_duration.values['p(95)'].toFixed(2)}ms
    </div>
    
    <div class="metric">
        <strong>Total Uploads:</strong> ${metrics.upload_success_rate.values.passes + metrics.upload_success_rate.values.fails}
    </div>
    
    <h2>Performance Thresholds</h2>
    <table>
        <tr><th>Threshold</th><th>Target</th><th>Actual</th><th>Status</th></tr>
        <tr>
            <td>HTTP Request Duration (p95)</td>
            <td>&lt; 10000ms</td>
            <td>${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
            <td>${metrics.http_req_duration.values['p(95)'] < 10000 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Request Failure Rate</td>
            <td>&lt; 5%</td>
            <td>${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%</td>
            <td>${metrics.http_req_failed.values.rate < 0.05 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
        <tr>
            <td>Upload Success Rate</td>
            <td>&gt; 95%</td>
            <td>${(metrics.upload_success_rate.values.rate * 100).toFixed(2)}%</td>
            <td>${metrics.upload_success_rate.values.rate > 0.95 ? '✅ Pass' : '❌ Fail'}</td>
        </tr>
    </table>
    
    <h2>Detailed Metrics</h2>
    <pre>${JSON.stringify(metrics, null, 2)}</pre>
</body>
</html>`;
}

function textSummary(data, options) {
  let summary = `
Upload Stress Test Summary
==========================

Duration: ${data.state.testRunDurationMs}ms
VUs: ${data.state.vusMax} max, ${data.state.vusActive} active

Key Results:
- Upload Success Rate: ${(data.metrics.upload_success_rate.values.rate * 100).toFixed(2)}%
- Request Failure Rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
- Average Upload Duration: ${data.metrics.upload_duration.values.avg.toFixed(2)}ms
- 95th Percentile Upload Duration: ${data.metrics.upload_duration.values['p(95)'].toFixed(2)}ms

Thresholds:
`;

  for (const [name, threshold] of Object.entries(data.thresholds || {})) {
    summary += `- ${name}: ${threshold.ok ? '✅ PASS' : '❌ FAIL'}\n`;
  }

  return summary;
}