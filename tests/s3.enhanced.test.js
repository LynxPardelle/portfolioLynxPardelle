/**
 * Enhanced S3 Service Tests
 * Jest/Testing framework compatible test suite
 */

describe('S3Service Enhanced Features', () => {
  let S3Service;
  
  beforeEach(() => {
    // Set environment variables
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.S3_REGION = 'us-east-1';
    process.env.CLOUDFRONT_DOMAIN = 'test.cloudfront.net';
    process.env.CLOUDFRONT_DISTRIBUTION_ID = 'TEST123';
    
    // Clear require cache and reload service
    delete require.cache[require.resolve('../services/s3')];
    S3Service = require('../services/s3');
  });  describe('CDN URL Generation', () => {
    test('buildCdnUrl should encode URLs properly', () => {
      const testKey = 'test folder/file with spaces.jpg';
      const cdnUrl = S3Service.buildCdnUrl(testKey);
      expect(cdnUrl).toContain('test%20folder');
      expect(cdnUrl).toContain('test.cloudfront.net');
    });

    test('buildCdnResponse should return complete object', () => {
      const testKey = 'test/file.jpg';
      const response = S3Service.buildCdnResponse(testKey, { success: true });
      
      expect(response).toHaveProperty('s3Key', testKey);
      expect(response).toHaveProperty('cdnUrl');
      expect(response).toHaveProperty('s3Url');
      expect(response).toHaveProperty('success', true);
    });
  });

  describe('Compression Pipeline', () => {
    test('shouldOptimizeImage should identify image types', () => {
      expect(S3Service.shouldOptimizeImage('image/jpeg')).toBe(true);
      expect(S3Service.shouldOptimizeImage('image/png')).toBe(true);
      expect(S3Service.shouldOptimizeImage('text/plain')).toBe(false);
    });

    test('shouldOptimizeAudio should identify audio types', () => {
      expect(S3Service.shouldOptimizeAudio('audio/mpeg')).toBe(true);
      expect(S3Service.shouldOptimizeAudio('audio/wav')).toBe(true);
      expect(S3Service.shouldOptimizeAudio('text/plain')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('isNonRetryableError should classify errors correctly', () => {
      const accessError = new Error('Access denied');
      accessError.name = 'AccessDenied';
      expect(S3Service.isNonRetryableError(accessError)).toBe(true);

      const networkError = new Error('Network error');
      networkError.name = 'NetworkingError';
      expect(S3Service.isNonRetryableError(networkError)).toBe(false);
    });

    test('maskSensitiveData should hide secrets', () => {
      const data = { 
        password: 'secret123', 
        accessKey: 'AKIA123', 
        normal: 'value' 
      };
      const masked = S3Service.maskSensitiveData(data);
      
      expect(masked.password).toBe('***MASKED***');
      expect(masked.accessKey).toBe('***MASKED***');
      expect(masked.normal).toBe('value');
    });

    test('createActionableError should enhance errors', () => {
      const originalError = new Error('Access denied');
      originalError.name = 'AccessDenied';
      
      const enhanced = S3Service.createActionableError(
        originalError, 
        'test upload', 
        { key: 'test.jpg' }
      );
      
      expect(enhanced.message).toContain('Access denied for test upload');
      expect(enhanced.actionable).toContain('IAM permissions');
      expect(enhanced.operation).toBe('test upload');
    });
  });

  describe('Service Configuration', () => {
    test('service configuration methods should work', () => {
      expect(typeof S3Service.isConfigured()).toBe('boolean');
      expect(typeof S3Service.isCloudFrontConfigured()).toBe('boolean');
      
      const status = S3Service.getServiceStatus();
      expect(status).toHaveProperty('s3');
      expect(status).toHaveProperty('cloudfront');
      expect(status).toHaveProperty('monitoring');
    });
  });

  describe('Utility Functions', () => {
    test('generateKey should create valid keys', () => {
      const key = S3Service.generateKey('test', 'my file.jpg', 'unique-id');
      expect(key).toMatch(/test\/\d+_unique-id_my_file\.jpg$/);
    });

    test('extractKeyFromUrl should handle URLs correctly', () => {
      const url = 'https://bucket.s3.region.amazonaws.com/uploads/test/file.jpg';
      const key = S3Service.extractKeyFromUrl(url);
      expect(key).toBe('uploads/test/file.jpg');
      
      expect(S3Service.extractKeyFromUrl('invalid')).toBeNull();
      expect(S3Service.extractKeyFromUrl(null)).toBeNull();
    });

    test('getCdnUrl should return appropriate URLs', () => {
      const testKey = 'test/file.jpg';
      const cdnUrl = S3Service.getCdnUrl(testKey);
      expect(cdnUrl).toContain(testKey);
    });
  });
});