# Developer Getting Started Guide

Quick guide for new developers working on the Lynx Pardelle Portfolio project.

## Overview

This guide helps you get up to speed with the portfolio backend, its tools, and operations. Focus on practical skills you'll actually need.

## Getting Started

### Day 1: Environment Setup

**Clone and setup the project:**

```bash
git clone https://github.com/LynxPardelle/portfolioLynxPardelle.git
cd portfolioLynxPardelle

# Set up environment variables
cp .env.example .env
# Add your AWS credentials and MongoDB connection

# Install dependencies
npm install

# Test the setup
npm run s3:health
make status
```

### Day 2-3: Learn the Basics

**Read these guides:**

- [Incident Response Guide](incident-response-guide.md) - What to do when things break
- [Cache Invalidation Runbook](cache-invalidation-runbook.md) - How to clear CDN cache
- Project README for architecture overview

**Try basic commands:**

```bash
# Check if everything is running
curl http://localhost:6164/health  # development
curl http://localhost:6165/health  # production

# Test S3 and CDN
npm run s3:health
make cdn-health
npm run cdn:status

# Practice cache invalidation (safe)
make cf-invalidate-dry-run PATHS="/test/*"
```

### Day 4-5: Practice and Troubleshooting

**Practice common tasks:**

- Start/stop the development environment
- Check logs when something goes wrong
- Clear CDN cache for updated files
- Use the incident response guide for problems

## Setup Checklist

### Technical Setup

**Development Environment:**

- [ ] Git repository cloned and configured
- [ ] Environment variables configured (`.env` file)
- [ ] Node.js and npm dependencies installed
- [ ] Docker environment tested
- [ ] Basic commands working

**Access and Permissions:**

- [ ] AWS credentials configured
- [ ] GitHub repository access
- [ ] MongoDB connection working

**Knowledge Validation:**

- [ ] Read the main runbooks
- [ ] Tested basic commands successfully
- [ ] Know where to find help when needed

## Learning Resources

### Documentation to Read

**Essential guides:**

1. [Incident Response Guide](incident-response-guide.md) - Troubleshooting when things break
2. [Cache Invalidation Runbook](cache-invalidation-runbook.md) - Clearing CDN cache
3. Project README - Architecture and setup overview

### Useful Skills to Develop

**Basic AWS knowledge:**

- Understanding S3 buckets and CloudFront
- Basic AWS CLI commands
- AWS security concepts

**Development skills:**

- Docker basics
- Node.js/Express fundamentals
- MongoDB basics
- Basic Linux/terminal commands

## Common Tasks You'll Need to Know

### Daily Operations

**Health checks:**
```bash
# Check if everything is running
curl http://localhost:6165/health
make status
```

**Basic troubleshooting:**
- Check logs: `make logs`
- Restart services: `make prod-restart`
- Test S3 connection: `npm run s3:health`

### Weekly/Monthly Tasks

**Cache invalidation when you update files:**
```bash
# Safe test first
make cf-invalidate-dry-run PATHS="/images/*"

# Then do it for real
make cf-invalidate PATHS="/images/*"
```

**General maintenance:**
- Update dependencies
- Check for security updates
- Review logs for errors
- Test backup procedures

## Getting Help

### When You Need Help

**First steps:**
1. Check the [Incident Response Guide](incident-response-guide.md)
2. Look at the logs: `make logs`
3. Try the basic fixes (restart, check health)

**Still stuck?**
- Ask other developers on the project
- Create an issue in GitHub
- Check AWS status page for service outages
- Search online for similar problems

### Key Resources

**Essential documentation:**
- [README.md](../../README.md) - Project overview and setup
- [Incident Response Guide](incident-response-guide.md) - Troubleshooting
- [Cache Invalidation Runbook](cache-invalidation-runbook.md) - CDN operations

**Online resources:**
- AWS documentation
- Node.js/Express documentation
- MongoDB documentation
- Docker documentation

---

**Last Updated**: September 27, 2025  
**For**: New developers working on the Lynx Pardelle Portfolio project