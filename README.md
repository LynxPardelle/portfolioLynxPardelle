# LynxPardelle Portfolio

Node.js/Express portfolio application with MongoDB and S3 storage.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/LynxPardelle/portfolioLynxPardelle.git
cd portfolioLynxPardelle
cp .example.env .env

# Configure .env with your settings
# Start development
make dev
```

Application available at http://localhost:6164

## Documentation

### Essential Guides

- [Developer Setup](docs/developer-guide.md) - Complete setup and development guide
- [Operations Guide](docs/operations.md) - Deployment, monitoring, and troubleshooting
- [S3 Storage](docs/s3-storage.md) - File storage and backup integration

### Reference

- [Architecture Overview](docs/architecture-overview.md) - System architecture
- [Project Conventions](docs/project-conventions.md) - Coding standards
- [MongoDB Backup](docs/mongodb-backup-s3.md) - Database backup procedures
- [Docker Services](docs/docker-compose-services.md) - Container orchestration
- [Health Monitoring](docs/health-endpoint.md) - Health check endpoints
- [Integration Points](docs/integration-points.md) - System integrations
- [Key Files](docs/key-files.md) - Important project files
- [Security](docs/mongo-production-security.md) - Production security

## Architecture

- Backend: Node.js/Express REST API
- Database: MongoDB with Mongoose ODM
- Storage: AWS S3 for all file uploads
- Authentication: JWT-based auth system
- Deployment: Docker containers with Docker Compose

## Key Features

- Portfolio content management
- File upload system with S3 integration
- User authentication and admin controls
- Automated MongoDB backups to S3
- Health monitoring endpoints
- CloudFront CDN support (optional)

## Development Commands

```bash
make dev              # Start development server
make prod             # Start production server
make test             # Run tests
make backup           # Backup database to S3
make restore          # Restore from S3 backup
make health           # Check system health
```

## Environment Setup

Required environment variables:

```bash
# Database
MONGO_URI=mongodb://user:pass@mongo:27017/lynx_portfolio?authSource=admin

# Authentication
JWT_SECRET=your-secure-secret

# S3 Storage
S3_BUCKET_NAME=your-s3-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# Application
DEV_PORT=6164
PROD_PORT=6165
```

## Health Checks

- Application: http://localhost:6164/health
- S3 Service: http://localhost:6164/api/main/s3-status

## License

MIT
