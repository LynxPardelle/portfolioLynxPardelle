/**
 * Jest Setup File
 * Configures mocks, environment variables, and test utilities
 */

// Mock AWS SDK clients to prevent real AWS calls during testing
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-cloudfront');
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/lib-storage');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.S3_REGION = 'us-east-1';
process.env.S3_ACCESS_KEY_ID = 'test-access-key';
process.env.S3_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.CLOUDFRONT_DOMAIN = 'test.cloudfront.net';
process.env.CLOUDFRONT_DISTRIBUTION_ID = 'TEST123';

// S3-only mode for testing
process.env.S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'test-bucket';

// Test database configuration
process.env.MONGO_URI = 'mongodb://test:test@localhost:27017/test_db';

// JWT and other secrets
process.env.JWT_SECRET = 'test-jwt-secret';

// Disable console output during tests (except for explicit console.log in tests)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Restore console for specific tests that need it
global.restoreConsole = () => {
  global.console = originalConsole;
};

// Test utilities
global.testUtils = {
  // Generate test file metadata
  createTestFileMetadata: (overrides = {}) => ({
    originalName: 'test-file.jpg',
    mimetype: 'image/jpeg',
    size: 1024,
    encoding: '7bit',
    ...overrides
  }),

  // Generate test S3 response
  createTestS3Response: (overrides = {}) => ({
    Key: 'uploads/test/test-file.jpg',
    Bucket: 'test-bucket',
    ETag: '"test-etag"',
    Location: 'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test/test-file.jpg',
    ...overrides
  }),

  // Create test database file record
  createTestFileRecord: (overrides = {}) => ({
    _id: '507f1f77bcf86cd799439011',
    name: 'test-file.jpg',
    path: '/uploads/test/',
    url: '/uploads/test/test-file.jpg',
    metadata: {
      originalName: 'test-file.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
      encoding: '7bit'
    },
    s3Key: 'uploads/test/test-file.jpg',
    cdnUrl: 'https://test.cloudfront.net/uploads/test/test-file.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  // Mock S3 client responses
  mockS3Success: () => ({
    send: jest.fn().mockResolvedValue({
      Key: 'uploads/test/test-file.jpg',
      Bucket: 'test-bucket',
      ETag: '"test-etag"',
      Location: 'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test/test-file.jpg'
    })
  }),

  mockS3Error: (errorCode) => ({
    send: jest.fn().mockRejectedValue(new Error(`AWS Error: ${errorCode}`))
  }),

  // Mock CloudFront client responses
  mockCloudFrontSuccess: () => ({
    send: jest.fn().mockResolvedValue({
      Invalidation: {
        Id: 'test-invalidation-id',
        Status: 'InProgress'
      }
    })
  }),

  // Async test wrapper for better error handling
  asyncTest: (testFn) => {
    return async () => {
      try {
        await testFn();
      } catch (error) {
        console.error('Test failed:', error);
        throw error;
      }
    };
  },

  // Wait utility for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Clean up mocks between tests
  clearAllMocks: () => {
    jest.clearAllMocks();
    // Clear require cache for services to ensure fresh instances
    delete require.cache[require.resolve('../services/s3')];
    delete require.cache[require.resolve('../services/s3UploadUtility')];
  }
};

// Global test cleanup
afterEach(() => {
  global.testUtils.clearAllMocks();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// MongoDB Memory Server setup for integration tests
let mongoServer;

global.setupTestDatabase = async () => {
  // This would typically use @shelf/jest-mongodb or mongodb-memory-server
  // For now, we'll mock it
  return Promise.resolve();
};

global.teardownTestDatabase = async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Export for use in other test files
module.exports = {
  testUtils: global.testUtils,
  setupTestDatabase: global.setupTestDatabase,
  teardownTestDatabase: global.teardownTestDatabase
};