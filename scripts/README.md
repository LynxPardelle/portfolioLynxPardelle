# Scripts moved to private-projects (archived)

These standalone backup/restore scripts were part of an earlier deployment approach and are no longer required for the API or the unified MongoDB container.

Where to find the maintained versions:
- private-projects/mongo-backup-v2/scripts/backup_mongo_to_s3.sh
- private-projects/mongo-backup-v2/scripts/restore_mongo_from_s3.sh
- private-projects/mongo-backup-v2/docker/crontab (cron schedules)

Recommended path (current):
- Use the unified container and its built-in scripts via Docker Compose:
  - docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml up -d
  - docker compose exec mongo-unified /opt/mongo-unified/scripts/backup_mongo_to_s3.sh manual

This folder remains as a pointer location only; the old shell scripts were removed to keep the API-focused root clean.