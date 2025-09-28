# S3 Storage Integration

Complete guide for AWS S3 file storage and MongoDB backup integration.

## Overview

The portfolio application uses AWS S3 for:

- **File Storage**: All uploads (images, documents, media) stored in S3
- **MongoDB Backups**: Automated database backups to S3

## Configuration

### Environment Variables

```bash
# Required S3 Configuration
S3_BUCKET_NAME=your-s3-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_ENDPOINT=https://s3.amazonaws.com
S3_UPLOAD_PREFIX=uploads/

# Optional CloudFront CDN
CLOUDFRONT_DOMAIN=your-cdn-domain.com

# Backup Settings
MONGO_BACKUP_KEEP=4
```

### S3 Bucket Structure

```text
your-s3-bucket/
├── uploads/
│   ├── albums/       - Album images
│   ├── articles/     - Article images and files
│   ├── main/         - Site assets (logos, backgrounds)
│   ├── websites/     - Website screenshots
│   └── songs/        - Audio files and cover art
└── backups/          - MongoDB backup files
```

## Setup

1. **Configure S3 bucket** with public read access
2. **Set environment variables** in `.env` file
3. **Install dependencies**: `npm install`
4. **Deploy application**

### Health Check

Verify S3 integration: `GET /api/main/s3-status`

## File Storage

### How It Works

All upload endpoints (`/api/main/upload-file-*`) automatically:

1. Validate file type and size
2. Upload directly to S3
3. Store metadata in MongoDB
4. Return S3 URL for immediate use

### API Endpoints

**Upload Endpoints:**

- `POST /api/main/upload-file-album/:id`
- `POST /api/main/upload-file-main/:id`
- `POST /api/main/upload-file-song/:id/:option`
- `POST /api/article/upload-files-article/:id`

**File Endpoints:**

- `GET /api/main/get-file/:id` - Redirects to S3 URL
- `GET /api/main/s3-status` - Check S3 service health

### Key Services

**S3Service (`services/s3.js`):**

- `uploadBuffer()` - Upload file buffer to S3
- `deleteFile()` - Delete file from S3
- `generateKey()` - Create unique S3 key
- `isConfigured()` - Check S3 configuration

**Utility (`services/utility.js`):**

- `processFileUpload()` - Complete upload with validation
- `deleteFile()` - Remove file from S3 and database

## MongoDB Backups

### Features

- Weekly automated backups to S3
- Configurable retention (default: 4 backups)
- Easy restore from latest backup

### Commands

- `make backup` - Run MongoDB backup to S3
- `make backup-detached` - Run backup in background
- `make restore` - Restore from latest S3 backup

## Security & Validation

- Upload endpoints require admin authentication
- File type and size validation (50MB limit)
- Files stored with public-read access for direct serving
- Automatic cleanup of failed uploads

## Troubleshooting

**Files not uploading?**

- Check S3 environment variables in `.env`
- Verify S3 bucket exists and has proper permissions
- Check `/api/main/s3-status` endpoint

**Files not loading?**

- Verify S3 bucket has public read access
- Check file exists in S3 bucket
- Test S3 URL directly in browser

**Backup issues?**

- Verify AWS credentials have S3 write permissions
- Check S3 bucket backup/ directory exists
- Review backup logs: `make backup-logs`

## Testing

### File Uploads

1. Upload a file through admin interface
2. Verify file appears in S3 bucket
3. Check file serves correctly via `/api/main/get-file/:id`

### Backups

1. Run `make backup`
2. Check S3 bucket for backup file
3. Test restore: `make restore`
