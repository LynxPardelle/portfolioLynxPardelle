# Environment Configuration (.env)

This document describes the key environment variables for the Lynx Pardelle Portfolio backend.

## Database

- `MONGO_PORT`: MongoDB port (default: 27519)
- `MONGO_URI`: MongoDB connection string
- `MONGO_AUTH_SOURCE`: Authentication database to validate credentials against (default: `admin`).

Notes on MongoDB connection string:

- If you connect using an application user created in the `admin` database and you include a database name in the URI (e.g., `.../lynx_portfolio`), MongoDB requires an `authSource` query parameter so it knows where to verify credentials. Example:
  - `mongodb://user:pass@mongo:27519/lynx_portfolio?authSource=admin`
- This project automatically appends `?authSource=admin` at runtime if it detects credentials and a DB name but no `authSource` is present. You can override the default by setting `MONGO_AUTH_SOURCE`.

## S3 Backup

S3 is used to store automated MongoDB backups (and reserved for potential future uploads). The following variables control S3 behavior:

- `S3_BUCKET_NAME`: Name of the S3 bucket that will store backups. Example: `lynx-portfolio`.
- `S3_REGION`: AWS region of the bucket. Example: `us-east-1`. Used as `AWS_DEFAULT_REGION` by AWS CLI.
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`: IAM access keys with least-privilege permissions on the bucket prefix used for backups (`backups/*`).
- `S3_ENDPOINT` (optional): Custom endpoint URL for S3-compatible storage (MinIO, Wasabi, etc.). When set, the backup/restore scripts automatically pass `--endpoint-url` to the AWS CLI.
- `S3_UPLOAD_PREFIX` (optional): Path prefix reserved for application uploads (not used by the backup scripts). Choose something like `uploads/`.
- `MONGO_BACKUP_CRON`: Cron schedule for automated backups (used by the `mongo-backup` service).
- `MONGO_BACKUP_KEEP`: Number of most-recent backups to retain locally and in S3.

Notes:

- The backup scripts also use `S3_PATH` (default: `backups`) as the folder/prefix inside the bucket. Objects are stored under `s3://$S3_BUCKET/$S3_PATH/`.
- See the full guide in `docs/mongodb-backup-s3.md` for setup steps, IAM policy examples, retention, and manual usage.

## Other

- `PORT`, `DEV_PORT`, `PROD_PORT`: App ports
- `JWT_SECRET`: JWT authentication secret
- `CORS_ORIGIN`: Allowed CORS domains

See `.env` and `.example.env` for all available options and usage notes.
