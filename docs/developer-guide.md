# Developer Setup Guide

Complete setup guide for the LynxPardelle portfolio application.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) (for local development)
- AWS S3 bucket (for file storage)

## Quick Start

1. **Clone and setup environment**:

   ```bash
   git clone https://github.com/LynxPardelle/portfolioLynxPardelle.git
   cd portfolioLynxPardelle
   cp .example.env .env
   ```

2. **Configure environment** (edit `.env`):

   ```bash
   # Database
   MONGO_URI=mongodb://database_user:portfolio_pass@mongo:27017/lynx_portfolio?authSource=admin
   
   # Authentication
   JWT_SECRET=your-secure-jwt-secret-change-this
   
   # S3 Storage (Required)
   S3_BUCKET_NAME=your-s3-bucket
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=your-access-key
   S3_SECRET_ACCESS_KEY=your-secret-key
   
   # Application
   DEV_PORT=6164
   PROD_PORT=6165
   CORS_ORIGIN=http://localhost:3000
   ```

3. **Start development**:

   ```bash
   make dev
   ```

The application will be available at `http://localhost:6164`.

## Development Workflow

### Available Commands

```bash
# Development
make dev              # Start development server
make dev-detached     # Start in background
make dev-logs         # View development logs
make dev-shell        # Access development container

# Production
make prod             # Start production server
make prod-detached    # Start in background
make prod-logs        # View production logs

# Testing
make test             # Run tests
make test-logs        # View test logs

# Database & Backups
make backup           # Backup MongoDB to S3
make restore          # Restore from latest S3 backup

# Utilities
make clean            # Clean containers and images
make health           # Check service health
```

### Project Structure

```text
portfolioLynxPardelle/
├── controllers/      # API controllers
├── models/          # MongoDB models
├── routes/          # API routes
├── services/        # Business logic services
├── middlewares/     # Express middlewares
├── docs/           # Documentation
├── scripts/        # Utility scripts
├── tests/          # Test files
├── app.js          # Express app configuration
├── index.js        # Server entry point
└── Makefile        # Development commands
```

## Configuration

### Required Environment Variables

**Database:**

- `MONGO_URI` - MongoDB connection string
- `MONGO_APP_DB` - Database name (default: lynx_portfolio)
- `MONGO_APP_USER` - Database user
- `MONGO_APP_PASSWORD` - Database password

**Authentication:**

- `JWT_SECRET` - JWT signing secret (change for production!)
- `CORS_ORIGIN` - Allowed origins for CORS

**S3 Storage:**

- `S3_BUCKET_NAME` - S3 bucket for file storage
- `S3_REGION` - AWS region
- `S3_ACCESS_KEY_ID` - AWS access key
- `S3_SECRET_ACCESS_KEY` - AWS secret key

**Application:**

- `NODE_ENV` - Environment (development/production)
- `DEV_PORT` - Development port (default: 6164)
- `PROD_PORT` - Production port (default: 6165)

### Optional Variables

**CloudFront CDN:**

- `CLOUDFRONT_DOMAIN` - CDN domain
- `CLOUDFRONT_DISTRIBUTION_ID` - Distribution ID

**MongoDB Backups:**

- `MONGO_BACKUP_KEEP` - Backup retention count (default: 4)

## Architecture Overview

### Core Components

- **Express.js API**: RESTful API server
- **MongoDB**: Document database with Mongoose ODM
- **S3 Storage**: File uploads and static assets
- **JWT Authentication**: Secure API access
- **Docker**: Containerized deployment

### Key Services

**S3Service (`services/s3.js`):**
- File uploads and downloads
- CDN integration
- Automatic cleanup

**Authentication (`middlewares/authenticated.js`):**
- JWT token validation
- Admin role checking

**Health Monitoring:**
- `/health` - Basic health check
- `/api/main/s3-status` - S3 service status

## API Endpoints

### Authentication

- `POST /api/main/login` - User login
- `POST /api/main/register` - User registration

### File Management

- `POST /api/main/upload-file-*` - File uploads
- `GET /api/main/get-file/:id` - File access (redirects to S3)

### Content Management

- `GET /api/main/*` - Portfolio content endpoints
- `GET/POST/PUT/DELETE /api/article/*` - Article management

## Testing

Run the test suite:

```bash
make test
```

Individual test categories:

```bash
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:performance   # Performance tests
```

## Deployment

### Development Deployment
```bash
make dev
```

### Production Deployment
```bash
make prod
```

### Standalone Services

For Dokploy or similar platforms, use individual compose files:
```bash
docker compose -f docker-compose.app.yml up      # App only
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml up    # Database + backups
```

## Health Checks

**Application Health:**
```bash
curl http://localhost:6164/health
```

**S3 Service Health:**
```bash
curl http://localhost:6164/api/main/s3-status
```

## Troubleshooting

**Container won't start:**
- Check Docker is running
- Verify `.env` file exists and is configured
- Check port availability: `lsof -i :6164`

**Database connection issues:**
- Verify MongoDB container is running: `docker ps`
- Check MongoDB logs: `make mongo-logs`
- Validate connection string in `.env`

**File upload failures:**
- Check S3 configuration: `GET /api/main/s3-status`
- Verify S3 bucket permissions
- Check AWS credentials

**Authentication issues:**
- Verify `JWT_SECRET` is set
- Check CORS configuration for frontend domain
- Validate user credentials

## Security Notes

- Change `JWT_SECRET` for production deployments
- Use IAM roles instead of access keys in production
- Enable S3 bucket versioning and backup
- Regularly rotate AWS credentials
- Keep dependencies updated: `npm audit`

## Next Steps

- Review [S3 Storage Integration](s3-storage.md) for file handling
- Check [MongoDB Backup](mongodb-backup-s3.md) for backup procedures
- See project conventions in [Project Conventions](project-conventions.md)