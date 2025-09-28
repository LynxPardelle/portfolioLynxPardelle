# CDN Operations Guide

## What This Covers

This guide covers three main CDN automation tools:

- **CloudFront Invalidation**: Clear cached content
- **S3 Health Checks**: Monitor bucket status  
- **Media Backups**: Save database snapshots to S3

## Setup

### Environment Variables

Add these to your `.env` file:

```bash
# AWS Configuration
S3_BUCKET_NAME=your-s3-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id

# MongoDB
MONGO_URI=mongodb://user:pass@host:port/database
```

### Quick Setup

```bash
# Install dependencies
npm install

# Create log directories
mkdir -p logs/operations

# Set up automation (optional)
./scripts/setup-cdn-automation.sh     # Linux/macOS
.\scripts\setup-cdn-automation.ps1    # Windows
```

## 1. CloudFront Cache Invalidation

**Purpose**: Clear cached content from CloudFront edge servers.

### Commands

```bash
# Make targets
make cf-invalidate PATHS="/images/*,/css/*"
make cf-invalidate-dry-run PATHS="/uploads/*"

# NPM scripts  
npm run cdn:invalidate -- --paths="/images/*,/css/*"
npm run cdn:invalidate:dry-run -- --paths="/uploads/*"

# Direct script
node utility/create-media-backup.js --paths="/images/*" --log
node utility/create-media-backup.js --file=paths.txt --dry-run
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--paths="path1,path2"` | Paths to invalidate | `--paths="/images/*,/css/*"` |
| `--file=filename` | Read paths from file | `--file=paths.txt` |
| `--dry-run` | Preview without executing | `--dry-run` |
| `--log` | Enable logging | `--log` |

### AWS Limits

- Max paths per request: 3,000
- Max requests per month: 1,000 (free tier)
- Script automatically batches large requests
- 2-second delay between batches

## 2. S3 Health Check

**Purpose**: Monitor S3 bucket health and configuration.

### Commands

```bash
# Make targets
make s3-health
make s3-health-report

# NPM scripts
npm run s3:health
npm run s3:health:detailed

# Direct script
node utility/check-s3-health.js
node utility/check-s3-health.js --detailed --log
```

### What It Checks

- **Bucket Access**: Connectivity and permissions
- **Encryption**: Server-side encryption status
- **Versioning**: Version control configuration
- **Usage**: Object count and storage size
- **Lifecycle**: Automated cleanup policies

### Health Status

- 🟢 **Excellent**: All checks passed
- 🟡 **Good**: Minor warnings
- 🟠 **Warning**: Issues need attention
- 🔴 **Unhealthy**: Investigation required
- 💀 **Critical**: Immediate action needed

## 3. Media Backup

**Purpose**: Create database backups and store them in S3.

### Commands

```bash
# Make targets
make media-backup
make media-backup-dry-run

# NPM scripts
npm run cdn:backup
npm run cdn:backup:dry-run

# Direct script
node utility/create-media-backup.js
node utility/create-media-backup.js --retention=30 --log
```

### What Gets Backed Up

Collections that contain file references:
- `files` - File metadata
- `songs` - Music files
- `videos` - Video files  
- `bookImgs` - Book covers
- `albums` - Album information
- `websites` - Website projects
- `articles` - Article content

### Backup Storage

Backups are stored in S3 with this structure:

```
backups/media/
├── production/
│   ├── 2025-09-27/
│   │   ├── media-backup-2025-09-27-10-00-00.json
│   │   └── media-backup-2025-09-27-16-30-00.json
│   └── 2025-09-28/
└── development/
```

## Scheduled Operations (Optional)

### Setup Automation

```bash
# Linux/macOS
./scripts/setup-cdn-automation.sh

# Windows  
.\scripts\setup-cdn-automation.ps1
```

### Schedule

| Task | Frequency | Purpose |
|------|-----------|---------|
| Health Check | Daily 6:00 AM | Monitor S3 status |
| Media Backup | Weekly Sunday 2:00 AM | Create backups |
| Log Rotation | Daily 11:00 PM | Clean old logs |

## Troubleshooting

### Common Issues

#### "AccessDenied" Error
**Problem**: Missing AWS permissions

**Solution**:
1. Check AWS credentials in `.env`
2. Verify IAM permissions for CloudFront/S3
3. Confirm distribution/bucket IDs are correct

#### "TooManyInvalidationsInProgress" Error
**Problem**: AWS limit of 3 concurrent invalidations

**Solution**: Wait for current invalidations to complete

#### "NoSuchBucket" Error
**Problem**: S3 bucket not found

**Solution**: Verify `S3_BUCKET_NAME` in `.env`

#### MongoDB Connection Failed
**Problem**: Cannot connect to database

**Solution**: Check `MONGO_URI` and database availability

### Log Locations

```
logs/
├── operations/           # Script execution logs
│   ├── cloudfront-invalidation-2025-09-27.log
│   ├── s3-health-2025-09-27.log
│   └── media-backup-2025-09-27.log
└── scheduled/           # Automated task logs
    ├── daily-health-2025-09-27.log
    └── weekly-backup-2025-09-27.log
```

## Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use AWS IAM roles instead of access keys when possible
- Rotate credentials regularly

### Required AWS Permissions

**Minimum CloudFront permissions**:
- `cloudfront:CreateInvalidation`
- `cloudfront:GetInvalidation`

**Minimum S3 permissions**:
- `s3:GetBucketLocation`
- `s3:GetBucketEncryption` 
- `s3:GetBucketVersioning`
- `s3:ListBucket`
- `s3:PutObject`
- `s3:PutObjectTagging`

## Quick Reference

| Task | Command |
|------|---------|
| Invalidate cache | `make cf-invalidate PATHS="/path/*"` |
| Check S3 health | `make s3-health` |
| Create backup | `make media-backup` |
| View logs | `ls logs/operations/` |
| Test command | Add `--dry-run` to any script |

## Tips

- Always test with `--dry-run` first
- Use wildcards to batch invalidations: `/css/*` not individual files
- Monitor AWS costs - invalidations cost $0.005 per path after 1,000 free
- Check logs if something fails
- Enable logging with `--log` for debugging

## Getting Help

1. Use `--help` option with any script
2. Check logs in `logs/operations/`
3. Test changes with `--dry-run` mode
4. Refer to AWS documentation for service limits
