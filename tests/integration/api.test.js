/**
 * Integration/API Tests
 * Supertest-based tests for upload endpoints with S3/CDN validation
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { S3Client } = require('@aws-sdk/client-s3');

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');

describe('API Integration Tests', () => {
  let app;
  let mockS3Client;

  beforeAll(async () => {
    // Setup test database connection
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test_db';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    // Clean up database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    // Setup mock S3 client
    mockS3Client = {
      send: jest.fn().mockResolvedValue({
        Key: 'uploads/test/test-file.jpg',
        Bucket: 'test-bucket',
        ETag: '"test-etag"',
        Location: 'https://test-bucket.s3.us-east-1.amazonaws.com/uploads/test/test-file.jpg'
      })
    };

    S3Client.mockImplementation(() => mockS3Client);

    // Clear require cache and setup fresh app
    delete require.cache[require.resolve('../../app')];
    delete require.cache[require.resolve('../../services/s3')];

    // Load app after mocks are set up
    app = require('../../app');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('File Upload Endpoints', () => {
    test('POST /api/main/files - should upload file and return CDN URL', async () => {
      const testFile = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, 'test-image.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('s3Key');
      expect(response.body.file).toHaveProperty('cdnUrl');
      expect(response.body.file.cdnUrl).toContain('test.cloudfront.net');
      
      // Verify S3 upload was called
      expect(mockS3Client.send).toHaveBeenCalled();
    });

    test('POST /api/main/files - should handle multiple file upload', async () => {
      const testFile1 = Buffer.from('fake-image-data-1');
      const testFile2 = Buffer.from('fake-image-data-2');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('files', testFile1, 'test-image-1.jpg')
        .attach('files', testFile2, 'test-image-2.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);
      expect(response.body.files).toHaveLength(2);
      
      response.body.files.forEach(file => {
        expect(file).toHaveProperty('s3Key');
        expect(file).toHaveProperty('cdnUrl');
      });
    });

    test('POST /api/main/files - should validate file metadata', async () => {
      const testFile = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, 'test-image.jpg')
        .expect(200);

      const file = response.body.file;
      expect(file).toHaveProperty('metadata');
      expect(file.metadata).toHaveProperty('originalName', 'test-image.jpg');
      expect(file.metadata).toHaveProperty('mimetype');
      expect(file.metadata).toHaveProperty('size');
      expect(file.metadata).toHaveProperty('encoding');
    });


  });

  describe('Error Scenarios', () => {
    test('should handle S3 access denied error', async () => {
      const s3Error = new Error('Access Denied');
      s3Error.name = 'AccessDenied';
      s3Error.$metadata = { httpStatusCode: 403 };
      
      mockS3Client.send.mockRejectedValue(s3Error);

      const testFile = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, 'test-image.jpg')
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Access Denied');
    });

    test('should handle oversized file upload', async () => {
      // Create large file (>10MB)
      const largeFile = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', largeFile, 'large-file.jpg')
        .expect(413);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('too large');
    });

    test('should handle invalid file type', async () => {
      const invalidFile = Buffer.from('<?php echo "hack"; ?>');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', invalidFile, 'malicious.php')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('file type');
    });

    test('should handle missing file in request', async () => {
      const response = await request(app)
        .post('/api/main/files')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('No file');
    });

    test('should handle S3 quota exceeded error', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'ServiceQuotaExceededException';
      
      mockS3Client.send.mockRejectedValue(quotaError);

      const testFile = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, 'test-image.jpg')
        .expect(507);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('storage quota');
    });
  });

  describe('Album Upload Endpoints', () => {
    test('POST /api/main/albums - should create album with image', async () => {
      const testImage = Buffer.from('fake-album-cover');
      
      const response = await request(app)
        .post('/api/main/albums')
        .field('name', 'Test Album')
        .field('description', 'Test album description')
        .attach('img', testImage, 'album-cover.jpg')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('album');
      expect(response.body.album).toHaveProperty('name', 'Test Album');
      expect(response.body.album).toHaveProperty('img');
      expect(response.body.album.img).toHaveProperty('cdnUrl');
    });

    test('PUT /api/main/albums/:id - should update album image', async () => {
      // First create an album
      const createResponse = await request(app)
        .post('/api/main/albums')
        .field('name', 'Test Album')
        .expect(201);

      const albumId = createResponse.body.album._id;
      const newImage = Buffer.from('new-album-cover');

      const updateResponse = await request(app)
        .put(`/api/main/albums/${albumId}`)
        .attach('img', newImage, 'new-cover.jpg')
        .expect(200);

      expect(updateResponse.body.album.img).toHaveProperty('cdnUrl');
      expect(updateResponse.body.album.img.cdnUrl).toContain('cloudfront');
    });
  });

  describe('File Retrieval Endpoints', () => {
    test('GET /api/main/files/:id - should return file with CDN URL', async () => {
      // First upload a file
      const testFile = Buffer.from('fake-image-data');
      
      const uploadResponse = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, 'test-image.jpg')
        .expect(200);

      const fileId = uploadResponse.body.file._id;

      // Then retrieve it
      const getResponse = await request(app)
        .get(`/api/main/files/${fileId}`)
        .expect(200);

      expect(getResponse.body).toHaveProperty('success', true);
      expect(getResponse.body.file).toHaveProperty('cdnUrl');
      expect(getResponse.body.file.cdnUrl).toContain('cloudfront');
    });

    test('GET /api/main/files - should list files with CDN URLs', async () => {
      const response = await request(app)
        .get('/api/main/files')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);

      if (response.body.files.length > 0) {
        response.body.files.forEach(file => {
          if (file.cdnUrl) {
            expect(file.cdnUrl).toContain('cloudfront');
          }
        });
      }
    });
  });

  describe('Health and Status Endpoints', () => {
    test('GET /health - should return healthy status with S3 info', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('s3');
      expect(response.body.services).toHaveProperty('database');
    });

    test('GET /api/main/status - should return S3 storage status', async () => {
      const response = await request(app)
        .get('/api/main/status')
        .expect(200);

      expect(response.body).toHaveProperty('s3');
      expect(response.body.s3).toHaveProperty('bucketName');
      expect(response.body.s3).toHaveProperty('region');
    });
  });

  describe('Content Type and Encoding Tests', () => {
    test('should handle different image types correctly', async () => {
      const imageTypes = [
        { buffer: Buffer.from('fake-jpeg-data'), filename: 'test.jpg', mimetype: 'image/jpeg' },
        { buffer: Buffer.from('fake-png-data'), filename: 'test.png', mimetype: 'image/png' },
        { buffer: Buffer.from('fake-gif-data'), filename: 'test.gif', mimetype: 'image/gif' },
        { buffer: Buffer.from('fake-webp-data'), filename: 'test.webp', mimetype: 'image/webp' }
      ];

      for (const { buffer, filename, mimetype } of imageTypes) {
        const response = await request(app)
          .post('/api/main/files')
          .attach('file', buffer, filename)
          .expect(200);

        expect(response.body.file.metadata).toHaveProperty('mimetype');
        expect(response.body.file).toHaveProperty('cdnUrl');
      }
    });

    test('should preserve original filename in metadata', async () => {
      const testFile = Buffer.from('fake-image-data');
      const originalName = 'My Special File (2024).jpg';
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, originalName)
        .expect(200);

      expect(response.body.file.metadata).toHaveProperty('originalName', originalName);
    });
  });

  describe('Concurrent Upload Handling', () => {
    test('should handle multiple concurrent uploads', async () => {
      const uploadPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const testFile = Buffer.from(`fake-image-data-${i}`);
        const uploadPromise = request(app)
          .post('/api/main/files')
          .attach('file', testFile, `test-image-${i}.jpg`);
        
        uploadPromises.push(uploadPromise);
      }

      const responses = await Promise.all(uploadPromises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.file).toHaveProperty('cdnUrl');
      });

      // Verify S3 was called for each upload
      expect(mockS3Client.send).toHaveBeenCalledTimes(5);
    });
  });

  describe('Legacy Fallback Behavior', () => {
    test('should fallback to legacy when S3 is unavailable', async () => {
      // Configure for hybrid mode
      process.env.USE_S3_CDN_STORAGE = 'true';
      process.env.ENABLE_LEGACY_FILESYSTEM = 'true';
      
      // Make S3 fail
      mockS3Client.send.mockRejectedValue(new Error('S3 unavailable'));

      const testFile = Buffer.from('fake-image-data');
      
      const response = await request(app)
        .post('/api/main/files')
        .attach('file', testFile, 'test-image.jpg')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.file).toHaveProperty('url'); // Legacy URL
      expect(response.body.file.fallbackMode).toBe(true);
    });
  });
});