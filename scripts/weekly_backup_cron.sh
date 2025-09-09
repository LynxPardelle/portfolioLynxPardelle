#!/bin/bash
# Weekly MongoDB backup cron job

SCRIPT_DIR=$(dirname "$0")

# Run backup script
bash "$SCRIPT_DIR/backup_mongo_to_s3.sh"
