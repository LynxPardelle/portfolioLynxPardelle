# Integration Points

This document describes the external systems and services the application integrates with.

## MongoDB Database

**Purpose**: Primary data storage for application content and user data.

**Connection**:

- Configured via `MONGO_URI` environment variable
- Supports both local development and containerized deployment
- Auto-retry connection logic with configurable attempts
- Health monitoring via `/health` endpoint

**Key Features**:

- Automatic `authSource` parameter handling
- Connection pooling and timeout management
- Docker network support (uses `mongo` hostname)
- Graceful shutdown on application termination

## AWS S3 Storage

**Purpose**: Primary file storage system for all uploads and assets.

**Configuration**:

- **Required**: `S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- **Optional**: `CLOUDFRONT_DOMAIN` (CDN), `S3_KMS_KEY_ARN` (encryption)

**Key Features**:

- All file uploads stored directly in S3 (no local storage)
- Automatic MongoDB backup uploads to S3
- CloudFront CDN integration for faster delivery
- S3-compatible provider support via `S3_ENDPOINT`

## Nginx Reverse Proxy

**Purpose**: Production web server and reverse proxy.

**Configuration**:

- Production configuration in `nginx.conf`
- Proxies requests to Node.js backend on port 6164/6165
- Rate limiting and security headers
- Static file caching and compression

**Key Features**:

- Load balancing with health checks
- SSL/TLS termination (when certificates configured)
- Request filtering and attack protection
- Performance optimizations (gzip, caching)

## Docker Network Integration

**Purpose**: Container communication in Docker deployments.

**Network**: `lynx-portfolio-back-network` (external shared network)

**Service Communication**:

- MongoDB: `mongo:27017`
- Application: `app:6164` or `app:6165`
- Backup service connects to both MongoDB and S3

## Environment Variables

All integrations use environment variables for configuration. See [Environment Configuration](env-configuration.md) for complete variable reference.
