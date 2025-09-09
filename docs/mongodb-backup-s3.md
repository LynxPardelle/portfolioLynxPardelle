# MongoDB Backup to S3

This document explains how automated MongoDB backups to S3 work in this project.

## How Backups Work

- The `mongo-backup` service runs a cron job every Sunday at 3am UTC.
- The backup script (`scripts/backup_mongo_to_s3.sh`) creates a compressed archive of the database and uploads it to your configured S3 bucket.
- Backups are stored in `mongo_backups/` and in S3.

## Restore from S3

- Use `scripts/restore_mongo_from_s3.sh` to restore the latest backup from S3.

## Configuration

- All S3 and MongoDB settings are managed in `.env` and `.example.env`.
- Prerequisites: `awscli`, `mongodump`, and `mongorestore` must be installed in the backup container or locally.

## Manual Usage

- Run a backup manually:
  ```sh
  bash scripts/backup_mongo_to_s3.sh
  ```
- Restore manually:
  ```sh
  bash scripts/restore_mongo_from_s3.sh
  ```
