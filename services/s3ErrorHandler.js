/**
 * S3 Upload Error Handling Middleware
 * Provides consistent error handling for stream-based S3 uploads
 */

// S3UploadError class defined at bottom of file

class S3ErrorHandler {
  /**
   * Handle S3 upload errors with appropriate HTTP responses
   * @param {Error} error - The error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static handleUploadError(error, req, res, next) {
    console.error('S3 Upload Error:', {
      message: error.message,
      stack: error.stack,
      route: req.route?.path,
      method: req.method,
      body: req.body,
      files: req.files?.map(f => ({ 
        originalname: f.originalname, 
        mimetype: f.mimetype, 
        size: f.size 
      }))
    });

    // Handle specific S3 errors
    if (error.name === 'NoSuchBucket') {
      return res.status(500).json({
        status: 'error',
        message: 'S3 bucket configuration error.',
        code: 'BUCKET_NOT_FOUND',
        details: 'The configured S3 bucket does not exist.'
      });
    }

    if (error.name === 'AccessDenied') {
      return res.status(500).json({
        status: 'error',
        message: 'S3 access denied.',
        code: 'ACCESS_DENIED',
        details: 'Check AWS credentials and bucket permissions.'
      });
    }

    // Handle network/connection errors
    if (error.code === 'NetworkingError' || error.code === 'TimeoutError') {
      return res.status(503).json({
        status: 'error',
        message: 'Service temporarily unavailable.',
        code: 'NETWORK_ERROR',
        details: 'Unable to connect to S3. Please try again later.'
      });
    }

    // Handle file validation errors
    if (error.message.includes('Invalid file extension') || 
        error.message.includes('extensión del archivo no es válida')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid file type.',
        code: 'INVALID_FILE_TYPE',
        details: error.message
      });
    }

    if (error.message.includes('File too large') || 
        error.message.includes('archivo es demasiado grande')) {
      return res.status(413).json({
        status: 'error',
        message: 'File too large.',
        code: 'FILE_TOO_LARGE',
        details: error.message
      });
    }

    // Handle buffer/memory errors
    if (error.message.includes('No file buffer') || 
        error.message.includes('buffer')) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid file upload.',
        code: 'INVALID_BUFFER',
        details: 'File could not be processed from memory buffer.'
      });
    }

    // Handle CloudFront invalidation errors (non-critical)
    if (error.message.includes('CloudFront') || error.message.includes('invalidation')) {
      console.warn('CloudFront invalidation error (non-critical):', error.message);
      // Don't fail the upload for invalidation errors
      return next();
    }

    // Handle image optimization errors
    if (error.message.includes('Sharp') || error.message.includes('optimization')) {
      return res.status(500).json({
        status: 'error',
        message: 'Image processing failed.',
        code: 'IMAGE_PROCESSING_ERROR',
        details: 'Could not optimize image. Try uploading a different format.'
      });
    }

    // Handle database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Database validation error.',
        code: 'VALIDATION_ERROR',
        details: error.message
      });
    }

    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      return res.status(500).json({
        status: 'error',
        message: 'Database error.',
        code: 'DATABASE_ERROR',
        details: 'Failed to save file information to database.'
      });
    }

    // Generic S3 service errors
    if (error.message.includes('S3') || error.message.includes('AWS')) {
      return res.status(500).json({
        status: 'error',
        message: 'Cloud storage error.',
        code: 'S3_ERROR',
        details: 'Failed to upload file to cloud storage.'
      });
    }

    // Default error handling
    return res.status(500).json({
      status: 'error',
      message: 'Upload failed.',
      code: 'UPLOAD_ERROR',
      details: error.message || 'An unexpected error occurred during file upload.'
    });
  }

  /**
   * Validate upload prerequisites
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static validateUploadPrerequisites(req, res, next) {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded.',
        code: 'NO_FILES',
        details: 'At least one file must be provided for upload.'
      });
    }

    // Check if files have buffers (indicating memory storage)
    const hasBuffers = req.files.every(file => file.buffer && file.buffer.length > 0);
    if (!hasBuffers) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid file upload configuration.',
        code: 'NO_BUFFER',
        details: 'Files must be uploaded using memory storage.'
      });
    }

    // Check for empty files
    const emptyFiles = req.files.filter(file => file.size === 0 || file.buffer.length === 0);
    if (emptyFiles.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Empty files detected.',
        code: 'EMPTY_FILES',
        details: `${emptyFiles.length} empty file(s) cannot be uploaded.`
      });
    }

    next();
  }

  /**
   * Async error handler wrapper
   * @param {Function} asyncFn - Async function to wrap
   * @returns {Function} Express middleware function
   */
  static asyncHandler(asyncFn) {
    return (req, res, next) => {
      Promise.resolve(asyncFn(req, res, next))
        .catch(error => this.handleUploadError(error, req, res, next));
    };
  }

  /**
   * Stream error handler for real-time upload errors
   * @param {Object} stream - Upload stream
   * @param {Function} callback - Error callback
   */
  static handleStreamError(stream, callback) {
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      
      if (error.code === 'ECONNRESET') {
        callback(new Error('Connection reset during upload. Please try again.'));
      } else if (error.code === 'ETIMEDOUT') {  
        callback(new Error('Upload timeout. The file may be too large or connection is slow.'));
      } else if (error.code === 'EPIPE') {
        callback(new Error('Upload connection broken. Please try again.'));
      } else {
        callback(error);
      }
    });
  }

  /**
   * Create upload progress tracker
   * @param {number} totalSize - Total file size
   * @param {Function} onProgress - Progress callback
   * @returns {Object} Progress tracker
   */
  static createProgressTracker(totalSize, onProgress) {
    let uploadedBytes = 0;
    
    return {
      update: (chunkSize) => {
        uploadedBytes += chunkSize;
        const progress = Math.round((uploadedBytes / totalSize) * 100);
        onProgress(progress, uploadedBytes, totalSize);
      },
      getProgress: () => Math.round((uploadedBytes / totalSize) * 100),
      getRemainingBytes: () => totalSize - uploadedBytes
    };
  }
}

/**
 * Custom S3 Upload Error class
 */
class S3UploadError extends Error {
  constructor(message, code, statusCode = 500, details = null) {
    super(message);
    this.name = 'S3UploadError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = {
  S3ErrorHandler,
  S3UploadError
};