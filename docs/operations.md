# Operations Guide

Essential operational procedures for the LynxPardelle portfolio application.

## Health Monitoring

### Health Checks

**Application Health:**
```bash
curl http://localhost:6164/health
```

**S3 Service Status:**
```bash
curl http://localhost:6164/api/main/s3-status
```

**Service Status:**
```bash
docker ps                          # Check running containers
make health                        # Overall system health
```

### Key Metrics to Monitor

- **Application**: HTTP response times, error rates
- **S3 Storage**: Upload success rate, file serving
- **Database**: Connection status, query performance
- **CDN**: Cache hit rates, error rates (if CloudFront configured)

## Deployment

### Pre-Deployment

1. **Backup Database:**
   ```bash
   make backup
   ```

2. **Verify Configuration:**
   ```bash
   # Check environment variables
   docker compose config
   
   # Validate S3 access
   curl http://localhost:6164/api/main/s3-status
   ```

3. **Test in Development:**
   ```bash
   make dev
   # Verify all functionality works
   ```

### Deployment Process

1. **Stop Current Services:**
   ```bash
   make clean
   ```

2. **Deploy New Version:**
   ```bash
   make prod
   ```

3. **Verify Deployment:**
   ```bash
   # Wait for services to start (30-60 seconds)
   curl http://localhost:6165/health
   
   # Test file upload/download
   curl http://localhost:6165/api/main/s3-status
   ```

### Post-Deployment Monitoring

Monitor for **24-48 hours** after deployment:

- Check error logs: `make prod-logs`
- Monitor file uploads and S3 operations
- Verify CDN performance (if configured)
- Watch for any user-reported issues

## Rollback Procedures

### When to Rollback

- Health checks failing
- High error rates (>5%)
- S3 integration failures
- Critical functionality broken

### Quick Rollback

1. **Stop Current Version:**
   ```bash
   docker compose down
   ```

2. **Revert to Previous Version:**
   ```bash
   git checkout previous-stable-commit
   make prod
   ```

3. **Verify Rollback:**
   ```bash
   curl http://localhost:6165/health
   ```

### Database Rollback

If database changes are involved:

```bash
# Restore from latest backup (unified container)
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml exec mongo-unified /opt/mongo-unified/scripts/restore_mongo_from_s3.sh

# Or run an explicit restore command with options
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml exec mongo-unified /opt/mongo-unified/scripts/restore_mongo_from_s3.sh --db "$MONGO_APP_DB"
```

## Backup & Recovery

### Automated Backups

- **Schedule**: Daily at 2 AM and Weekly on Sundays at 3 AM (configurable via `BACKUP_SCHEDULE_DAILY`/`BACKUP_SCHEDULE_WEEKLY`)
- **Retention**: 4 backups (configurable with `MONGO_BACKUP_KEEP`)
- **Location**: S3 bucket under `backups/` prefix

### Manual Backup

```bash
# Create immediate backup (manual)
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml exec mongo-unified /opt/mongo-unified/scripts/backup_mongo_to_s3.sh manual

# Check container logs
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml logs -f mongo-unified
```

### Recovery

```bash
# Restore from latest backup
make restore

# List available backups
aws s3 ls s3://your-bucket/backups/
```

## Troubleshooting

### Common Issues

**Application Won't Start:**
- Check Docker is running: `docker ps`
- Verify `.env` file exists and is configured
- Check port conflicts: `lsof -i :6165`
- Review logs: `make prod-logs`

**Database Connection Issues:**
- Check MongoDB container: `docker ps | grep mongo`
- Verify connection string in `.env`
- Check MongoDB logs: `docker compose logs mongo`

**File Upload Failures:**
- Check S3 status: `curl http://localhost:6165/api/main/s3-status`
- Verify S3 bucket permissions
- Check AWS credentials are valid
- Review S3 service logs

**High Error Rates:**
- Check application logs: `make prod-logs`
- Monitor S3 and CDN metrics
- Verify database performance
- Consider rollback if errors persist

### Log Analysis

**Application Logs:**
```bash
make prod-logs              # All application logs
docker compose logs app     # Application container only
```

**Database Logs:**
```bash
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml logs mongo-unified
```

**Backup Logs:**
```bash
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml logs -f mongo-unified
```

## Security

### Regular Tasks

- **Rotate AWS Credentials**: Every 90 days
- **Update Dependencies**: Monthly security updates
- **Review Access Logs**: Weekly S3 and application log review
- **Backup Verification**: Monthly restore testing

### Security Monitoring

- Monitor failed login attempts
- Watch for unusual S3 access patterns
- Check for unauthorized API calls
- Review file upload patterns

## Maintenance

### Weekly Tasks

- Review error logs
- Check backup completion
- Monitor disk space usage
- Verify S3 storage costs

### Monthly Tasks

- Update dependencies: `npm audit fix`
- Rotate AWS credentials
- Review and clean old backups
- Performance analysis

### Quarterly Tasks

- Security audit
- Capacity planning review
- Disaster recovery testing
- Documentation updates

## Emergency Contacts

**Immediate Response:**
- Check service status: `make health`
- Review recent logs: `make prod-logs | tail -100`
- Consider rollback if critical issues

**Escalation:**
- Document incident details
- Preserve logs for analysis
- Notify stakeholders if user-facing impact

## Monitoring Dashboard

Access real-time monitoring at:
- Application health: `http://localhost:6165/health`
- S3 service status: `http://localhost:6165/api/main/s3-status`
- Docker status: `docker stats`