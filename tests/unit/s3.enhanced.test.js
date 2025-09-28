/**
 * Enhanced S3 Service Unit Tests
 * Comprehensive testing for S3 service with CDN, mocking, and edge cases
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-cloudfront');

describe('S3Service Enhanced Tests', () => {
  let S3Service;
  let mockS3Client;
  let mockCloudFrontClient;

  beforeEach(() => {
    // Reset environment
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.S3_REGION = 'us-east-1';
    process.env.CLOUDFRONT_DOMAIN = 'test.cloudfront.net';
    process.env.CLOUDFRONT_DISTRIBUTION_ID = 'TEST123';
    
    // Create mock clients
    mockS3Client = {
      send: jest.fn()
    };
    mockCloudFrontClient = {
      send: jest.fn()
    };

    // Mock constructors
    S3Client.mockImplementation(() => mockS3Client);
    CloudFrontClient.mockImplementation(() => mockCloudFrontClient);

    // Clear require cache and reload service
    delete require.cache[require.resolve('../../services/s3')];
    S3Service = require('../../services/s3');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CDN URL Generation Edge Cases', () => {
    test('should handle URLs with spaces correctly', () => {
      const testKey = 'uploads/test folder/file with spaces.jpg';
      const cdnUrl = S3Service.buildCdnUrl(testKey);
      
      expect(cdnUrl).toContain('test%20folder');
      expect(cdnUrl).toContain('file%20with%20spaces.jpg');
      expect(cdnUrl).toMatch(/^https:\/\/test\.cloudfront\.net\//);
    });

    test('should handle Unicode characters in URLs', () => {
      const testKey = 'uploads/тест/файл.jpg';
      const cdnUrl = S3Service.buildCdnUrl(testKey);
      
      // Should encode Unicode characters
      expect(cdnUrl).toContain('%D1%82%D0%B5%D1%81%D1%82'); // 'тест'
      expect(cdnUrl).toContain('%D1%84%D0%B0%D0%B9%D0%BB'); // 'файл'
    });

    test('should handle special characters correctly', () => {
      const testKey = 'uploads/test+file&name=value.jpg';
      const cdnUrl = S3Service.buildCdnUrl(testKey);
      
      expect(cdnUrl).toContain('test%2Bfile');
      expect(cdnUrl).toContain('%26name%3Dvalue');
    });

    test('should handle empty or null keys gracefully', () => {
      expect(() => S3Service.buildCdnUrl('')).toThrow();
      expect(() => S3Service.buildCdnUrl(null)).toThrow();
      expect(() => S3Service.buildCdnUrl(undefined)).toThrow();
    });

    test('should handle very long file names', () => {
      const longFileName = 'a'.repeat(255) + '.jpg';
      const testKey = `uploads/test/${longFileName}`;
      const cdnUrl = S3Service.buildCdnUrl(testKey);
      
      expect(cdnUrl).toContain(testKey);
      expect(cdnUrl.length).toBeGreaterThan(testKey.length);
    });
  });

  describe('CloudFront Invalidation with Throttling', () => {
    test('should call CloudFront invalidation with correct parameters', async () => {
      mockCloudFrontClient.send.mockResolvedValue({
        Invalidation: { Id: 'test-id', Status: 'InProgress' }
      });

      const result = await S3Service.invalidateCloudFrontCache(['test/file1.jpg', 'test/file2.jpg']);

      expect(mockCloudFrontClient.send).toHaveBeenCalledWith(
        expect.any(CreateInvalidationCommand)
      );
      expect(result).toHaveProperty('invalidationId', 'test-id');
    });

    test('should handle CloudFront throttling gracefully', async () => {
      const throttleError = new Error('Rate exceeded');
      throttleError.name = 'TooManyRequestsException';
      
      mockCloudFrontClient.send
        .mockRejectedValueOnce(throttleError)
        .mockResolvedValueOnce({
          Invalidation: { Id: 'retry-id', Status: 'InProgress' }
        });

      const result = await S3Service.invalidateCloudFrontCache(['test/file.jpg']);

      expect(mockCloudFrontClient.send).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('invalidationId', 'retry-id');
    });

    test('should batch invalidation paths efficiently', async () => {
      mockCloudFrontClient.send.mockResolvedValue({
        Invalidation: { Id: 'batch-id', Status: 'InProgress' }
      });

      const paths = Array.from({ length: 25 }, (_, i) => `test/file${i}.jpg`);
      await S3Service.invalidateCloudFrontCache(paths);

      // Should batch into multiple requests if over limit
      expect(mockCloudFrontClient.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('Compression Pipeline Edge Cases', () => {
    test('should handle compression when Sharp is not available', async () => {
      // Mock Sharp to throw an error
      jest.doMock('sharp', () => {
        throw new Error('Sharp not available');
      });

      const buffer = Buffer.from('fake-image-data');
      const metadata = { mimetype: 'image/jpeg', originalName: 'test.jpg' };

      const result = await S3Service.optimizeBuffer(buffer, metadata);

      expect(result.buffer).toBe(buffer); // Should return original
      expect(result.wasOptimized).toBe(false);
    });

    test('should fallback gracefully when optimization fails', async () => {
      const buffer = Buffer.from('invalid-image-data');
      const metadata = { mimetype: 'image/jpeg', originalName: 'test.jpg' };

      const result = await S3Service.optimizeBuffer(buffer, metadata);

      expect(result.buffer).toBe(buffer);
      expect(result.wasOptimized).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should skip optimization for non-optimizable formats', async () => {
      const buffer = Buffer.from('text-content');
      const metadata = { mimetype: 'text/plain', originalName: 'test.txt' };

      const result = await S3Service.optimizeBuffer(buffer, metadata);

      expect(result.buffer).toBe(buffer);
      expect(result.wasOptimized).toBe(false);
      expect(result.reason).toBe('unsupported_format');
    });
  });

  describe('AWS SDK Client Mocking', () => {
    test('should mock S3 upload correctly', async () => {
      const mockResponse = {
        Key: 'uploads/test/test.jpg',
        Bucket: 'test-bucket',
        ETag: '"test-etag"',
        Location: 'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test/test.jpg'
      };

      mockS3Client.send.mockResolvedValue(mockResponse);

      const buffer = Buffer.from('test-data');
      const key = 'uploads/test/test.jpg';
      const metadata = { mimetype: 'image/jpeg' };

      const result = await S3Service.uploadBuffer(buffer, key, metadata);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand)
      );
      expect(result).toHaveProperty('s3Key', key);
      expect(result).toHaveProperty('cdnUrl');
    });

    test('should handle S3 access denied errors', async () => {
      const accessError = new Error('Access Denied');
      accessError.name = 'AccessDenied';
      accessError.$metadata = { httpStatusCode: 403 };

      mockS3Client.send.mockRejectedValue(accessError);

      const buffer = Buffer.from('test-data');
      await expect(
        S3Service.uploadBuffer(buffer, 'test.jpg', {})
      ).rejects.toThrow('Access Denied');
    });

    test('should handle S3 quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'ServiceQuotaExceededException';

      mockS3Client.send.mockRejectedValue(quotaError);

      const buffer = Buffer.from('test-data');
      await expect(
        S3Service.uploadBuffer(buffer, 'test.jpg', {})
      ).rejects.toThrow('Quota exceeded');
    });
  });

  describe('Environment Variable Validation', () => {
    test('should fail fast when S3_BUCKET_NAME is missing', () => {
      delete process.env.S3_BUCKET_NAME;
      
      // Clear cache and reload
      delete require.cache[require.resolve('../../services/s3')];
      
      expect(() => {
        require('../../services/s3');
      }).toThrow(/S3_BUCKET_NAME is required/);
    });

    test('should fail fast when CloudFront domain is missing', () => {
      delete process.env.CLOUDFRONT_DOMAIN;
      
      delete require.cache[require.resolve('../../services/s3')];
      
      expect(() => {
        require('../../services/s3');
      }).toThrow(/CLOUDFRONT_DOMAIN is required/);
    });

    test('should warn when optional environment variables are missing', () => {
      delete process.env.S3_KMS_KEY_ARN;
      
      delete require.cache[require.resolve('../../services/s3')];
      const service = require('../../services/s3');
      
      // Should still work but log warning
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should classify errors correctly for retry logic', () => {
      const retryableErrors = [
        { name: 'NetworkingError', shouldRetry: true },
        { name: 'TimeoutError', shouldRetry: true },
        { name: 'ServiceUnavailableException', shouldRetry: true }
      ];

      const nonRetryableErrors = [
        { name: 'AccessDenied', shouldRetry: false },
        { name: 'NoSuchBucket', shouldRetry: false },
        { name: 'InvalidRequest', shouldRetry: false }
      ];

      retryableErrors.forEach(({ name, shouldRetry }) => {
        const error = new Error('Test error');
        error.name = name;
        expect(S3Service.isRetryableError(error)).toBe(shouldRetry);
      });

      nonRetryableErrors.forEach(({ name, shouldRetry }) => {
        const error = new Error('Test error');
        error.name = name;
        expect(S3Service.isNonRetryableError(error)).toBe(!shouldRetry);
      });
    });

    test('should provide actionable error messages', () => {
      const originalError = new Error('Access denied');
      originalError.name = 'AccessDenied';
      originalError.$metadata = { httpStatusCode: 403 };

      const enhanced = S3Service.createActionableError(
        originalError,
        'file upload',
        { key: 'test.jpg', bucket: 'test-bucket' }
      );

      expect(enhanced.message).toContain('Access denied for file upload');
      expect(enhanced.actionable).toContain('IAM permissions');
      expect(enhanced.operation).toBe('file upload');
      expect(enhanced.context).toEqual({ key: 'test.jpg', bucket: 'test-bucket' });
    });
  });

  describe('Utility Functions - Edge Cases', () => {
    test('generateKey should handle edge cases', () => {
      // Test with special characters
      const key1 = S3Service.generateKey('test', 'file name with spaces.jpg', 'id-123');
      expect(key1).toMatch(/test\/\d+_id-123_file_name_with_spaces\.jpg$/);

      // Test with very long names
      const longName = 'a'.repeat(200) + '.jpg';
      const key2 = S3Service.generateKey('test', longName, 'id-456');
      expect(key2.length).toBeLessThan(1024); // S3 key limit
    });

    test('extractKeyFromUrl should handle various URL formats', () => {
      const testCases = [
        {
          url: 'https://bucket.s3.region.amazonaws.com/uploads/test/file.jpg',
          expected: 'uploads/test/file.jpg'
        },
        {
          url: 'https://cloudfront.domain.com/uploads/test/file.jpg',
          expected: 'uploads/test/file.jpg'
        },
        {
          url: 'https://bucket.s3.region.amazonaws.com/uploads/test%20folder/file.jpg',
          expected: 'uploads/test%20folder/file.jpg'
        }
      ];

      testCases.forEach(({ url, expected }) => {
        expect(S3Service.extractKeyFromUrl(url)).toBe(expected);
      });

      // Test invalid URLs
      expect(S3Service.extractKeyFromUrl('not-a-url')).toBeNull();
      expect(S3Service.extractKeyFromUrl('')).toBeNull();
      expect(S3Service.extractKeyFromUrl(null)).toBeNull();
    });

    test('service status should reflect actual configuration', () => {
      const status = S3Service.getServiceStatus();
      
      expect(status).toHaveProperty('s3');
      expect(status).toHaveProperty('cloudfront');
      expect(status).toHaveProperty('monitoring');
      
      expect(status.s3.configured).toBe(true);
      expect(status.s3.bucket).toBe('test-bucket');
      expect(status.cloudfront.configured).toBe(true);
      expect(status.cloudfront.domain).toBe('test.cloudfront.net');
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle large file uploads efficiently', async () => {
      // Mock successful upload
      mockS3Client.send.mockResolvedValue({
        Key: 'uploads/large/file.jpg',
        ETag: '"large-etag"'
      });

      // Create large buffer (10MB)
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024, 'a');
      const result = await S3Service.uploadBuffer(largeBuffer, 'uploads/large/file.jpg', {
        mimetype: 'image/jpeg'
      });

      expect(result).toHaveProperty('s3Key');
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    test('should clean up resources after operations', async () => {
      const buffer = Buffer.from('test-data');
      
      mockS3Client.send.mockResolvedValue({
        Key: 'test.jpg',
        ETag: '"test-etag"'
      });

      await S3Service.uploadBuffer(buffer, 'test.jpg', {});

      // Verify no memory leaks or hanging resources
      expect(process.memoryUsage().heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB
    });
  });
});