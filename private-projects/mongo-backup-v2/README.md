# Mongo Backup v2 (Unified Container)

This directory houses the assets required to build the custom MongoDB image that ships with automated S3 backups, supervisor-managed health probes, and a lightweight metrics exporter. The main compose files in the repository reference these assets when running the production/staging database stack.

## Layout

- `docker/Dockerfile.mongo` – Base image used by `docker-compose.mongo.yml` and the Dokploy deployment.
- `docker/Dockerfile.mongo-unified` – Variant used by staging and local test stacks.
- `docker/docker-compose.unified.yml` – Standalone compose definition for running the database + backup pipeline without the rest of the app.
- `scripts/` – Helper scripts invoked by supervisor, cron, and health checks.
- `staging-config/` – Optional overrides that get bind-mounted in staging.

## Features

- Automated `mongodump` + `tar.gz` backups stored in `/data/backups` and optionally uploaded to S3.
- Retention policy controlled by `MONGO_BACKUP_KEEP` (defaults to 4 archives).
- Cron schedule configured via `MONGO_BACKUP_CRON` (defaults to Sundays at 03:00 UTC).
- `health-check.sh` combines MongoDB ping with last-backup freshness validation.
- `/metrics` endpoint on port `9217` that publishes Prometheus-style metrics describing the backup cadence.

The scripts are intentionally written in Bash/Python only so they can run inside the official MongoDB image without introducing large runtime dependencies.
