const fs = require("fs");
const path = require("path");
const s3Service = require("./s3");
const s3UploadUtility = require("./s3UploadUtility");
const File = require("../models/file");

var utility = {
  Harshify(length) {
    var result = '';
    var characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -+/*%$#!&/()=.,{}´+¨*[]:;_¡?¿|°';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  },

  /**
   * Process file upload to S3 with validation (S3-only)
   * @param {Object} uploadedFile - Multer file object
   * @param {string} category - File category (albums, main, articles, etc.)
   * @param {Object} metadata - Additional S3 metadata
   * @param {Object} options - Upload options (maxSize, allowedExtensions)
   * @returns {Promise<Object>} File object and upload result
   */
  async processFileUpload(uploadedFile, category, metadata = {}, options = {}) {
    // S3-only strategy - always use buffer upload
    if (!uploadedFile.buffer) {
      throw new Error('S3-only strategy requires memory storage. File buffer not available.');
    }
    return await this.processBufferUpload(uploadedFile, category, metadata, options);
  },

  /**
   * Process file upload from memory buffer to S3 (NEW - streaming method)
   * @param {Object} uploadedFile - Multer file object with buffer
   * @param {string} category - File category (albums, main, articles, etc.)
   * @param {Object} metadata - Additional S3 metadata
   * @param {Object} options - Upload options (maxSize, allowedExtensions)
   * @returns {Promise<Object>} File object and upload result
   */
  async processBufferUpload(uploadedFile, category, metadata = {}, options = {}) {
    // Use the new S3 upload utility for buffer-based uploads
    const config = s3UploadUtility.getUploadConfig(category);
    const mergedOptions = { ...config, ...options };
    
    return await s3UploadUtility.processBufferUpload(uploadedFile, category, metadata, mergedOptions);
  },

  /**
   * Process file upload to S3 with validation (Legacy disk-based method)
   * @param {Object} uploadedFile - Multer file object
   * @param {string} category - File category (albums, main, articles, etc.)
   * @param {Object} metadata - Additional S3 metadata
   * @param {Object} options - Upload options (maxSize, allowedExtensions)
   * @returns {Promise<Object>} File object and upload result
   */
  async processLegacyFileUpload(uploadedFile, category, metadata = {}, options = {}) {
    const {
      maxSize = 50000000, // 50MB default
      allowedExtensions = ["png", "gif", "jpg", "jpeg"],
    } = options;

    if (!uploadedFile) {
      throw new Error("No file uploaded");
    }

    // Check if S3 is configured
    if (!s3Service.isConfigured()) {
      throw new Error("S3 service is not properly configured. Check environment variables.");
    }

    const file_ext = uploadedFile.mimetype.split("/")[1];
    const file_size = uploadedFile.size;
    const file_path = uploadedFile.path;
    const file_originalFileName = uploadedFile.originalname;

    try {
      // Validate file extension
      if (!allowedExtensions.includes(file_ext)) {
        throw new Error(`La extensión del archivo no es válida. Extensiones permitidas: ${allowedExtensions.join(", ")}`);
      }

      // Validate file size
      if (file_size > maxSize) {
        throw new Error(`El archivo es demasiado grande. (tamaño máximo permitido = ${Math.round(maxSize / 1000000)}MB)`);
      }

      // Parse original filename for title extraction
      const ext = path.extname(file_originalFileName);
      const baseName = path.basename(file_originalFileName, ext);
      
      // Create File object
      const file = new File();
      
      // Set file properties
      if (baseName.includes("EnglishTitle")) {
        file.title = baseName.split("EnglishTitle")[0];
        file.titleEng = baseName.split("EnglishTitle")[1];
      } else {
        file.title = baseName;
        file.titleEng = baseName;
      }
      file.type = file_ext;
      file.size = file_size.toString();

      // Save file to get the ID
      const fileStored = await file.save();
      if (!fileStored) {
        throw new Error("El archivo NO se ha guardado en la base de datos.");
      }

      // Generate S3 key and upload to S3 using buffer (no local file required)
      const s3Key = s3Service.generateKey(category, file_originalFileName, fileStored._id.toString());
      
      // Read file content into buffer for streaming upload
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(file_path);
      
      const uploadResult = await s3Service.uploadBuffer(
        fileBuffer,
        s3Key,
        uploadedFile.mimetype,
        {
          ...metadata,
          originalName: file_originalFileName,
          uploadedBy: "portfolio-api",
          category: category,
        }
      );

      // Update file with S3 URL and enhanced metadata
      fileStored.location = uploadResult.location; // Keep for backwards compatibility
      fileStored.s3Key = uploadResult.key;
      fileStored.cdnUrl = s3Service.buildCdnUrl(uploadResult.key);
      
      // Add checksums for integrity verification
      if (uploadResult.etag) {
        fileStored.checksums = {
          etag: uploadResult.etag.replace(/"/g, ''), // Remove quotes from ETag
          sha256: uploadResult.sha256 || null
        };
      }
      
      // Add enhanced metadata
      fileStored.metadata = {
        mimeType: uploadedFile.mimetype,
        originalSize: file_size,
        processedSize: uploadResult.contentLength || file_size,
        compressionRatio: uploadResult.compressionRatio || 0,
        uploadedAt: new Date().toISOString(),
        category: category,
        ...metadata
      };
      
      await fileStored.save();

      return {
        file: fileStored,
        uploadResult: uploadResult,
      };

    } catch (error) {
      // Clean up local file in case of error (only for legacy disk uploads)
      try {
        if (file_path && fs.existsSync(file_path)) {
          fs.unlinkSync(file_path);
        }
      } catch (unlinkErr) {
        console.warn("Could not delete temporary file:", unlinkErr.message);
      }
      throw error;
    }
  },

  /**
   * Delete file from S3 and database
   * @param {string} fileId - File document ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFile(fileId) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error("File not found in database");
      }

      // Delete from S3 if s3Key exists
      if (file.s3Key && s3Service.isConfigured()) {
        try {
          await s3Service.deleteFile(file.s3Key);
        } catch (s3Error) {
          console.warn("Could not delete file from S3:", s3Error.message);
        }
      }

      // Delete from database
      await File.findByIdAndDelete(fileId);

      return {
        success: true,
        deletedFile: file,
      };
    } catch (error) {
      console.error("File deletion error:", error);
      throw error;
    }
  },

}

module.exports = utility;