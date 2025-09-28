# CloudFront Cache Invalidation Guide

## What This Does

Cache invalidation clears cached content from CloudFront's edge servers, forcing them to fetch fresh content from your origin server.

**When to invalidate cache:**

- After updating CSS, JavaScript, or images
- When fixing critical bugs that are cached
- After deploying new content that must appear immediately
- During emergency rollbacks

## Setup

### Required Environment Variables

Add these to your `.env` file:

```bash
CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1
```

### Available Commands

- **Make**: `make cf-invalidate PATHS="/path/*"`
- **NPM**: `npm run cdn:invalidate -- --paths="/path/*"`
- **Direct**: `node utility/create-media-backup.js --paths="/path/*"`

## How to Invalidate

### Quick Start

```bash
# Test first (dry run)
make cf-invalidate-dry-run PATHS="/css/*"

# Run actual invalidation
make cf-invalidate PATHS="/css/*"
```

### Path Examples

```bash
# Single file
PATHS="/images/logo.png"

# Multiple files
PATHS="/css/styles.css,/js/app.js"

# All files in directory
PATHS="/uploads/*"

# Multiple directories
PATHS="/css/*,/js/*,/images/*"

# Everything (use sparingly)
PATHS="/*"
```

### Step-by-Step Process

1. **Identify what needs invalidating**

   ```bash
   # Check recent changes
   git diff --name-only HEAD~1 HEAD
   ```

2. **Test with dry run**

   ```bash
   make cf-invalidate-dry-run PATHS="/your/paths/*"
   ```

3. **Run invalidation**

   ```bash
   make cf-invalidate PATHS="/your/paths/*"
   ```

4. **Monitor progress**
   - Invalidations typically take 10-15 minutes
   - Check the AWS Console for real-time status

## Cost Optimization

**Path Limits:**

- First 1,000 invalidations per month: FREE
- Additional invalidations: $0.005 per path

**Best Practices:**

- Use wildcards instead of individual files: `/css/*` not `/css/file1.css,/css/file2.css`
- Batch related paths together
- Consider using versioned filenames to avoid invalidations

## Troubleshooting

### "AccessDenied" Error

**Problem:** Missing AWS permissions

**Solution:**

1. Check your AWS credentials in `.env`
2. Verify the distribution ID is correct
3. Ensure your AWS user has CloudFront invalidation permissions

### "TooManyInvalidationsInProgress" Error

**Problem:** AWS limit of 3 concurrent invalidations

**Solution:**

1. Wait for current invalidations to complete
2. Check status: `aws cloudfront list-invalidations --distribution-id $CLOUDFRONT_DISTRIBUTION_ID`

### "InvalidArgument" Path Errors

**Problem:** Invalid path format

**Solution:**

- Paths must start with `/`
- Wildcards only allowed at the end
- No spaces in paths (use quotes if needed)

### Slow Completion

**Problem:** Invalidation takes longer than expected

**Solution:**

1. Check AWS Service Health Dashboard
2. Wait up to 20 minutes before investigating
3. Verify with multiple test requests

## Advanced Usage

### File-Based Invalidation

```bash
# Create paths file
echo "/css/*" > paths.txt
echo "/js/*" >> paths.txt

# Run invalidation
node utility/create-media-backup.js --file paths.txt
```

### Logging and Monitoring

```bash
# Enable logging
make cf-invalidate PATHS="/css/*" --log

# Check logs
ls logs/operations/
```

### Integration with CI/CD

```bash
# In your deployment script
if git diff --name-only HEAD~1 HEAD | grep -E "\.(css|js)$"; then
    make cf-invalidate PATHS="/css/*,/js/*"
fi
```

## Quick Reference

| Task | Command |
|------|---------|
| Test invalidation | `make cf-invalidate-dry-run PATHS="/path/*"` |
| Run invalidation | `make cf-invalidate PATHS="/path/*"` |
| Check CDN status | `npm run cdn:status` |
| Health check | `make s3-health` |

## Emergency Procedures

### Critical Bug Fix

```bash
# Immediate invalidation for critical issues
make cf-invalidate PATHS="/<affected-path>/*"
```

### Security Incident

```bash
# Clear entire cache if compromised
make cf-invalidate PATHS="/*"
```

---

**Tips:**

- Always test with dry run first
- Invalidations are typically completed in 10-15 minutes
- Use CloudWatch to monitor cache hit ratios
- Consider using versioned assets to reduce invalidation needs
