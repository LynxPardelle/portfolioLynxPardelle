#!/bin/bash
set -euo pipefail

BACKUP_STATE_DIR=/var/log/mongo-backup
env_cache=/opt/mongo-unified/.env-cache
mkdir -p "$BACKUP_STATE_DIR"

# Cache environment for cron-driven commands
env | sort > "$env_cache"
chmod 600 "$env_cache"

# Render cron schedule if requested
CRON_FILE=/etc/cron.d/mongo-backup
CRON_SCHEDULE=${MONGO_BACKUP_CRON:-"0 3 * * 0"}
cat <<EOF > "$CRON_FILE"
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=""

$CRON_SCHEDULE root /opt/mongo-unified/scripts/run-backup.sh >> /var/log/mongo-backup/cron.log 2>&1
EOF
chmod 0644 "$CRON_FILE"

# Prime backup state file if it does not exist
STATE_FILE=${MONGO_BACKUP_STATE:-/var/log/mongo-backup/state.json}
if [ ! -f "$STATE_FILE" ]; then
  cat <<'JSON' > "$STATE_FILE"
{ "last_success": null, "last_failure": null, "total_backups": 0 }
JSON
fi
