#!/bin/bash
# Restore MongoDB from the latest backup in S3
set -e

if [ -f ../.env ]; then
  # shellcheck disable=SC2046
  set -a; . ../.env; set +a
fi

BACKUP_DIR="../mongo_backups"
MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-test}"
MONGO_USER="${MONGO_USER}" # optional
MONGO_PASS="${MONGO_PASS}" # optional
S3_BUCKET="$S3_BUCKET"
S3_PATH="${S3_PATH:-backups}" # optional

mkdir -p "$BACKUP_DIR"

# Find the latest backup in S3
LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/$S3_PATH/" | sort | tail -n 1 | awk '{print $4}')
if [ -z "$LATEST_BACKUP" ]; then
  echo "No backups found in S3."
  exit 1
fi

# Download the latest backup
aws s3 cp "s3://$S3_BUCKET/$S3_PATH/$LATEST_BACKUP" "$BACKUP_DIR/$LATEST_BACKUP"

# Build mongorestore command
RESTORE_CMD="mongorestore --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --archive=$BACKUP_DIR/$LATEST_BACKUP --gzip --drop"
if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
  RESTORE_CMD="$RESTORE_CMD --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin"
fi

# Run restore
$RESTORE_CMD

echo "Restore complete from $BACKUP_DIR/$LATEST_BACKUP"