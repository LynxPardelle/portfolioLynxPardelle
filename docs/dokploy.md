# Dokploy Deployment Guide

This guide explains how to deploy the portfolio application using Dokploy, a Docker-based deployment platform. The project provides modular Docker Compose files that can be deployed as separate stacks.

## What is Dokploy?

Dokploy is a deployment platform that manages Docker containers and compose files. It allows you to deploy services independently while maintaining network connectivity between them.

## Network Configuration

All services use a shared Docker network for communication:

**Network Name**: `lynx-portfolio-back-network`

Create the network on your Dokploy host:

```bash
docker network create lynx-portfolio-back-network
```

## Available Compose Files

### Core Services
- `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml` - Unified MongoDB database with integrated backups and health management (recommended)
- `docker-compose.prod.yml` - Production Node.js application (recommended)
- `docker-compose.app.yml` - Alternative production application

### Proxy Options
- `docker-compose.nginx.yml` - Standalone nginx reverse proxy
- `docker-compose.prod-nginx.yml` - Combined Node.js + nginx in single container

### Additional Services
- (Legacy) `docker-compose.mongo.yml` and `docker-compose.mongo-backup.yml` are archived under `private-projects/mongo-backup-v2/archive/pre-unified/`

## Deployment Strategy

### Recommended (Simple)

Deploy these stacks in order:

1. **MongoDB Unified**: `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml`
2. **Application**: `docker-compose.prod.yml`

This setup exposes the application directly on port 6165 without nginx. The database container handles backups internally.

### Alternative (With Nginx)

For custom proxy requirements:

1. **MongoDB Unified**: `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml`
2. **Application**: `docker-compose.app.yml`
3. **Nginx Proxy**: `docker-compose.nginx.yml`

## Environment Configuration

Set these environment variables in your Dokploy deployment:

### Required Variables

**Application:**

- `NODE_ENV=production`
- `PROD_PORT=6165` (or your preferred port)
- `JWT_SECRET=your-secure-jwt-secret`
- `CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com`

**Database:**

- `MONGO_PORT=27017`
- `MONGO_ROOT_USERNAME=your-root-user`
- `MONGO_ROOT_PASSWORD=your-secure-password`
- `MONGO_APP_DB=lynx_portfolio`
- `MONGO_APP_USER=your-app-user`
- `MONGO_APP_PASSWORD=your-app-password`
- `MONGO_AUTH_SOURCE=admin`

**MongoDB Connection:**

```bash
MONGO_URI=mongodb://${MONGO_APP_USER}:${MONGO_APP_PASSWORD}@mongo:${MONGO_PORT}/${MONGO_APP_DB}?authSource=${MONGO_AUTH_SOURCE}
```

### Optional Variables

**S3 Storage (for backups and file uploads):**

- `S3_BUCKET_NAME=your-bucket-name`
- `S3_REGION=your-region`
- `S3_ACCESS_KEY_ID=your-access-key`
- `S3_SECRET_ACCESS_KEY=your-secret-key`

**Nginx (if using proxy):**

- `NGINX_PORT=80`

## Volumes & Data Persistence

**MongoDB Data:**

- Volume: `lynx-portfolio-back-mongo-data`
- Automatically created on first deployment
- Shared between MongoDB and backup services

**Application Logs:**

- Volume: `lynx-portfolio-back-logs`
- Retains logs across container updates

## Health Checks

The deployment includes built-in health monitoring:

- **MongoDB**: Connection test via `mongosh`
- **Application**: HTTP `GET /health` endpoint on port 6165
- **Nginx**: Status endpoint at `/nginx-status`

## Deployment Steps

1. **Create the network** (if not exists):

   ```bash
   docker network create lynx-portfolio-back-network
   ```

2. **Configure environment variables** in Dokploy for each stack

3. **Deploy MongoDB first**:
   - Use `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml`
   - Wait for health check to pass

4. **Deploy the application**:
   - Use `docker-compose.prod.yml`
   - Verify it connects to MongoDB

5. **Backups**:
   - No separate stack required; configure S3 credentials on the unified service

## Troubleshooting

**Application can't connect to MongoDB:**

- Verify `MONGO_URI` uses `mongo` as hostname
- Check that both services are on the same network
- Ensure MongoDB stack is running and healthy

**502 Error with Nginx:**

- Test application health: `curl http://app:6165/health`
- Verify nginx configuration points to correct upstream
- Check that services can communicate on the network

**Backup service fails:**

- Verify S3 credentials are correct
- Check MongoDB connection from backup container
- Review backup service logs for specific errors

---

*For local development, use the main `docker-compose.yml` with profiles instead.*


## Deployment Hooks and Scripts

For safer deployments, integrate these helper commands into Dokploy pre/post hooks. They rely on the scripts under `private-projects/mongo-backup-v2/scripts/` and support dry-run and JSON reports.

- Pre-deploy backup (recommended before rollout):
   - Script: `dokploy-integration.sh pre-backup`
   - Notes: Pass a deployment ID to tag backups; defaults to a timestamp. Writes a JSON report under `private-projects/mongo-backup-v2/reports/`.

- Validate deployment health (quick or detailed):
   - Script: `dokploy-integration.sh validate --mode quick|detailed`
   - Options: `--app-url https://your.app/health` to include app endpoint checks, `--dry-run` to simulate in CI.

- Rollback (restore from deployment backups by default):
   - Script: `dokploy-integration.sh rollback --prefer deployment --age-cutoff-hours 48`
   - Options: `--backup-name <file>` to force a specific backup, `--path <s3-subpath>` to override selection path, `--dry-run` to simulate.

- Finalize (optional post-success marker):
   - Script: `dokploy-integration.sh finalize`

Common flags:

- `--deployment-id <id>`: Provide a stable ID (e.g., Dokploy release ID)
- `--output-report <path>`: Store JSON report at a specific path
- `--dry-run`: Simulate actions and external calls (safe for CI validation)

These commands wrap the Phase 6 scripts (`pre-deployment-backup.sh`, `health-check.sh`, `rollback.sh`) to keep Dokploy integrations consistent and observable.

