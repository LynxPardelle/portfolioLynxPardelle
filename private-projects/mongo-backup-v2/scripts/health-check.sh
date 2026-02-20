#!/bin/bash
set -euo pipefail

MODE=${1:---production}
DB_HOST=${MONGO_HOST:-localhost}
DB_PORT=${MONGO_CONTAINER_PORT:-${MONGO_PORT:-27017}}
CHECK_USER=${MONGO_INITDB_ROOT_USERNAME:-root}
CHECK_PASSWORD=${MONGO_INITDB_ROOT_PASSWORD:-example}
AUTH_DB=${MONGO_AUTH_SOURCE:-admin}
STATE_FILE=${MONGO_BACKUP_STATE:-/var/log/mongo-backup/state.json}
MAX_AGE_SECONDS=${BACKUP_MAX_AGE_SECONDS:-172800}

mongosh --quiet "mongodb://${CHECK_USER}:${CHECK_PASSWORD}@${DB_HOST}:${DB_PORT}/${AUTH_DB}" --eval "db.runCommand({ ping: 1 })" >/dev/null

if [ -f "$STATE_FILE" ]; then
  LAST_SUCCESS=$(jq -r '.last_success // empty' "$STATE_FILE" 2>/dev/null || true)
  if [ -n "$LAST_SUCCESS" ]; then
    LAST_TS=$(date -d "$LAST_SUCCESS" +%s 2>/dev/null || true)
    NOW_TS=$(date +%s)
    if [ -n "$LAST_TS" ]; then
      AGE=$((NOW_TS - LAST_TS))
      if [ "$AGE" -gt "$MAX_AGE_SECONDS" ]; then
        echo "Backup is stale (${AGE}s old)"
        exit 2
      fi
    fi
  fi
fi

echo "MongoDB healthy (${MODE})"
