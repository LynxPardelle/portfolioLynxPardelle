# MongoDB Production Security

This guide covers security best practices for MongoDB deployment in production environments.

## Required Security Configuration

**Essential Environment Variables:**

- `MONGO_INITDB_ROOT_PASSWORD` - Strong password for MongoDB root user
- `MONGO_APP_PASSWORD` - Dedicated password for application database user
- `MONGO_APP_USER` - Application-specific database user (not root)
- `MONGO_RESTORE_ON_INIT` - Set to `false` in production (default: `true`)

**Password Requirements:**
Use long, random passwords (minimum 16 characters) with mixed characters. Never use default values in production.

## Network & Access Security

**Container Network Isolation:**

- MongoDB runs on internal Docker network (`lynx-portfolio-back-network`)
- Only application containers can access the database
- External access restricted to specified port mapping

**Authentication:**

- Root user authentication enforced by MongoDB Docker image
- Application uses dedicated user with `readWrite` permissions only
- User created automatically via initialization scripts

**Database Access Control:**

- Application user has access only to `lynx_portfolio` and test databases
- Root user credentials separate from application credentials
- Connection uses `authSource=admin` parameter

## Production Deployment Checklist

**Before Production:**

- [ ] Generate strong, unique passwords for `MONGO_INITDB_ROOT_PASSWORD` and `MONGO_APP_PASSWORD`
- [ ] Set `MONGO_RESTORE_ON_INIT=false` unless restoring from backup
- [ ] Verify only necessary ports are exposed (default: 27017)
- [ ] Secure backup credentials and S3 access keys
- [ ] Test database connectivity using application user (not root)

**Ongoing Security:**

- [ ] Rotate passwords regularly
- [ ] Monitor database access logs
- [ ] Keep MongoDB version updated
- [ ] Review backup access permissions

## Backup Security

**S3 Credentials:**

- Store AWS access keys securely (use IAM roles when possible)
- Restrict S3 bucket permissions to backup operations only
- Enable S3 bucket encryption and versioning

**Backup Access:**

- Backup scripts use dedicated MongoDB user credentials
- Local backup files stored in protected volumes
- Automated cleanup of old backup files

## Current Security Features

**Implemented:**

- Authentication required for all database connections
- Dedicated application user with minimal permissions
- Network isolation using Docker networks
- Automated user creation during initialization
- Secure backup system with S3 integration

**Optional Enhancements:**

- TLS/SSL encryption (requires certificate management)
- Additional network firewalls
- Database audit logging
- Advanced monitoring and alerting

## Configuration Files

**Database Configuration:**

- `docker-compose.mongo.yml` - MongoDB service configuration
- `mongo-init/create-app-user.js` - User creation script
- `Dockerfile.mongo` - Container security settings

**Reference Documentation:**

- [Environment Configuration](env-configuration.md) - Complete variable reference
- [MongoDB Backup to S3](mongodb-backup-s3.md) - Backup system security