#!/bin/bash
set -euo pipefail

MODE=${1:-auto}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
export LAST_BACKUP_TIMESTAMP="$TIMESTAMP"
DATA_DIR=/tmp/mongo-backup-${TIMESTAMP}
ARCHIVE_BASENAME=${DEPLOYMENT_ID:-deployment}-${TIMESTAMP}.tar.gz
ARCHIVE_PATH=/data/backups/${ARCHIVE_BASENAME}
STATE_FILE=${MONGO_BACKUP_STATE:-/var/log/mongo-backup/state.json}
KEEP=${MONGO_BACKUP_KEEP:-4}
AUTH_DB=${MONGO_AUTH_SOURCE:-admin}
DB_HOST=${MONGO_HOST:-localhost}
DB_PORT=${MONGO_CONTAINER_PORT:-${MONGO_PORT:-27017}}
ROOT_USER=${MONGO_INITDB_ROOT_USERNAME:-root}
ROOT_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-example}

if [[ -n "${S3_ACCESS_KEY_ID:-}" && -n "${S3_SECRET_ACCESS_KEY:-}" ]]; then
  export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}"
  export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}"
  if [[ -n "${S3_SESSION_TOKEN:-}" ]]; then
    export AWS_SESSION_TOKEN="${S3_SESSION_TOKEN}"
  fi
fi

cleanup() {
  rm -rf "$DATA_DIR"
}
trap cleanup EXIT

record_failure() {
  local message=${1:-"Backup failed"}
  python3 - "$STATE_FILE" "$message" <<'PY'
import json
import os
import sys
from pathlib import Path

state_file = Path(sys.argv[1])
message = sys.argv[2]
data = {
    "last_success": os.environ.get("LAST_BACKUP_TIMESTAMP"),
    "last_failure": message,
}
if state_file.exists():
    try:
        existing = json.loads(state_file.read_text())
    except Exception:
        existing = {}
else:
    existing = {}
existing.update(data)
state_file.write_text(json.dumps(existing))
PY
}

trap 'record_failure "Backup pipeline error"' ERR

mkdir -p /data/backups
mkdir -p "$DATA_DIR"

mongodump \
  --host "$DB_HOST" \
  --port "$DB_PORT" \
  --username "$ROOT_USER" \
  --password "$ROOT_PASSWORD" \
  --authenticationDatabase "$AUTH_DB" \
  --out "$DATA_DIR/dump" >/var/log/mongo-backup/latest-dump.log 2>&1

tar -czf "$ARCHIVE_PATH" -C "$DATA_DIR" dump

UPLOAD_TARGET=""
if [[ -n "${S3_BUCKET_NAME:-}" && -n "${S3_ACCESS_KEY_ID:-}" && -n "${S3_SECRET_ACCESS_KEY:-}" ]]; then
  S3_PATH=${S3_BACKUP_PATH:-backups}
  UPLOAD_TARGET="s3://${S3_BUCKET_NAME}/${S3_PATH}/${ARCHIVE_BASENAME}"
  AWS_ARGS=()
  if [ -n "${S3_REGION:-}" ]; then
    AWS_ARGS+=(--region "${S3_REGION}")
  fi
  if [ -n "${S3_ENDPOINT:-}" ]; then
    AWS_ARGS+=(--endpoint-url "${S3_ENDPOINT}")
  fi
  aws s3 cp "$ARCHIVE_PATH" "$UPLOAD_TARGET" "${AWS_ARGS[@]}"
fi

# Retention (local)
if ls -1 /data/backups/*.tar.gz >/dev/null 2>&1; then
  ls -1t /data/backups/*.tar.gz | tail -n +$((KEEP + 1)) | xargs -r rm -f
fi

# Record state so health/metrics can report on backup freshness
python3 - "$STATE_FILE" "$ARCHIVE_PATH" "$UPLOAD_TARGET" <<'PY'
import json
import os
import sys
from pathlib import Path

state_file = Path(sys.argv[1])
archive_path = Path(sys.argv[2])
s3_target = sys.argv[3]
size_bytes = archive_path.stat().st_size if archive_path.exists() else 0
data = {
  "last_success": os.environ.get("LAST_BACKUP_TIMESTAMP"),
    "last_failure": None,
    "total_backups": 1,
    "last_archive_path": str(archive_path),
    "last_s3_target": s3_target,
    "last_size_bytes": size_bytes,
}
if state_file.exists():
    try:
        previous = json.loads(state_file.read_text())
        data["total_backups"] = int(previous.get("total_backups", 0)) + 1
    except Exception:
        pass
state_file.write_text(json.dumps(data))
PY

echo "Backup complete (${MODE}) -> ${ARCHIVE_PATH}"
