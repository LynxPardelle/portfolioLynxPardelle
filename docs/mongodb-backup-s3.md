# MongoDB Backups to S3

This guide explains how this repository performs automated MongoDB backups to Amazon S3 (or S3‑compatible storage), how to set up the required environment variables, and how to run backups/restores manually.

## Overview

- A dedicated container (service name: `mongo-backup`) runs the backup scripts found in `scripts/`.
- The backup job creates a compressed dump using `mongodump` and uploads it to S3 using the AWS CLI.
- Backups are kept locally in `mongo_backups/` and remotely in your S3 bucket under a configurable path (default: `backups/`).
- Retention is handled both locally and in S3 by keeping only the latest N backups when `MONGO_BACKUP_KEEP` is set.

See `docker-compose.yml` for how variables are injected into the backup container.

## Environment Variables (S3 & Backup)

Define these in `.env` (do not commit real secrets):

- `S3_BUCKET_NAME`: Name of the S3 bucket that stores backups. Example: `lynx-portfolio`. Used as `S3_BUCKET` inside the backup container.
- `S3_REGION`: AWS region of the bucket. Example: `us-east-1`. Mapped to `AWS_DEFAULT_REGION` for AWS CLI.
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`: IAM user access keys for programmatic access. Allow at least `s3:ListBucket` and `s3:GetObject`/`s3:PutObject`/`s3:DeleteObject` on the chosen prefix (e.g., `backups/*`).
- `S3_ENDPOINT` (optional): Custom endpoint URL for S3‑compatible providers (MinIO, Wasabi, etc.). When set, the scripts pass `--endpoint-url` to the AWS CLI automatically.
- `S3_UPLOAD_PREFIX` (optional): Reserved for future app uploads (not used by the backup scripts).
- `MONGO_BACKUP_CRON`: Cron schedule for automated backups (used by the backup container).
- `MONGO_BACKUP_KEEP`: Number of most‑recent backups to retain locally and in S3.

Additional variables used by the scripts (with defaults inside the container):

- `S3_PATH`: Folder/prefix inside the bucket where backups are stored. Default: `backups`.
- `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB`, `MONGO_USER`, `MONGO_PASS`: Mongo connection details used by `mongodump`/`mongorestore`.

For a concise catalog of all environment variables across the project, see `docs/env-configuration.md`.

## Create the S3 bucket and credentials

1. Create a bucket

  In AWS Console > S3 > Create bucket, choose a globally unique name and a region (e.g., `us-east-1`).

1. Create an IAM user with programmatic access

  Go to AWS Console > IAM > Users > Create user (access type: programmatic). Attach a least‑privilege policy granting list/get/put/delete on your bucket prefix.

  Policy example (replace `YOUR_BUCKET_NAME`):

  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["s3:ListBucket"],
        "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
      },
      {
        "Effect": "Allow",
        "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
        "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/backups/*"
      }
    ]
  }
  ```

1. Capture the Access key ID and Secret access key

  Store them securely (password manager or secrets store) and add them to `.env`.

## How the compose wiring works

In `docker-compose.yml`, the backup service injects variables as follows:

- `S3_BUCKET_NAME` → `S3_BUCKET`
- `S3_REGION` → `AWS_DEFAULT_REGION` (for AWS CLI)
- `S3_ACCESS_KEY_ID` → `AWS_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY` → `AWS_SECRET_ACCESS_KEY`
- `S3_PATH` defaults to `backups`
- `S3_ENDPOINT` is passed through for S3‑compatible providers

The scripts `scripts/backup_mongo_to_s3.sh` and `scripts/restore_mongo_from_s3.sh` read these environment variables to upload/list/copy from `s3://$S3_BUCKET/$S3_PATH/`.

## Run a backup manually

From the repository root (using the backup container):

PowerShell (Windows):

```powershell
# Ensure containers are up (or start only the backup profile when configured)
# docker compose --profile backup up -d

docker compose exec mongo-backup bash /scripts/backup_mongo_to_s3.sh
```

This creates a local gzip archive in `mongo_backups/` and, if credentials are valid, uploads it to S3 under `s3://<bucket>/backups/`.

## Restore the latest backup from S3

```powershell
docker compose exec mongo-backup bash /scripts/restore_mongo_from_s3.sh
```

This downloads the most recent `mongo_backup_*.gz` from `s3://<bucket>/backups/` and restores it using `mongorestore --drop`.

## Retention

- Set `MONGO_BACKUP_KEEP` in `.env` to a positive integer.

The backup script removes older local archives in `mongo_backups/`, keeping only the latest N. It also lists objects at `s3://$S3_BUCKET/$S3_PATH/` and deletes older ones, keeping only the latest N.

## Optional: Custom S3 endpoint (S3‑compatible)

If you use a provider like MinIO or Wasabi, set `S3_ENDPOINT` in `.env`. The backup and restore scripts will automatically pass `--endpoint-url $S3_ENDPOINT` to the AWS CLI for all `cp`, `ls`, and `rm` operations.

## Prerequisites and troubleshooting

- The backup container image includes awscli, mongodump, and mongorestore (see `Dockerfile.mongo-backup`). If running scripts locally, ensure these tools are installed and credentials are set via environment variables or `aws configure`.
- Check the `mongo-backup` container logs if an upload fails.
- Confirm that `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_DEFAULT_REGION` are present in the container environment.

## Security best practices

- Never commit real `.env` secrets.
- Use least‑privilege IAM policies and rotate keys regularly.
- Consider enabling bucket versioning and lifecycle policies for cost control and recovery.
