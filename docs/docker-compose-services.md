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

**`mongo`** - MongoDB database

- Persistent data storage via `mongo_data` volume
- Configurable port (default: 27017)
- Includes health checks and initialization scripts

**`mongo-backup`** - Automated backups

- Scheduled MongoDB backups to S3
- Cron-based scheduling (weekly by default)
- Configurable retention policy
- Profile: `backup`

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

- `docker-compose.mongo.yml` - MongoDB database
- `docker-compose.mongo-backup.yml` - Backup service
- `docker-compose.nginx.yml` - Nginx proxy
- `docker-compose.prod-nginx.yml` - Combined app + nginx

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
