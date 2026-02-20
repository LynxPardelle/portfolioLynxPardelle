#!/bin/bash
set -euo pipefail

INTERVAL=${HEALTH_MONITOR_INTERVAL:-30}
LOG_FILE=/var/log/mongo-backup/health-monitor.log

while true; do
  if /opt/mongo-unified/scripts/health-check.sh --monitor >>"$LOG_FILE" 2>&1; then
    echo "[$(date --iso-8601=seconds)] OK" >>"$LOG_FILE"
  else
    STATUS=$?
    echo "[$(date --iso-8601=seconds)] FAIL ${STATUS}" >>"$LOG_FILE"
  fi
  sleep "$INTERVAL"
done
