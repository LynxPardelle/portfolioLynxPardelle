# Incident Response Guide

## Overview

Quick troubleshooting guide for the Lynx Pardelle Portfolio backend when things go wrong.

**Goals:**
- Fix problems quickly
- Get the site back online
- Learn what happened

## Problem Severity

### 🚨 Critical - Fix Now
- Site completely down
- Database unreachable
- No one can access the portfolio

### ⚠️ Important - Fix Soon
- Some features broken
- Slow performance
- File uploads failing

### 📝 Minor - Fix When Possible
- Small display issues
- Development environment problems

## First Steps When Something Breaks

### 1. Check if the Site is Running

```bash
# Check main health endpoint
curl http://localhost:6164/health  # development
curl http://localhost:6165/health  # production

# Quick status check
make status
```

### 2. Check What's Broken

- Can users load the portfolio site?
- Are file uploads working?
- Is the database connected?

### 3. Look at the Logs

```bash
# Check application logs
docker logs lynx-portfolio-back-prod --tail=50
docker logs lynx-portfolio-back-dev --tail=50

# Check all services
make logs
```

## Common Problems & Quick Fixes

### Site Won't Load

**Check:** Is the application running?

```bash
# Check container status
make status

# Restart if needed
make prod-restart  # for production
make dev-restart   # for development
```

### Files Can't Upload

**Check:** S3 and CDN status

```bash
# Check S3 configuration
npm run s3:health

# Check CDN status  
npm run cdn:status

# Clear CDN cache if needed
make cf-invalidate PATHS="/*"
```

### Database Issues

**Check:** MongoDB connection

```bash
# Check health endpoint (shows database status)
curl http://localhost:6165/health

# Check MongoDB directly
docker exec lynx-portfolio-back-mongo mongosh --eval "db.runCommand({ping: 1})"
```

### Site is Slow

**Check:** Container resources

```bash
# Check resource usage
docker stats lynx-portfolio-back-prod

# Check response times
time curl -s http://localhost:6165/health
```

## After Fixing the Problem

### 1. Verify Everything Works

```bash
# Test main functionality
curl http://localhost:6165/health
npm run s3:health
npm run cdn:status

# Check logs for errors
make logs
```

### 2. Monitor for a While

Watch for 30-60 minutes to make sure:

- No new errors in logs
- Site performance is normal
- Everything stays working

### 3. Document What Happened

Write down:

- What broke and when
- What caused it
- How you fixed it
- How to prevent it next time

## Need Help?

### When to Get Help

- Security issues
- Data loss or corruption
- Site down for more than 1 hour
- You're not sure what's wrong

### How to Get Help

1. Check if it's a widespread issue (AWS status page)
2. Search online for similar problems
3. Ask for help from other developers
4. Document what you've tried

## Quick Command Reference

### Check if Everything is Running

```bash
# Health checks
curl http://localhost:6164/health  # dev
curl http://localhost:6165/health  # prod
make status

# S3 and CDN status
npm run s3:health
npm run cdn:status
```

### Restart Services

```bash
# Restart development
make dev-restart

# Restart production  
make prod-restart

# Check logs
make logs
```

### Clear CDN Cache

```bash
# Clear all cached files
make cf-invalidate PATHS="/*"

# Clear specific paths
make cf-invalidate PATHS="/images/*,/css/*"
```

## Prevention Tips

### Daily Checks

- Check logs for warnings
- Verify health endpoints work
- Test file uploads occasionally

### Keep Things Updated

- Update dependencies regularly
- Keep documentation current
- Monitor resource usage

### Stay Prepared

- Know where the logs are
- Know how to restart services
- Keep this guide updated

## Remember

- Stay calm and work step by step
- Check the simple things first
- Document what you do
- Ask for help when needed
- Learn from each incident
