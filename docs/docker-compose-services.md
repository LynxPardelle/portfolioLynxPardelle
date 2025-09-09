# Docker Compose Services

This document describes each service in the `docker-compose.yml` for the Lynx Pardelle Portfolio backend.

## Services

- **mongo**: MongoDB database container. Data is persisted in the `mongo_data` volume. Configurable via `.env`.
- **mongo-backup**: Automates weekly MongoDB backups to S3. Uses cron and the backup script in `/scripts`. Healthcheck monitors backup file presence.
- **dev**: Development server with hot-reload. Mounts source code for live editing.
- **prod**: Production server. Optimized for performance and security.
- **prod-pm2**: Production server managed by PM2 for clustering and process management.
- **test**: Testing environment for running automated tests.
- **app**: Backend service for use with nginx reverse proxy.
- **nginx**: Standalone nginx reverse proxy.
- **prod-nginx**: Production server with integrated nginx reverse proxy.

## Volumes
- `mongo_data`: MongoDB persistent data.
- `node_logs`, `node_uploads`, `nginx_logs`, `supervisor_logs`: Logging and uploads.

## Profiles
- Use `--profile backup` to run only the backup service.

See `.env` for all configuration options.