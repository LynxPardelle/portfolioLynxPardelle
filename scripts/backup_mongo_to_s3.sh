#!/bin/bash
# DEPRECATED: Root-level backup script moved to unified container. Do not use.

echo "[DEPRECATED] Use the unified container script instead:" >&2
echo "  docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml exec mongo-unified /opt/mongo-unified/scripts/backup_mongo_to_s3.sh manual" >&2
echo "Or call the wrapper in private-projects:" >&2
echo "  private-projects/mongo-backup-v2/scripts/backup_mongo_to_s3.sh <mode>" >&2
exit 1