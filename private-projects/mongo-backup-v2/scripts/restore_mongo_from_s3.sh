#!/bin/bash
set -euo pipefail

TARGET_DB=${MONGO_APP_DB:-lynx_portfolio}
AUTH_DB=${MONGO_AUTH_SOURCE:-admin}
DB_HOST=${MONGO_HOST:-localhost}
DB_PORT=${MONGO_CONTAINER_PORT:-${MONGO_PORT:-27017}}
ROOT_USER=${MONGO_INITDB_ROOT_USERNAME:-root}
ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-example}
BACKUP_DIR=/tmp/mongo-restore
S3_PATH=${S3_BACKUP_PATH:-backups}

if [[ -n "${S3_ACCESS_KEY_ID:-}" && -n "${S3_SECRET_ACCESS_KEY:-}" ]]; then
  export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}"
  export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}"
  if [[ -n "${S3_SESSION_TOKEN:-}" ]]; then
    export AWS_SESSION_TOKEN="${S3_SESSION_TOKEN}"
  fi
fi

if [[ -z "${S3_BUCKET_NAME:-}" ]]; then
  echo "[restore] S3_BUCKET_NAME is not set" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
LATEST=$(aws s3 ls "s3://${S3_BUCKET_NAME}/${S3_PATH}/" --recursive | sort | tail -n 1 | awk '{print $4}')
if [[ -z "$LATEST" ]]; then
  echo "[restore] No backups found in s3://${S3_BUCKET_NAME}/${S3_PATH}" >&2
  exit 1
fi

echo "[restore] Downloading ${LATEST}"
aws s3 cp "s3://${S3_BUCKET_NAME}/${S3_PATH}/${LATEST}" "$BACKUP_DIR/archive.tar.gz"

tar -xzf "$BACKUP_DIR/archive.tar.gz" -C "$BACKUP_DIR"

echo "[restore] Restoring database ${TARGET_DB}"
mongorestore \
  --host "$DB_HOST" \
  --port "$DB_PORT" \
  --username "$ROOT_USER" \
  --password "$ROOT_PASSWORD" \
  --authenticationDatabase "$AUTH_DB" \
  --drop \
  "$BACKUP_DIR/dump" >/var/log/mongo-backup/latest-restore.log 2>&1

echo "[restore] Completed"
