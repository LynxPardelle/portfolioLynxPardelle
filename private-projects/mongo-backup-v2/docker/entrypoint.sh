#!/bin/bash
set -euo pipefail

if [ "${1:-}" != "mongod" ]; then
  # Preserve user supplied command for completeness, but default to mongod.
  export MONGO_CUSTOM_COMMAND="$*"
else
  # Drop the placeholder argument so supervisor always launches mongod itself.
  shift || true
  export MONGO_CUSTOM_COMMAND="mongod --bind_ip_all"
fi

# Ensure critical directories exist
mkdir -p /var/log/mongo-backup /var/log/supervisor /data/backups

# Persist current environment for cron-driven scripts
/opt/mongo-unified/scripts/bootstrap.sh

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/mongo-unified.conf
