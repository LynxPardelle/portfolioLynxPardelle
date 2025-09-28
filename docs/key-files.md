# Key Files & Directories

This document provides an overview of the most important files and directories for understanding and working with the project.

## Core Application Files

**Main Entry Points:**

- `app.js` - Express application setup, middleware, routes, and CORS configuration
- `index.js` - Server startup, MongoDB connection, health endpoint, and graceful shutdown

**API Structure:**

- `routes/` - API route definitions (`main.js`, `article.js`, `performance.js`, etc.)
- `controllers/` - Business logic handlers (`main.js`, `article.js`)
- `middlewares/` - Authentication and authorization middleware (`authenticated.js`, `is_admin.js`)

**Data Layer:**

- `models/` - MongoDB schemas (Album, Article, File, etc.) and `_defineIndexes.js`
- `populate/` - Database population scripts and utilities

## Infrastructure & Configuration

**Docker & Deployment:**

- `docker-compose.yml` - Main orchestration with multiple profiles (dev, prod, nginx, test)
- `docker-compose.*.yml` - Standalone services for Dokploy deployment
- `Dockerfile` - Multi-stage container build configuration
- `nginx.conf` - Production reverse proxy with security and performance optimizations

**Automation & Scripts:**

- `Makefile` - Development workflow automation (build, test, deploy, backup)
- `scripts/` - MongoDB backup/restore to S3, health checks, CDN management
- `package.json` - Dependencies, scripts, and project metadata

## Services & Utilities

**Core Services:**

- `services/` - S3 integration, JWT handling, email, monitoring, and deployment automation
- `utility/` - File processing, data migration, and helper functions

**Testing:**

- `tests/` - Unit, integration, and performance test suites
- `jest.config.js` - Testing framework configuration

## Configuration & Environment

**Environment Setup:**

- `.example.env` - Template for environment variables with documentation
- `ecosystem.config.js` - PM2 process management configuration

**Database:**

- `database_init/` - Initial MongoDB data and migration scripts
- `mongo-init/` - Database initialization and user creation scripts

## Logs & Data

**Runtime Data:**

- `logs/` - Application logs, migration history, and operation records
- `mongo_backups/` - Local backup storage with retention policies

## Documentation

**Project Documentation:**

- `docs/` - Comprehensive guides for architecture, deployment, and operations
- `README.md` - Project overview and documentation index

## Key Directories to Know

**For Development:**

- Start with `app.js` and `index.js` to understand application flow
- Check `routes/` and `controllers/` for API endpoints
- Review `models/` for data structure
- Use `Makefile` for common development tasks

**For Deployment:**

- Configure environment using `.example.env` as template
- Use appropriate `docker-compose.*.yml` for your deployment target
- Check `nginx.conf` for production proxy settings
- Review `scripts/` for backup and maintenance operations

**For Operations:**

- Monitor `logs/` for application behavior
- Use `scripts/` for backup and S3 operations
- Check `services/` for monitoring and deployment automation
