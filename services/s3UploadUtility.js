const sharp = require('sharp');
const s3Service = require('./s3');
const File = require('../models/file');
const path = require('path');

/**
 * Enhanced S3 Upload Utility for Stream-based Uploads
 * Handles direct memory-to-S3 uploads with image optimization
 */
class S3UploadUtility {
  constructor() {
    this.imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    this.audioFormats = ['mp3', 'wav', 'flac', 'm4a', 'aac'];
    this.videoFormats = ['mp4', 'avi', 'mov', 'wmv', 'flv'];
    this.documentFormats = ['pdf', 'doc', 'docx', 'txt'];
  }

  /**
   * Process file upload from memory buffer to S3
   * @param {Object} uploadedFile - Multer file object with buffer
   * @param {string} category - File category (albums, main, articles, etc.)
   * @param {Object} metadata - Additional S3 metadata
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} File object and upload result
   */
  async processBufferUpload(uploadedFile, category, metadata = {}, options = {}) {
    const {
      maxSize = 50000000, // 50MB default
      allowedExtensions = ['png', 'gif', 'jpg', 'jpeg'],
      optimizeImages = true,
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
    } = options;

    if (!uploadedFile || !uploadedFile.buffer) {
      throw new Error('No file buffer provided');
    }

    // Check if S3 is configured
    if (!s3Service.isConfigured()) {
      throw new Error('S3 service is not properly configured. Check environment variables.');
    }

    const file_ext = this.getFileExtension(uploadedFile.mimetype, uploadedFile.originalname);
    const file_size = uploadedFile.buffer.length;
    const file_originalFileName = uploadedFile.originalname;

    try {
      // Validate file extension
      if (!allowedExtensions.includes(file_ext.toLowerCase())) {
        throw new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
      }

      // Validate file size
      if (file_size > maxSize) {
        throw new Error(`File too large. Maximum size: ${Math.round(maxSize / 1000000)}MB`);
      }

      // Parse original filename for title extraction
      const ext = path.extname(file_originalFileName);
      const baseName = path.basename(file_originalFileName, ext);

      // Create File object
      const file = new File();

      // Set file properties
      if (baseName.includes('EnglishTitle')) {
        file.title = baseName.split('EnglishTitle')[0];
        file.titleEng = baseName.split('EnglishTitle')[1];
      } else {
        file.title = baseName;
        file.titleEng = baseName;
      }
      file.type = file_ext.toLowerCase();
      file.size = file_size.toString();

      // Save file to get the ID
      const fileStored = await file.save();
      if (!fileStored) {
        throw new Error('Failed to save file to database');
      }

      // Process file buffer (optimize if image)
      let processedBuffer = uploadedFile.buffer;
      let finalMimetype = uploadedFile.mimetype;

      if (optimizeImages && this.isImageFile(file_ext)) {
        const optimizationResult = await this.optimizeImage(uploadedFile.buffer, {
          maxWidth,
          maxHeight,
          quality,
          format: file_ext.toLowerCase()
        });
        processedBuffer = optimizationResult.buffer;
        finalMimetype = optimizationResult.mimetype;
        
        // Update file size after optimization
        file.size = processedBuffer.length.toString();
        await file.save();
      }

      // Generate S3 key and upload to S3 using buffer
      const s3Key = s3Service.generateKey(category, file_originalFileName, fileStored._id.toString());
      const uploadResult = await s3Service.uploadBufferWithMonitoring(
        processedBuffer,
        s3Key,
        finalMimetype,
        {
          ...metadata,
          originalName: file_originalFileName,
          uploadedBy: 'portfolio-api',
          category: category,
          optimized: optimizeImages && this.isImageFile(file_ext) ? 'true' : 'false',
        }
      );

      // Update file location with S3 URL and CDN URL
      fileStored.location = uploadResult.location;
      fileStored.s3Key = uploadResult.key;
      
      // If CloudFront is configured, provide CDN URL
      if (s3Service.isCloudFrontConfigured()) {
        fileStored.cdnUrl = s3Service.getCdnUrl(uploadResult.key);
      }
      
      await fileStored.save();

      return {
        file: fileStored,
        uploadResult: uploadResult,
      };

    } catch (error) {
      console.error('Buffer upload error:', error);
      throw error;
    }
  }

  /**
   * Optimize image using Sharp
   * @param {Buffer} imageBuffer - Original image buffer
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized buffer and mimetype
   */
  async optimizeImage(imageBuffer, options = {}) {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 85,
      format = 'jpeg'
    } = options;

    try {
      let sharpInstance = sharp(imageBuffer);
      
      // Get image metadata
      const metadata = await sharpInstance.metadata();
      
      // Resize if necessary
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Apply format-specific optimizations
      let optimizedBuffer;
      let mimetype;

      switch (format.toLowerCase()) {
        case 'png':
          optimizedBuffer = await sharpInstance
            .png({ 
              quality: quality,
              compressionLevel: 9,
              palette: true
            })
            .toBuffer();
          mimetype = 'image/png';
          break;
        
        case 'webp':
          optimizedBuffer = await sharpInstance
            .webp({ quality: quality })
            .toBuffer();
          mimetype = 'image/webp';
          break;
        
        case 'gif':
          // For GIFs, we'll keep original to preserve animation
          optimizedBuffer = imageBuffer;
          mimetype = 'image/gif';
          break;
        
        default: // jpeg, jpg
          optimizedBuffer = await sharpInstance
            .jpeg({ 
              quality: quality,
              progressive: true,
              mozjpeg: true
            })
            .toBuffer();
          mimetype = 'image/jpeg';
          break;
      }

      const originalSize = imageBuffer.length;
      const optimizedSize = optimizedBuffer.length;
      const compressionRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2);

      console.log(`Image optimized: ${originalSize} bytes -> ${optimizedSize} bytes (${compressionRatio}% reduction)`);

      return {
        buffer: optimizedBuffer,
        mimetype: mimetype,
        originalSize: originalSize,
        optimizedSize: optimizedSize,
        compressionRatio: parseFloat(compressionRatio)
      };

    } catch (error) {
      console.warn('Image optimization failed, using original:', error.message);
      // Return original buffer if optimization fails
      return {
        buffer: imageBuffer,
        mimetype: this.getMimetypeFromFormat(format),
        originalSize: imageBuffer.length,
        optimizedSize: imageBuffer.length,
        compressionRatio: 0
      };
    }
  }

  /**
   * Get file extension from mimetype or filename
   * @param {string} mimetype - File mimetype
   * @param {string} filename - Original filename
   * @returns {string} File extension
   */
  getFileExtension(mimetype, filename) {
    // Try to get extension from mimetype first
    if (mimetype) {
      const ext = mimetype.split('/')[1];
      if (ext) return ext;
    }
    
    // Fallback to filename extension
    return path.extname(filename).toLowerCase().substring(1);
  }

  /**
   * Get mimetype from format
   * @param {string} format - File format
   * @returns {string} Mimetype
   */
  getMimetypeFromFormat(format) {
    const mimetypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'pdf': 'application/pdf'
    };
    
    return mimetypeMap[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Check if file is an image
   * @param {string} extension - File extension
   * @returns {boolean} True if image file
   */
  isImageFile(extension) {
    return this.imageFormats.includes(extension.toLowerCase());
  }

  /**
   * Check if file is audio
   * @param {string} extension - File extension
   * @returns {boolean} True if audio file
   */
  isAudioFile(extension) {
    return this.audioFormats.includes(extension.toLowerCase());
  }

  /**
   * Check if file is video
   * @param {string} extension - File extension
   * @returns {boolean} True if video file
   */
  isVideoFile(extension) {
    return this.videoFormats.includes(extension.toLowerCase());
  }

  /**
   * Check if file is document
   * @param {string} extension - File extension
   * @returns {boolean} True if document file
   */
  isDocumentFile(extension) {
    return this.documentFormats.includes(extension.toLowerCase());
  }

  /**
   * Delete file from S3 and database
   * @param {string} fileId - File document ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(fileId) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error('File not found in database');
      }

      // Delete from S3 if s3Key exists
      if (file.s3Key && s3Service.isConfigured()) {
        try {
          await s3Service.deleteFile(file.s3Key);
          
          // Invalidate CloudFront cache if configured
          if (s3Service.isCloudFrontConfigured()) {
            await s3Service.invalidateCacheWithMonitoring(file.s3Key);
          }
        } catch (s3Error) {
          console.warn('Could not delete file from S3:', s3Error.message);
        }
      }

      // Delete from database
      await File.findByIdAndDelete(fileId);

      return {
        success: true,
        deletedFile: file,
      };
    } catch (error) {
      console.error('File deletion error:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   * @param {Object} file - File object with buffer, originalname, mimetype, size
   * @param {string} category - Upload category 
   * @throws {Error} If file is invalid
   */
  validateFile(file, category) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('No file buffer provided');
    }

    const config = this.getUploadConfig(category);
    
    // Validate file size
    if (file.size > config.maxSize) {
      throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${(config.maxSize / 1024 / 1024).toFixed(0)}MB`);
    }

    // Validate file extension
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!config.allowedExtensions.includes(fileExtension)) {
      throw new Error(`La extensión del archivo no es válida. Extensiones permitidas: ${config.allowedExtensions.join(', ')}`);
    }

    return true;
  }

  /**
   * Get upload configuration for different file types
   * @param {string} category - File category
   * @returns {Object} Upload configuration
   */
  getUploadConfig(category) {
    const baseConfig = {
      maxSize: 50000000, // 50MB
      optimizeImages: true,
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
    };

    const categoryConfigs = {
      album: {
        ...baseConfig,
        allowedExtensions: ['png', 'gif', 'jpg', 'jpeg', 'webp'],
        maxSize: 50000000, // 50MB for album covers
        optimize: true,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      bookimg: {
        ...baseConfig,
        allowedExtensions: ['png', 'gif', 'jpg', 'jpeg', 'webp'],
        maxSize: 50000000, // 50MB for book images
        optimize: true,
        maxWidth: 1920,
        maxHeight: 1080,
      },
      song: {
        ...baseConfig,
        allowedExtensions: ['mp3', 'wav', 'flac', 'm4a', 'aac'],
        maxSize: 100000000, // 100MB for audio files
        optimize: false,
      },
      video: {
        ...baseConfig,
        allowedExtensions: ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'],
        maxSize: 500000000, // 500MB for videos
        optimize: false,
      },
      article: {
        ...baseConfig,
        allowedExtensions: ['png', 'gif', 'jpg', 'jpeg', 'webp', 'pdf'],
        maxSize: 20000000, // 20MB for articles
        optimize: true,
      },
      main: {
        ...baseConfig,
        allowedExtensions: ['png', 'gif', 'jpg', 'jpeg', 'webp'],
        maxSize: 15000000, // 15MB for main images
        optimize: true,
      },
      website: {
        ...baseConfig,
        allowedExtensions: ['png', 'gif', 'jpg', 'jpeg', 'webp'],
        maxSize: 50000000, // 50MB for website images
        optimize: true,
        maxWidth: 1920,
        maxHeight: 1080,
      },
    };

    return categoryConfigs[category] || baseConfig;
  }
}

module.exports = new S3UploadUtility();