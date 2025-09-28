#!/bin/bash
# Backup MongoDB and upload to S3
set -e

## Inside container we rely on injected environment variables. If running locally and a sibling .env exists, load it.
if [ -f ../.env ]; then
  # shellcheck disable=SC2046
  set -a; . ../.env; set +a
fi

DATE=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="../mongo_backups"
BACKUP_NAME="mongo_backup_$DATE.gz"
MONGO_HOST="${MONGO_HOST:-mongo}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-test}"
MONGO_USER="${MONGO_USER}" # optional
MONGO_PASS="${MONGO_PASS}" # optional
S3_BUCKET="${S3_BUCKET:-$S3_BUCKET_NAME}" # Support both variable names
S3_PATH="${S3_PATH:-backups}" # optional

# Optional custom S3 endpoint (for S3-compatible providers)
AWS_ARGS=""
if [ -n "$S3_ENDPOINT" ]; then
  AWS_ARGS="--endpoint-url $S3_ENDPOINT"
fi

mkdir -p "$BACKUP_DIR"

# Build mongodump command
DUMP_CMD="mongodump --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --archive=$BACKUP_DIR/$BACKUP_NAME --gzip"
if [ -n "$MONGO_USER" ] && [ -n "$MONGO_PASS" ]; then
  # use admin auth DB since user is created there
  DUMP_CMD="$DUMP_CMD --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin"
fi

# Run backup
$DUMP_CMD


# AWS credential guard (prefer AWS_* env vars used by AWS CLI)
if [ -n "$S3_BUCKET" ] && [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Uploading backup to S3: s3://$S3_BUCKET/$S3_PATH/$BACKUP_NAME"
  aws s3 $AWS_ARGS cp "$BACKUP_DIR/$BACKUP_NAME" "s3://$S3_BUCKET/$S3_PATH/$BACKUP_NAME"
  echo "Backup uploaded to S3: s3://$S3_BUCKET/$S3_PATH/$BACKUP_NAME"

  # Retention logic: keep only last N backups in S3
  if [ -n "$MONGO_BACKUP_KEEP" ]; then
    BACKUPS_TO_DELETE=$(aws s3 $AWS_ARGS ls "s3://$S3_BUCKET/$S3_PATH/" | sort | head -n -$MONGO_BACKUP_KEEP | awk '{print $4}')
    for OLD_BACKUP in $BACKUPS_TO_DELETE; do
      aws s3 $AWS_ARGS rm "s3://$S3_BUCKET/$S3_PATH/$OLD_BACKUP"
      echo "Deleted old backup from S3: $OLD_BACKUP"
    done
  fi
else
  echo "S3_BUCKET not set or AWS credentials are placeholders. Skipping S3 upload."
fi

# Local retention logic: keep only last N backups locally
if [ -n "$MONGO_BACKUP_KEEP" ]; then
  LOCAL_BACKUPS=$(ls -1t "$BACKUP_DIR"/mongo_backup_*.gz 2>/dev/null | tail -n +$((MONGO_BACKUP_KEEP+1)))
  for OLD_LOCAL in $LOCAL_BACKUPS; do
    rm -f "$OLD_LOCAL"
    echo "Deleted old local backup: $OLD_LOCAL"
  done
fi


# Backup test: verify file exists and is non-empty
if [ -s "$BACKUP_DIR/$BACKUP_NAME" ]; then
  echo "Backup complete: $BACKUP_DIR/$BACKUP_NAME (size: $(stat -c%s "$BACKUP_DIR/$BACKUP_NAME") bytes)"
else
  echo "Backup failed: $BACKUP_DIR/$BACKUP_NAME is empty or missing."
  exit 1
fi