# Docker Compose Services

This guide describes the Docker services and deployment configurations for the portfolio application.

## Main Services

### Core Application Services

**`dev`** - Development server

- Hot-reload enabled for live code editing
- Runs on port 6164 (configurable via `DEV_PORT`)
- Source code mounted for real-time changes
- Profile: `dev`

**`prod`** - Production server

- Optimized for performance and security
- Runs on port 6165 (configurable via `PROD_PORT`)
- Profile: `prod`

**`prod-pm2`** - Production server with PM2

- Uses PM2 for process management and clustering
- Better resource utilization and crash recovery
- Profile: `prod-pm2`

**`test`** - Testing environment

- Isolated environment for running automated tests
- Uses test-specific S3 credentials (safe for testing)
- Profile: `test`

### Database Services

Preferred (Unified):

**`mongo-unified`** - Unified MongoDB + Backup

- Single container that includes MongoDB, backup scheduler, and health tooling
- Uses `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml`
- S3-first initialization and backup workflows via private-projects/mongo-backup-v2 scripts

Legacy (Archived):

**`mongo`** and **`mongo-backup`** standalone services have been archived under:

- `private-projects/mongo-backup-v2/archive/pre-unified/docker-compose.mongo.yml`
- `private-projects/mongo-backup-v2/archive/pre-unified/docker-compose.mongo-backup.yml`

Use the unified service for all new deployments.

### Proxy Services

**`app`** - Backend service for nginx

- Production app optimized for reverse proxy use
- Exposes port 6165 internally
- Profile: `nginx`

**`nginx`** - Standalone reverse proxy

- Routes traffic to the `app` service
- Runs on port 80 (configurable via `NGINX_PORT`)
- Profile: `nginx`

**`prod-nginx`** - Integrated production + nginx

- Single container with both Node.js and nginx
- Reduces complexity for simple deployments
- Profile: `prod-nginx`

## Volumes

**Persistent Storage:**

- `mongo_data` - MongoDB database files

**Logging:**

- `node_logs` - Application logs
- `nginx_logs` - Nginx access and error logs
- `supervisor_logs` - Process supervisor logs (prod-nginx only)

## Profiles

Profiles allow running specific service combinations:

```bash
# Development
docker compose --profile dev up

# Production
docker compose --profile prod up

# Production with PM2
docker compose --profile prod-pm2 up

# Nginx reverse proxy + app
docker compose --profile nginx up

# Testing
docker compose --profile test up

# Backup service only
docker compose --profile backup up
```

## Standalone Compose Files

For Dokploy-style deployments, individual compose files are available:

**Core Services:**

- `docker-compose.dev.yml` - Development environment
- `docker-compose.prod.yml` - Production application
- `docker-compose.app.yml` - Production app (alternative)

**Infrastructure:**

- `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml` - Unified MongoDB + Backup (preferred)
- `docker-compose.nginx.yml` - Nginx proxy
- `docker-compose.prod-nginx.yml` - Combined app + nginx
- Archived (legacy): see private-projects/mongo-backup-v2/archive/pre-unified for `docker-compose.mongo*.yml`

**Testing:**

- `docker-compose.test.yml` - Testing environment
- `docker-compose.localstack.yml` - LocalStack for AWS testing

## Common Usage

**Development:**

```bash
make dev              # Start development server
make dev-logs         # View development logs
```

**Production:**

```bash
make prod             # Start production server
make prod-pm2         # Start with PM2
make nginx            # Start with reverse proxy
```

**Testing:**

```bash
make test             # Run all tests
make test-unit        # Unit tests only
```

**Backup:**

```bash
make backup           # Start backup service
make backup-logs      # View backup logs
```

## Environment Configuration

Services are configured via environment variables in `.env`. Key variables include:

- `MONGO_URI` - Database connection string
- `S3_BUCKET_NAME` - S3 bucket for backups and file storage
- `DEV_PORT` / `PROD_PORT` / `NGINX_PORT` - Service ports
- `MONGO_BACKUP_CRON` - Backup schedule

See `.env.example` for complete configuration options.

---

*For deployment instructions, see `docs/developer-workflows.md` and `docs/dokploy.md`*
