/**
 * Performance Testing Configuration
 * Centralized configuration for all performance tests
 */

const config = {
  // Application endpoints
  baseUrl: process.env.PERF_BASE_URL || 'http://localhost:6164',
  apiPrefix: '/api',
  
  // Performance test targets from benchmarks
  targets: {
    upload: {
      smallFile: { median: 300, p95: 600, p99: 1000 }, // ms
      mediumFile: { median: 1500, p95: 2000, p99: 3000 }, // ms
      largeFile: { median: 6000, p95: 10000, p99: 15000 } // ms
    },
    cdn: {
      cacheHit: { median: 50, p95: 150, p99: 300 }, // ms
      cacheMiss: { median: 200, p95: 500, p99: 1000 }, // ms
      hitRatio: 90 // percentage
    },
    system: {
      successRate: 99.5, // percentage
      errorRate: 0.5, // percentage
      availability: 99.9 // percentage
    }
  },

  // Load test scenarios
  scenarios: {
    normal: {
      name: 'Normal Load',
      vus: 10, // virtual users
      duration: '60m',
      description: '10 concurrent users for 1 hour'
    },
    peak: {
      name: 'Peak Load', 
      vus: 50,
      duration: '30m',
      description: '50 concurrent users for 30 minutes'
    },
    stress: {
      name: 'Stress Test',
      vus: 100,
      duration: '15m',
      description: '100 concurrent users for 15 minutes'
    },
    spike: {
      name: 'Spike Test',
      stages: [
        { duration: '2m', target: 0 },
        { duration: '1m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
        { duration: '4m', target: 0 }
      ],
      description: 'Sudden spike to 200 users'
    }
  },

  // File configurations for testing
  files: {
    small: {
      name: 'small-test-file.txt',
      size: 1024, // 1KB
      weight: 60 // 60% of requests
    },
    medium: {
      name: 'medium-test-file.jpg',
      size: 1024 * 1024 * 5, // 5MB
      weight: 30 // 30% of requests
    },
    large: {
      name: 'large-test-file.mp4',
      size: 1024 * 1024 * 25, // 25MB
      weight: 10 // 10% of requests
    }
  },

  // CDN test configuration
  cdn: {
    domain: process.env.CLOUDFRONT_DOMAIN || 'assets.lynxpardelle.com',
    testPaths: [
      '/uploads/main/test-image.jpg',
      '/uploads/albums/test-album-cover.jpg',
      '/uploads/songs/test-audio.mp3',
      '/uploads/videos/test-video-thumb.jpg'
    ],
    regions: [
      { name: 'US-East', code: 'us-east-1' },
      { name: 'US-West', code: 'us-west-2' },
      { name: 'EU-West', code: 'eu-west-1' },
      { name: 'Asia-Pacific', code: 'ap-southeast-1' }
    ],
    cacheWarmupDelay: 5000 // ms to wait after cache warming
  },

  // Monitoring and alerting thresholds
  thresholds: {
    // k6 thresholds format
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.01'], // Less than 1% failures
    http_reqs: ['rate>10'], // At least 10 requests per second
    vus: ['value>0'], // At least 1 virtual user
    vus_max: ['value<200'], // Maximum 200 virtual users
    
    // Custom thresholds
    upload_success_rate: 99.5,
    cdn_cache_hit_ratio: 90,
    memory_usage_threshold: 80, // percentage
    cpu_usage_threshold: 70 // percentage
  },

  // Test data generation
  testData: {
    generateRandomFile: (size) => {
      return Buffer.alloc(size, 'A'); // Simple buffer filled with 'A'
    },
    generateImageBuffer: (width = 800, height = 600) => {
      // Generate simple test image buffer (placeholder)
      const size = width * height * 3; // RGB
      return Buffer.alloc(size, Math.floor(Math.random() * 256));
    },
    mimeTypes: {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf'
    }
  },

  // Reporting configuration
  reporting: {
    outputDir: './logs/performance',
    formats: ['json', 'html', 'csv'],
    includeCharts: true,
    includeRawData: true,
    retention: {
      days: 30,
      maxFiles: 100
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      baseUrl: 'http://localhost:6164',
      reduced: true, // Use reduced test loads
      scenarios: {
        normal: { vus: 5, duration: '5m' },
        peak: { vus: 10, duration: '3m' },
        stress: { vus: 20, duration: '2m' }
      }
    },
    staging: {
      baseUrl: 'https://staging.lynxpardelle.com',
      fullLoad: true
    },
    production: {
      baseUrl: 'https://lynxpardelle.com',
      readOnly: true, // Only read operations in production
      scenarios: {
        // Reduced loads for production safety
        normal: { vus: 3, duration: '10m' },
        peak: { vus: 8, duration: '5m' },
        stress: { vus: 15, duration: '3m' }
      }
    }
  }
};

// Environment-specific configuration override
const env = process.env.NODE_ENV || 'development';
if (config.environments[env]) {
  Object.assign(config, config.environments[env]);
}

module.exports = config;