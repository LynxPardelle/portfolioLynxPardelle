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
- `docker-compose.mongo.yml` - MongoDB database with persistent storage
- `docker-compose.prod.yml` - Production Node.js application (recommended)
- `docker-compose.app.yml` - Alternative production application

### Proxy Options
- `docker-compose.nginx.yml` - Standalone nginx reverse proxy
- `docker-compose.prod-nginx.yml` - Combined Node.js + nginx in single container

### Additional Services
- `docker-compose.mongo-backup.yml` - Automated MongoDB backups to S3

## Deployment Strategy

### Recommended (Simple)

Deploy these stacks in order:

1. **MongoDB Database**: `docker-compose.mongo.yml`
2. **Application**: `docker-compose.prod.yml` 
3. **Backups** (optional): `docker-compose.mongo-backup.yml`

This setup exposes the application directly on port 6165 without nginx.

### Alternative (With Nginx)

For custom proxy requirements:

1. **MongoDB Database**: `docker-compose.mongo.yml`
2. **Application**: `docker-compose.app.yml`
3. **Nginx Proxy**: `docker-compose.nginx.yml`
4. **Backups** (optional): `docker-compose.mongo-backup.yml`

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
   - Use `docker-compose.mongo.yml`
   - Wait for health check to pass

4. **Deploy the application**:
   - Use `docker-compose.prod.yml`
   - Verify it connects to MongoDB

5. **Optional: Deploy backups**:
   - Use `docker-compose.mongo-backup.yml`
   - Configure S3 credentials if needed

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

