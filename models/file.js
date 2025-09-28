"use strict";

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FileSchema = Schema({
  title: String,
  titleEng: String,
  location: String, // Legacy field - still used for local file fallback
  s3Key: String, // S3 key for file deletion and management
  cdnUrl: String, // CloudFront CDN URL for fast content delivery
  size: String,
  type: String,
  checksums: {
    etag: String, // S3 ETag for integrity verification
    sha256: String, // Optional SHA256 hash for additional verification
  },
  metadata: {
    mimeType: String, // MIME type of the file
    dimensions: {
      width: Number,
      height: Number,
    }, // For images and videos
    duration: Number, // For audio and video files (in seconds)
    compressionRatio: Number, // Compression ratio if processed
    originalSize: Number, // Original file size before processing
    processedSize: Number, // File size after compression/optimization
  }
}, {
  timestamps: true // Add createdAt and updatedAt fields
});

// Create indexes for efficient queries
FileSchema.index({ s3Key: 1 }, { sparse: true, unique: true });
FileSchema.index({ 'checksums.etag': 1 }, { sparse: true });
FileSchema.index({ 'metadata.mimeType': 1 });
FileSchema.index({ createdAt: -1 });
FileSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("File", FileSchema);
