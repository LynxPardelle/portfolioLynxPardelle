#!/bin/bash
set -euo pipefail

ENV_CACHE=/opt/mongo-unified/.env-cache
if [ -f "$ENV_CACHE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_CACHE"
fi
exec /opt/mongo-unified/scripts/backup_mongo_to_s3.sh --cron
