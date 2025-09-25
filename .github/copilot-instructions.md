# Copilot Instructions for portfolioLynxPardelle

## Architecture Overview
- **Node.js/Express API**: Main backend in `app.js` and `index.js`. Routes are split into `routes/main.js` and `routes/article.js`.
- **MongoDB**: Used for persistent storage. Connection logic and health reporting in `index.js`. Models are in `models/`.
- **Backup/Restore**: Automated MongoDB backup to S3 via `mongo-backup` service (see `docker-compose.yml`, `scripts/`). Retention and verification logic included.
- **Nginx**: Reverse proxy for production, config in `nginx.conf`.
- **Environment Variables**: Managed via `.env` and passed to containers/services. Key variables: `MONGO_URI`, `MONGO_APP_DB`, `S3_BUCKET_NAME`, etc.

## Developer Workflows
- **Build/Run**: Use `Makefile` targets or Docker Compose profiles:
  - Development: `make dev` or `docker compose --profile dev up --build`
  - Production: `make prod` or `docker compose --profile prod up --build`
  - Nginx: `make nginx` or `docker compose --profile nginx up --build`
- **Testing**: `make test` runs tests in container. Health endpoint at `/health` for readiness checks.
- **Backup/Restore**:
  - Manual backup: `docker compose exec mongo-backup bash /scripts/backup_mongo_to_s3.sh`
  - Restore: `docker compose exec mongo-backup bash /scripts/restore_mongo_from_s3.sh`
  - Weekly cron: `make weekly-backup-cron`
- **Logs/Debug**: Use `make dev-logs`, `make prod-logs`, or `docker compose logs -f <service>`.
- **Shell Access**: `make dev-shell` or `docker compose exec dev sh` for development container.

## Project-Specific Patterns & Conventions
- **Health Endpoints**: `/health` implemented in both `app.js` and `index.js` for container/service readiness.
- **CORS**: Allowed domains set via `CORS_ORIGIN` env var, enforced in `app.js`.
- **Graceful Shutdown**: Signal handling in `index.js` for clean MongoDB disconnect and server close.
- **Model Indexes**: Defined in `models/_defineIndexes.js`.
- **Static Files**: Served from `client/` via Express.
- **API Routing**: All API endpoints are namespaced under `/api/main` and `/api/article`.

## Integration Points
- **MongoDB**: Connection string built from env vars, supports local and containerized DB.
- **S3**: Backups uploaded if AWS credentials are set; skipped if placeholders.
- **Nginx**: Used for reverse proxy in production; see `nginx.conf` and related Docker profiles.

## Key Files & Directories
- `app.js`, `index.js`: Main entry points, health logic, DB connection
- `routes/`, `controllers/`: API structure
- `models/`: Mongoose schemas
- `scripts/`: Backup/restore shell scripts
- `Makefile`: Workflow automation
- `docker-compose.yml`: Service orchestration
- `nginx.conf`: Reverse proxy config
- `database_init/`: Initial MongoDB data

## Examples
- To run dev server: `make dev` or `docker compose --profile dev up --build`
- To check health: `curl http://localhost:<DEV_PORT>/health`
- To backup DB: `docker compose exec mongo-backup bash /scripts/backup_mongo_to_s3.sh`

---
**For AI agents:**
- Always check for Makefile targets before scripting Docker commands.
- Use health endpoints for readiness checks.
- Respect CORS and environment variable conventions.
- Reference `README.md` and this file for workflow details.
