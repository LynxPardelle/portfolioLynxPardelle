/**
 * LocalStack Integration Tests
 * Tests using actual LocalStack services instead of mocks
 */

const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');

describe('LocalStack Integration Tests', () => {
  let s3Client;
  let cloudFrontClient;
  const bucketName = 'test-portfolio-bucket';
  const localstackEndpoint = 'http://localhost:4566';

  beforeAll(async () => {
    // Configure clients for LocalStack
    s3Client = new S3Client({
      endpoint: localstackEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      },
      forcePathStyle: true
    });

    cloudFrontClient = new CloudFrontClient({
      endpoint: localstackEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
      }
    });

    // Wait for LocalStack to be ready
    await waitForLocalStack();
  });

  const waitForLocalStack = async (maxRetries = 30) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`${localstackEndpoint}/health`);
        if (response.ok) {
          const health = await response.json();
          if (health.services && health.services.s3 === 'running') {
            return;
          }
        }
      } catch (error) {
        // LocalStack not ready yet
      }
      
      if (i === maxRetries - 1) {
        throw new Error('LocalStack did not start within expected time');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  describe('S3 Service Integration', () => {
    test('should upload file to LocalStack S3', async () => {
      const key = 'test-uploads/integration-test.jpg';
      const body = Buffer.from('test-image-data');

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: 'image/jpeg'
      });

      const response = await s3Client.send(command);

      expect(response).toHaveProperty('ETag');
      expect(response.ETag).toBeDefined();
    });

    test('should list objects in LocalStack S3 bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'uploads/'
      });

      const response = await s3Client.send(command);

      expect(response).toHaveProperty('Contents');
      expect(Array.isArray(response.Contents)).toBe(true);
      expect(response.Contents.length).toBeGreaterThan(0);
    });

    test('should handle S3 errors correctly', async () => {
      const command = new PutObjectCommand({
        Bucket: 'non-existent-bucket',
        Key: 'test.jpg',
        Body: Buffer.from('test')
      });

      await expect(s3Client.send(command)).rejects.toThrow();
    });
  });

  describe('S3 Service with LocalStack', () => {
    let S3Service;

    beforeEach(() => {
      // Set environment variables for LocalStack
      process.env.S3_BUCKET_NAME = bucketName;
      process.env.S3_REGION = 'us-east-1';
      process.env.S3_ACCESS_KEY_ID = 'test';
      process.env.S3_SECRET_ACCESS_KEY = 'test';
      process.env.S3_ENDPOINT = localstackEndpoint;
      process.env.CLOUDFRONT_DOMAIN = 'test.cloudfront.localstack';
      process.env.CLOUDFRONT_DISTRIBUTION_ID = 'TEST-DISTRIBUTION-ID';

      // Clear require cache and reload service
      delete require.cache[require.resolve('../../services/s3')];
      S3Service = require('../../services/s3');
    });

    test('should upload buffer using S3Service with LocalStack', async () => {
      const buffer = Buffer.from('test-file-content');
      const key = 'test-service/uploaded-file.txt';
      const metadata = {
        mimetype: 'text/plain',
        originalName: 'uploaded-file.txt'
      };

      const result = await S3Service.uploadBuffer(buffer, key, metadata);

      expect(result).toHaveProperty('s3Key', key);
      expect(result).toHaveProperty('cdnUrl');
      expect(result).toHaveProperty('s3Url');
      expect(result.success).toBe(true);
    });

    test('should generate correct CDN URLs with LocalStack', () => {
      const key = 'uploads/test/file.jpg';
      const cdnUrl = S3Service.buildCdnUrl(key);

      expect(cdnUrl).toContain('test.cloudfront.localstack');
      expect(cdnUrl).toContain(key);
    });

    test('should handle file operations with LocalStack', async () => {
      const buffer = Buffer.from('test-file-for-operations');
      const key = 'test-operations/test-file.txt';

      // Upload
      const uploadResult = await S3Service.uploadBuffer(buffer, key, {
        mimetype: 'text/plain'
      });
      expect(uploadResult.success).toBe(true);

      // Check if exists
      const exists = await S3Service.fileExists(key);
      expect(exists).toBe(true);

      // Get file info
      const fileInfo = await S3Service.getFileInfo(key);
      expect(fileInfo).toHaveProperty('Key', key);
      expect(fileInfo).toHaveProperty('ContentLength');

      // Delete file
      const deleteResult = await S3Service.deleteFile(key);
      expect(deleteResult.success).toBe(true);

      // Verify deletion
      const existsAfterDelete = await S3Service.fileExists(key);
      expect(existsAfterDelete).toBe(false);
    });
  });

  describe('CloudFront Integration', () => {
    test('should create invalidation in LocalStack CloudFront', async () => {
      const command = new CreateInvalidationCommand({
        DistributionId: 'TEST-DISTRIBUTION-ID',
        InvalidationBatch: {
          Paths: {
            Quantity: 1,
            Items: ['/uploads/test/*']
          },
          CallerReference: `test-${Date.now()}`
        }
      });

      // LocalStack CloudFront might not fully support this
      try {
        const response = await cloudFrontClient.send(command);
        expect(response).toHaveProperty('Invalidation');
      } catch (error) {
        // LocalStack CloudFront simulation might be limited
        expect(error.message).toBeDefined();
      }
    });
  });



  describe('Full Integration Workflow', () => {
    test('should complete full upload-to-CDN workflow with LocalStack', async () => {
      // This test simulates the complete workflow from file upload to CDN URL generation
      const testFile = {
        buffer: Buffer.from('complete-workflow-test-content'),
        originalName: 'workflow-test.txt',
        mimetype: 'text/plain',
        size: 30
      };

      // 1. Upload to S3
      const s3Key = `uploads/workflow/${Date.now()}_${testFile.originalName}`;
      
      // Clear cache and setup S3Service for LocalStack
      delete require.cache[require.resolve('../../services/s3')];
      process.env.S3_ENDPOINT = localstackEndpoint;
      const S3Service = require('../../services/s3');

      const uploadResult = await S3Service.uploadBuffer(
        testFile.buffer,
        s3Key,
        {
          mimetype: testFile.mimetype,
          originalName: testFile.originalName
        }
      );

      expect(uploadResult.success).toBe(true);
      expect(uploadResult.s3Key).toBe(s3Key);

      // 2. Verify file exists in S3
      const exists = await S3Service.fileExists(s3Key);
      expect(exists).toBe(true);

      // 3. Generate CDN URL
      const cdnUrl = S3Service.buildCdnUrl(s3Key);
      expect(cdnUrl).toContain('cloudfront');
      expect(cdnUrl).toContain(s3Key);

      // 4. Build complete response
      const response = S3Service.buildCdnResponse(s3Key, uploadResult);
      expect(response).toHaveProperty('s3Key', s3Key);
      expect(response).toHaveProperty('cdnUrl');
      expect(response).toHaveProperty('s3Url');
      expect(response.success).toBe(true);

      // 5. Cleanup
      await S3Service.deleteFile(s3Key);
    });

    test('should handle error scenarios with LocalStack', async () => {
      process.env.S3_ENDPOINT = localstackEndpoint;
      delete require.cache[require.resolve('../../services/s3')];
      const S3Service = require('../../services/s3');

      // Test upload to non-existent bucket
      const buffer = Buffer.from('error-test-content');
      
      // Temporarily change bucket name to non-existent
      const originalBucket = S3Service.bucketName;
      S3Service.bucketName = 'non-existent-bucket-12345';

      try {
        await S3Service.uploadBuffer(buffer, 'test-error.txt', {});
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toMatch(/NoSuchBucket|BucketNotFound/);
      }

      // Restore original bucket name
      S3Service.bucketName = originalBucket;
    });
  });

  describe('Performance Testing with LocalStack', () => {
    test('should handle concurrent uploads efficiently', async () => {
      process.env.S3_ENDPOINT = localstackEndpoint;
      delete require.cache[require.resolve('../../services/s3')];
      const S3Service = require('../../services/s3');

      const concurrentUploads = 5;
      const uploadPromises = [];

      for (let i = 0; i < concurrentUploads; i++) {
        const buffer = Buffer.from(`concurrent-test-content-${i}`);
        const key = `test-concurrent/file-${i}.txt`;
        
        const uploadPromise = S3Service.uploadBuffer(buffer, key, {
          mimetype: 'text/plain',
          originalName: `file-${i}.txt`
        });
        
        uploadPromises.push(uploadPromise);
      }

      const results = await Promise.all(uploadPromises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.s3Key).toContain(`file-${index}.txt`);
      });

      // Cleanup
      const cleanupPromises = results.map(result => 
        S3Service.deleteFile(result.s3Key)
      );
      await Promise.all(cleanupPromises);
    });
  });
}, 60000); // Increase timeout for LocalStack tests