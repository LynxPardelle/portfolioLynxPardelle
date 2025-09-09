# Environment Configuration (.env)

This document describes the key environment variables for the Lynx Pardelle Portfolio backend.

## Database
- `MONGO_PORT`: MongoDB port (default: 27017)
- `DATABASE_URL`: MongoDB connection string

## S3 Backup
- `S3_BUCKET_NAME`: S3 bucket for backups
- `S3_REGION`: S3 region
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: S3 credentials
- `S3_ENDPOINT`: Custom S3 endpoint (optional)
- `S3_UPLOAD_PREFIX`: S3 path prefix for uploads
- `MONGO_BACKUP_CRON`: Cron schedule for backups
- `MONGO_BACKUP_KEEP`: Number of weekly backups to keep

## Other
- `PORT`, `DEV_PORT`, `PROD_PORT`: App ports
- `JWT_SECRET`: JWT authentication secret
- `CORS_ORIGIN`: Allowed CORS domains

See `.env` and `.example.env` for all available options and usage notes.