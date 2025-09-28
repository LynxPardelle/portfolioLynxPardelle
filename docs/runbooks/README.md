# Portfolio Operations Guide

Quick reference for managing the Lynx Pardelle Portfolio backend operations.

## 🚀 Quick Commands

### Health Checks
```bash
# Check if everything is running
curl http://localhost:6164/health  # development
curl http://localhost:6165/health  # production
make status                        # container status

# Check S3 and CDN
npm run s3:health                  # S3 bucket diagnostics
make cdn-health                    # Complete CDN health check
npm run cdn:status                 # configuration overview
```

### Fix Common Issues
```bash
# Clear CDN cache
make cf-invalidate PATHS="/images/*"          # clear specific paths
make cf-invalidate-dry-run PATHS="/test/*"   # test first

# Restart services
make dev-restart                   # development
make prod-restart                  # production

# Check logs
make logs                          # all services
docker logs lynx-portfolio-back-prod --tail=50
```

## 📚 Available Guides

### Operations Guides

**[Incident Response Guide](incident-response-guide.md)**  
What to do when something breaks - health checks, common fixes, troubleshooting steps.

**[Cache Invalidation Runbook](cache-invalidation-runbook.md)**  
How to clear CloudFront cache when you update files.

**[CDN Operations Automation Guide](cdn-operations-automation.md)**  
Complete reference for automation scripts and tools.

### Security & Maintenance

**[Credential Rotation Playbook](credential-rotation-playbook.md)**  
How to rotate AWS keys and manage access credentials.

**[Documentation Hygiene Guidelines](documentation-hygiene-guidelines.md)**  
Standards for keeping docs up to date.

**[Training & Distribution Guide](training-distribution-guide.md)**  
Onboarding and learning resources.

## 🛠 Useful Commands

### Alternative Ways to Run Commands

**Using Make (easiest):**
```bash
make cdn-health                 # Complete CDN health check
make s3-health                  # S3 bucket diagnostics
make cf-invalidate PATHS="/images/*"  # Clear cache
```

**Using NPM scripts:**
```bash
npm run s3:health               # S3 diagnostics
npm run cdn:status              # Configuration overview  
npm run cdn:invalidate          # Cache invalidation
```

**Using scripts directly:**
```bash
node utility/check-s3-health.js --detailed
node utility/create-media-backup.js --paths="/css/*"
```

## 🚨 Need Help?

If you run into problems:

1. **Check the logs first:** `make logs`
2. **Try restarting:** `make prod-restart`
3. **Look at the incident guide:** [incident-response-guide.md](incident-response-guide.md)
4. **Check AWS status:** Visit AWS status page
5. **Ask for help:** Create an issue or ask other developers

## 📊 Monitoring

### Key Health Endpoints

- **Application:** `http://localhost:6165/health`
- **Development:** `http://localhost:6164/health`
- **Monitoring Dashboard:** `http://localhost:6164/api/monitoring/dashboard`

### What to Watch For

- Health endpoints return 200 OK
- S3 bucket is accessible
- CDN cache hit ratio >85%
- Response times <500ms

## 🔍 Common Problems

### CDN assets not loading
1. Check health: `make cdn-health`
2. Test S3 access: `npm run s3:health`
3. Clear cache: `make cf-invalidate PATHS="/*"`
4. See: [Incident Response Guide](incident-response-guide.md)

### File uploads failing
1. Check S3: `npm run s3:health`
2. Verify credentials in `.env`
3. Check bucket permissions
4. See: [Incident Response Guide](incident-response-guide.md)

### Site is slow
1. Check app: `curl http://localhost:6165/health`
2. Check resources: `docker stats lynx-portfolio-back-prod`
3. Restart if needed: `make prod-restart`

### Authentication errors
1. Test AWS access: `aws sts get-caller-identity`
2. Check credentials in `.env`
3. See: [Credential Rotation Guide](credential-rotation-playbook.md)

---

**Last Updated**: September 27, 2025  
**Quick Links**: [Health Checks](#-quick-commands) | [Guides](#-available-guides) | [Commands](#-useful-commands)