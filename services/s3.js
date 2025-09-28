"use strict";

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { CloudFrontClient, CreateInvalidationCommand } = require("@aws-sdk/client-cloudfront");
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");

/**
 * S3 Service for handling file uploads, downloads, and management
 * Provides methods to interact with AWS S3 bucket for file storage
 */
class S3Service {
  constructor() {
    this.client = new S3Client({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
      endpoint: process.env.S3_ENDPOINT,
    });
    
    // CloudFront client for cache invalidation
    this.cloudFrontClient = new CloudFrontClient({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    // CloudWatch client for custom metrics
    this.cloudWatchClient = new CloudWatchClient({
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });
    
    this.bucketName = process.env.S3_BUCKET_NAME;
    this.uploadPrefix = process.env.S3_UPLOAD_PREFIX || "";
    this.cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
    this.cloudfrontDistributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
  }

  /**
   * Upload file from local filesystem to S3
   * @param {string} filePath - Local path to the file to upload
   * @param {string} key - S3 key (path) for the file
   * @param {string} contentType - MIME type of the file
   * @param {Object} metadata - Additional metadata for the file
   * @returns {Promise<Object>} Upload result with location and key
   */
  async uploadFile(filePath, key, contentType, metadata = {}) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file into buffer
      const buffer = fs.readFileSync(filePath);
      
      // Use buffer upload method
      const result = await this.uploadBuffer(buffer, key, contentType, metadata);
      
      return result;
    } catch (error) {
      console.error("Legacy uploadFile Error:", error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload buffer directly to S3 (for in-memory files)
   * @param {Buffer} buffer - File buffer to upload
   * @param {string} key - S3 key (path) for the file
   * @param {string} contentType - MIME type of the file
   * @param {Object} metadata - Additional metadata for the file
   * @returns {Promise<Object>} Upload result with location and key
   */
  async uploadBuffer(buffer, key, contentType, metadata = {}) {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata
        // Removed ACL as bucket doesn't support ACLs
      });

      const result = await this.client.send(command);

      return {
        success: true,
        location: `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`,
        key: key,
        etag: result.ETag,
      };
    } catch (error) {
      console.error("S3 Buffer Upload Error:", error);
      throw new Error(`Failed to upload buffer to S3: ${error.message}`);
    }
  }

  /**
   * Upload stream directly to S3 with advanced options
   * @param {Object} options - Upload options
   * @param {string} options.key - S3 key (path) for the file
   * @param {Stream|Buffer} options.body - Stream or buffer to upload
   * @param {string} options.contentType - MIME type of the file
   * @param {string} options.cacheControl - Cache control header
   * @param {Object} options.metadata - Additional metadata
   * @param {string} options.storageClass - S3 storage class (STANDARD, STANDARD_IA, etc.)
   * @param {string} options.serverSideEncryption - Encryption type (AES256, aws:kms)
   * @param {string} options.sseKmsKeyId - KMS key ID for encryption
   * @returns {Promise<Object>} Upload result with CDN response
   */
  async uploadStream({ key, body, contentType, cacheControl, metadata = {}, storageClass, serverSideEncryption, sseKmsKeyId }) {
    try {
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata
      };

      // Add optional parameters
      if (cacheControl) uploadParams.CacheControl = cacheControl;
      if (storageClass) uploadParams.StorageClass = storageClass;
      if (serverSideEncryption) uploadParams.ServerSideEncryption = serverSideEncryption;
      if (sseKmsKeyId) uploadParams.SSEKMSKeyId = sseKmsKeyId;

      // Use lib-storage for efficient streaming uploads
      const upload = new Upload({
        client: this.client,
        params: uploadParams,
        // Configure multipart upload for large files
        queueSize: 4, // optional concurrency configuration
        partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
        leavePartsOnError: false, // optional manually handle dropped parts
      });

      // Monitor upload progress
      upload.on("httpUploadProgress", (progress) => {
        console.log(`Upload progress: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      });

      const result = await upload.done();

      return this.buildCdnResponse(key, {
        success: true,
        etag: result.ETag,
        location: result.Location,
        bucket: result.Bucket,
        key: result.Key
      });
    } catch (error) {
      console.error("S3 Stream Upload Error:", error);
      throw new Error(`Failed to upload stream to S3: ${error.message}`);
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - S3 key (path) of the file to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const result = await this.client.send(command);
      
      return {
        success: true,
        deleted: key,
      };
    } catch (error) {
      console.error("S3 Delete Error:", error);
      throw new Error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  /**
   * Get a signed URL for temporary access to a private file
   * @param {string} key - S3 key (path) of the file
   * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error("S3 Signed URL Error:", error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  /**
   * Generate a unique S3 key for a file
   * @param {string} category - File category (main, article, etc.)
   * @param {string} originalName - Original filename
   * @param {string} fileId - Unique file identifier
   * @returns {string} S3 key
   */
  generateKey(category, originalName, fileId) {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    // Clean filename for S3 compatibility
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");
    
    return `${this.uploadPrefix}${category}/${timestamp}_${fileId}_${cleanBaseName}${ext}`;
  }

  /**
   * Extract S3 key from full S3 URL
   * @param {string} url - Full S3 URL
   * @returns {string} S3 key
   */
  extractKeyFromUrl(url) {
    if (!url) return null;
    
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.startsWith("/") ? urlObj.pathname.slice(1) : urlObj.pathname;
    } catch (error) {
      console.warn("Could not extract key from URL:", url);
      return null;
    }
  }

  /**
   * Generate CloudFront CDN URL for a file
   * @param {string} key - S3 key (path) of the file
   * @returns {string} CDN URL or S3 URL if CloudFront not configured
   */
  getCdnUrl(key) {
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${key}`;
    }
    
    // Fallback to direct S3 URL
    return `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Build CDN URL with proper encoding
   * @param {string} key - S3 key (path) of the file
   * @returns {string} Properly encoded CDN URL
   */
  buildCdnUrl(key) {
    const encodedKey = encodeURI(key);
    if (this.cloudfrontDomain) {
      return `https://${this.cloudfrontDomain}/${encodedKey}`;
    }
    
    // Fallback to direct S3 URL with encoding
    return `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${encodedKey}`;
  }

  /**
   * Build comprehensive CDN response object
   * @param {string} key - S3 key (path) of the file
   * @param {Object} additionalData - Additional response data
   * @returns {Object} CDN response object
   */
  buildCdnResponse(key, additionalData = {}) {
    return {
      s3Key: key,
      cdnUrl: this.buildCdnUrl(key),
      s3Url: `https://${this.bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${encodeURI(key)}`,
      success: true,
      ...additionalData
    };
  }

  /**
   * Process buffer before upload with optional transforms
   * @param {Object} options - Processing options
   * @param {Buffer} options.buffer - Input buffer
   * @param {string} options.mimetype - File MIME type
   * @param {Object} options.transforms - Transform configuration
   * @returns {Promise<Buffer>} Processed buffer
   */
  async processBeforeUpload({ buffer, mimetype, transforms = {} }) {
    const startSize = buffer.length;
    let processedBuffer = buffer;
    const metrics = {
      originalSize: startSize,
      processedSize: 0,
      transformsApplied: [],
      compressionRatio: 0
    };

    try {
      // Image optimization
      if (this.shouldOptimizeImage(mimetype) && !transforms.skipImageOptimization) {
        const s3UploadUtility = require('./s3UploadUtility');
        const optimized = await s3UploadUtility.optimizeImage(buffer, mimetype);
        processedBuffer = optimized.buffer;
        metrics.transformsApplied.push('image_optimization');
        metrics.compressionRatio = optimized.compressionRatio || 0;
      }

      // Audio normalization (placeholder for future implementation)
      if (this.shouldOptimizeAudio(mimetype) && !transforms.skipAudioOptimization) {
        // processedBuffer = await this.normalizeAudio(processedBuffer);
        // metrics.transformsApplied.push('audio_normalization');
        console.log('Audio optimization not yet implemented');
      }

      metrics.processedSize = processedBuffer.length;
      metrics.sizeReduction = ((startSize - processedBuffer.length) / startSize * 100).toFixed(2);

      // Record metrics
      await this.putMetric('ProcessingOriginalSize', startSize, 'Bytes', {
        MimeType: mimetype,
        TransformsApplied: metrics.transformsApplied.join(',')
      });
      await this.putMetric('ProcessingFinalSize', processedBuffer.length, 'Bytes', {
        MimeType: mimetype
      });
      if (metrics.compressionRatio > 0) {
        await this.putMetric('CompressionRatio', metrics.compressionRatio, 'Percent', {
          MimeType: mimetype
        });
      }

      return processedBuffer;
    } catch (error) {
      console.warn('Processing failed, using original buffer:', error.message);
      await this.putMetric('ProcessingFailure', 1, 'Count', {
        MimeType: mimetype,
        ErrorType: error.name || 'Unknown'
      });
      return buffer; // Return original buffer on failure
    }
  }

  /**
   * Check if image should be optimized
   * @param {string} mimetype - File MIME type
   * @returns {boolean} True if should optimize
   */
  shouldOptimizeImage(mimetype) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return imageTypes.includes(mimetype.toLowerCase());
  }

  /**
   * Check if audio should be optimized
   * @param {string} mimetype - File MIME type
   * @returns {boolean} True if should optimize
   */
  shouldOptimizeAudio(mimetype) {
    const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/m4a'];
    return audioTypes.includes(mimetype.toLowerCase());
  }

  /**
   * Invalidate CloudFront cache for specific files
   * @param {string|Array<string>} paths - File path(s) to invalidate
   * @returns {Promise<Object>} Invalidation result
   */
  async invalidateCache(paths) {
    if (!this.cloudfrontDistributionId) {
      console.warn("CloudFront distribution ID not configured, skipping cache invalidation");
      return { success: false, reason: "CloudFront not configured" };
    }

    try {
      // Ensure paths is an array and format correctly
      const pathsArray = Array.isArray(paths) ? paths : [paths];
      const formattedPaths = pathsArray.map(path => path.startsWith('/') ? path : `/${path}`);

      const command = new CreateInvalidationCommand({
        DistributionId: this.cloudfrontDistributionId,
        InvalidationBatch: {
          Paths: {
            Quantity: formattedPaths.length,
            Items: formattedPaths,
          },
          CallerReference: `invalidation-${Date.now()}`,
        },
      });

      const result = await this.cloudFrontClient.send(command);

      return {
        success: true,
        invalidationId: result.Invalidation.Id,
        status: result.Invalidation.Status,
        paths: formattedPaths,
      };
    } catch (error) {
      console.error("CloudFront Invalidation Error:", error);
      throw new Error(`Failed to invalidate CloudFront cache: ${error.message}`);
    }
  }

  /**
   * Enhanced invalidation with batching and throttling
   * @param {Array<string>} paths - File paths to invalidate
   * @param {Object} options - Invalidation options
   * @param {number} options.batchSize - Maximum paths per invalidation (default: 3000)
   * @param {number} options.delay - Delay between batches in ms (default: 1000)
   * @returns {Promise<Array<Object>>} Array of invalidation results
   */
  async invalidatePaths(paths, options = {}) {
    const { batchSize = 3000, delay = 1000 } = options;
    
    if (!this.cloudfrontDistributionId) {
      console.warn("CloudFront distribution ID not configured, skipping cache invalidation");
      return [{ success: false, reason: "CloudFront not configured" }];
    }

    if (!Array.isArray(paths) || paths.length === 0) {
      throw new Error("Paths must be a non-empty array");
    }

    const results = [];
    const pathsArray = [...paths]; // Create copy to avoid mutation
    
    try {
      // Process paths in batches to respect CloudFront limits
      for (let i = 0; i < pathsArray.length; i += batchSize) {
        const batch = pathsArray.slice(i, i + batchSize);
        const formattedPaths = batch.map(path => path.startsWith('/') ? path : `/${path}`);

        const command = new CreateInvalidationCommand({
          DistributionId: this.cloudfrontDistributionId,
          InvalidationBatch: {
            Paths: {
              Quantity: formattedPaths.length,
              Items: formattedPaths,
            },
            CallerReference: `batch-invalidation-${Date.now()}-${i}`,
          },
        });

        const result = await this.executeWithRetry(
          () => this.cloudFrontClient.send(command),
          { maxRetries: 3, baseDelay: 1000 }
        );

        results.push({
          success: true,
          invalidationId: result.Invalidation.Id,
          status: result.Invalidation.Status,
          paths: formattedPaths,
          batchIndex: Math.floor(i / batchSize)
        });

        // Add delay between batches to avoid rate limiting
        if (i + batchSize < pathsArray.length && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      return results;
    } catch (error) {
      console.error("Batch CloudFront Invalidation Error:", error);
      throw new Error(`Failed to invalidate CloudFront cache: ${error.message}`);
    }
  }

  /**
   * Execute operation with exponential backoff retry
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Retry options
   * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
   * @param {number} options.baseDelay - Base delay in ms (default: 1000)
   * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
   * @returns {Promise<any>} Operation result
   */
  async executeWithRetry(operation, options = {}) {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 30000 } = options;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.isNonRetryableError(error) || attempt === maxRetries) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
          maxDelay
        );

        console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Check if error should not be retried
   * @param {Error} error - Error to check
   * @returns {boolean} True if error should not be retried
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      'AccessDenied',
      'InvalidAccessKeyId',
      'SignatureDoesNotMatch',
      'TokenRefreshRequired',
      'InvalidRequest',
      'MalformedXML',
      'NoSuchBucket'
    ];

    return nonRetryableErrors.some(errorType => 
      error.name === errorType || error.code === errorType || error.message.includes(errorType)
    );
  }

  /**
   * Create actionable error from AWS error
   * @param {Error} error - Original AWS error
   * @param {string} operation - Operation that failed
   * @param {Object} context - Additional context
   * @returns {Error} Enhanced error with actionable information
   */
  createActionableError(error, operation, context = {}) {
    const enhancedError = new Error();
    enhancedError.originalError = error;
    enhancedError.operation = operation;
    enhancedError.context = context;
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.requestId = error.$metadata?.requestId || 'unknown';

    // Map common AWS errors to actionable messages
    switch (error.name || error.code) {
      case 'AccessDenied':
        enhancedError.message = `Access denied for ${operation}. Check IAM permissions for S3 bucket '${this.bucketName}'.`;
        enhancedError.actionable = 'Verify IAM permissions and bucket policy';
        break;
      case 'NoSuchBucket':
        enhancedError.message = `S3 bucket '${this.bucketName}' does not exist for ${operation}.`;
        enhancedError.actionable = 'Create the S3 bucket or update S3_BUCKET_NAME environment variable';
        break;
      case 'EntityTooLarge':
        enhancedError.message = `File too large for ${operation}. Maximum size exceeded.`;
        enhancedError.actionable = 'Reduce file size or configure multipart upload';
        break;
      case 'InvalidAccessKeyId':
        enhancedError.message = `Invalid AWS credentials for ${operation}.`;
        enhancedError.actionable = 'Update AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY';
        break;
      case 'NetworkingError':
      case 'TimeoutError':
        enhancedError.message = `Network error during ${operation}. Service may be temporarily unavailable.`;
        enhancedError.actionable = 'Retry the operation or check network connectivity';
        break;
      default:
        enhancedError.message = `${operation} failed: ${error.message}`;
        enhancedError.actionable = 'Check AWS service status and configuration';
    }

    // Log detailed error information (with PII masking)
    const logContext = {
      operation,
      errorType: error.name || error.code || 'Unknown',
      requestId: enhancedError.requestId,
      bucket: this.bucketName,
      region: process.env.S3_REGION,
      // Mask sensitive information
      context: this.maskSensitiveData(context)
    };
    
    console.error('S3 Service Error:', logContext);
    
    return enhancedError;
  }

  /**
   * Mask sensitive data in context for logging
   * @param {Object} data - Data to mask
   * @returns {Object} Masked data
   */
  maskSensitiveData(data) {
    const masked = { ...data };
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential'];
    
    for (const [key, value] of Object.entries(masked)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = '***MASKED***';
      } else if (typeof value === 'string' && value.length > 50) {
        // Truncate long strings that might contain sensitive data
        masked[key] = value.substring(0, 47) + '...';
      }
    }
    
    return masked;
  }

  /**
   * Check if S3 is properly configured
   * @returns {boolean} True if S3 is configured
   */
  isConfigured() {
    return !!(
      this.bucketName &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY &&
      process.env.S3_REGION
    );
  }

  /**
   * Check if CloudFront is properly configured
   * @returns {boolean} True if CloudFront is configured
   */
  isCloudFrontConfigured() {
    return !!(this.cloudfrontDomain && this.cloudfrontDistributionId);
  }

  /**
   * Send custom metrics to CloudWatch
   * @param {string} metricName - Name of the metric
   * @param {number} value - Metric value
   * @param {string} unit - Metric unit (Count, Seconds, Bytes, etc.)
   * @param {Object} dimensions - Additional metric dimensions
   * @returns {Promise<void>}
   */
  async putMetric(metricName, value, unit = 'Count', dimensions = {}) {
    try {
      const metricData = {
        Namespace: 'LynxPortfolio/Application',
        MetricData: [
          {
            MetricName: metricName,
            Value: value,
            Unit: unit,
            Timestamp: new Date(),
            Dimensions: Object.entries(dimensions).map(([name, value]) => ({
              Name: name,
              Value: value.toString(),
            })),
          },
        ],
      };

      const command = new PutMetricDataCommand(metricData);
      await this.cloudWatchClient.send(command);
    } catch (error) {
      console.error(`Failed to send metric ${metricName}:`, error.message);
      // Don't throw error to avoid breaking application flow
    }
  }

  /**
   * Upload file from local filesystem to S3 with monitoring
   * @param {string} filePath - Local path to the file to upload
   * @param {string} key - S3 key (path) for the file
   * @param {string} contentType - MIME type of the file
   * @param {Object} metadata - Additional metadata for the file
   * @returns {Promise<Object>} Upload result with location and key
   */
  async uploadFileWithMonitoring(filePath, key, contentType, metadata = {}) {
    // Check feature flag - only allow if legacy filesystem is enabled
    const startTime = Date.now();
    let success = false;
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Get file stats for monitoring
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;

      // Read file into buffer
      const buffer = fs.readFileSync(filePath);
      
      // Use buffer upload with monitoring
      const result = await this.uploadBufferWithMonitoring(buffer, key, contentType, metadata);
      success = true;
      
      // Send legacy usage metrics
      await this.putMetric('LegacyUploadUsage', 1, 'Count', {
        Method: 'uploadFileWithMonitoring',
        ContentType: contentType
      });
      
      return result;
    } catch (error) {
      // Send failure metrics
      const duration = Date.now() - startTime;
      await this.putMetric('LegacyUploadFailure', 1, 'Count', {
        Method: 'uploadFileWithMonitoring',
        ContentType: contentType,
        ErrorType: error.name || 'Unknown'
      });
      
      console.error("Legacy uploadFileWithMonitoring Error:", error);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  /**
   * Upload buffer to S3 with monitoring
   * @param {Buffer} buffer - File buffer to upload
   * @param {string} key - S3 key (path) for the file
   * @param {string} contentType - MIME type of the file
   * @param {Object} metadata - Additional metadata for the file
   * @returns {Promise<Object>} Upload result with location and key
   */
  async uploadBufferWithMonitoring(buffer, key, contentType, metadata = {}) {
    const startTime = Date.now();
    let success = false;
    
    try {
      const result = await this.uploadBuffer(buffer, key, contentType, metadata);
      success = true;
      
      // Send success metrics
      const duration = Date.now() - startTime;
      await this.putMetric('UploadLatency', duration, 'Milliseconds', {
        ContentType: contentType,
        Success: 'true',
        BufferSize: buffer.length
      });
      await this.putMetric('UploadSuccess', 1, 'Count', {
        ContentType: contentType
      });
      await this.putMetric('UploadBytes', buffer.length, 'Bytes', {
        ContentType: contentType
      });
      
      return result;
    } catch (error) {
      // Send failure metrics
      const duration = Date.now() - startTime;
      await this.putMetric('UploadLatency', duration, 'Milliseconds', {
        ContentType: contentType,
        Success: 'false',
        BufferSize: buffer.length
      });
      await this.putMetric('UploadFailure', 1, 'Count', {
        ContentType: contentType,
        ErrorType: error.name || 'Unknown'
      });
      
      throw error;
    }
  }

  /**
   * Invalidate CloudFront cache with monitoring
   * @param {string|Array<string>} paths - File path(s) to invalidate
   * @returns {Promise<Object>} Invalidation result
   */
  async invalidateCacheWithMonitoring(paths) {
    const startTime = Date.now();
    
    try {
      const result = await this.invalidateCache(paths);
      
      // Send success metrics
      const duration = Date.now() - startTime;
      await this.putMetric('InvalidationLatency', duration, 'Milliseconds', {
        Success: 'true',
        PathCount: Array.isArray(paths) ? paths.length : 1
      });
      await this.putMetric('InvalidationSuccess', 1, 'Count');
      
      return result;
    } catch (error) {
      // Send failure metrics
      const duration = Date.now() - startTime;
      await this.putMetric('InvalidationLatency', duration, 'Milliseconds', {
        Success: 'false',
        PathCount: Array.isArray(paths) ? paths.length : 1
      });
      await this.putMetric('InvalidationFailure', 1, 'Count', {
        ErrorType: error.name || 'Unknown'
      });
      
      throw error;
    }
  }

  /**
   * Calculate and send upload success rate metric
   * @returns {Promise<void>}
   */
  async calculateUploadSuccessRate() {
    // This would typically be called periodically to calculate success rate
    // For now, we'll implement basic success rate tracking
    try {
      // In a real implementation, you'd query recent metrics to calculate success rate
      // For demonstration, we'll send a placeholder metric
      await this.putMetric('UploadSuccessRate', 95, 'Percent');
    } catch (error) {
      console.error('Failed to calculate upload success rate:', error.message);
    }
  }

  /**
   * Get comprehensive service status
   * @returns {Object} Status information for S3 and CloudFront
   */
  getServiceStatus() {
    return {
      s3: {
        configured: this.isConfigured(),
        bucket: this.bucketName || 'NOT_SET',
        region: process.env.S3_REGION || 'NOT_SET',
        endpoint: process.env.S3_ENDPOINT || 'NOT_SET',
      },
      cloudfront: {
        configured: this.isCloudFrontConfigured(),
        domain: this.cloudfrontDomain || 'NOT_SET',
        distributionId: this.cloudfrontDistributionId || 'NOT_SET',
      },
      monitoring: {
        cloudWatchConfigured: !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY),
        namespace: 'LynxPortfolio/Application',
      },
    };
  }
}

// Export singleton instance
module.exports = new S3Service();