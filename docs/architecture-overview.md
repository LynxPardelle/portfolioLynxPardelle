# Architecture Overview

## Technology Stack

**Backend:** Node.js/Express API serving REST endpoints  
**Database:** MongoDB with Mongoose ODM  
**File Storage:** AWS S3 with CloudFront CDN  
**Deployment:** Dokploy with separate Docker stacks  
**Automation:** Makefile commands and Docker Compose profiles  

## Core Components

### API Layer
- **Entry Points:** `app.js` (Express setup), `index.js` (server + DB connection)
- **Routes:** `/api/main` and `/api/article` endpoints in `routes/`
- **Controllers:** Business logic in `controllers/main.js` and `controllers/article.js`  
- **Models:** MongoDB schemas in `models/` (Album, Article, File, etc.)

### File Management
- **Storage:** S3-first with CloudFront CDN for asset delivery
- **Upload Processing:** `services/utility.js` handles file uploads to S3
- **File Metadata:** Stored in MongoDB, files served from CDN URLs
- **Fallback:** Local storage if S3 not configured

### Infrastructure
- **Development:** Hot-reload with `make dev` (port 6164)
- **Production:** Dokploy deployment with separate stacks (port 6165)  
- **Database:** MongoDB container with automated S3 backups
- **Networking:** Shared Docker network for inter-stack communication

## Key Directories

```
├── controllers/     # API business logic
├── routes/         # Express route definitions  
├── models/         # MongoDB/Mongoose schemas
├── services/       # Utilities (S3, email, JWT, etc.)
├── scripts/        # Automation (backups, health checks)
├── docs/           # Project documentation
└── tests/          # Test suites and fixtures
```

## Environment & Configuration

**Required Variables:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Authentication token secret

**Optional (S3/CDN):**
- `S3_BUCKET_NAME`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `CLOUDFRONT_DOMAIN`, `CLOUDFRONT_DISTRIBUTION_ID`

**Development:**
- Copy `.env.example` to `.env` and configure
- Use `make dev` to start with hot-reload
- Health check: `curl http://localhost:6164/health`

**Production Deployment (Dokploy):**
- Deploy separate stacks: MongoDB → Backend App → Backups (optional)
- Uses shared Docker network for inter-stack communication
- Direct app exposure on port 6165 (no nginx required)
- Automatic health checks and container management

See [Dokploy Deployment Guide](dokploy.md) for complete deployment instructions and [Environment Configuration](env-configuration.md) for configuration details.
