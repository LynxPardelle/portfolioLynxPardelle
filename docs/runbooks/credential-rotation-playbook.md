# Credential Rotation Guide

## What This Covers

This guide shows you how to rotate credentials safely to maintain security.

**Why rotate credentials?**

- Limits damage if credentials are compromised
- Security best practice  
- Compliance requirement

## What Needs Rotation

### AWS Access Keys

- **Used for**: S3, CloudFront access
- **Where**: `.env` files, CI/CD secrets
- **When**: Every 90 days

### Database Credentials  

- **Used for**: MongoDB access
- **Where**: `MONGO_URI` environment variable
- **When**: Every 180 days

### Application Secrets

- **Used for**: JWT tokens
- **Where**: `JWT_SECRET` environment variable  
- **When**: Every 90 days

### Emergency Rotation

- **When**: Suspected credential compromise
- **When**: Team member leaves
- **When**: Security incident

## 1. AWS Access Key Rotation

### Before You Start

- [ ] AWS Console access
- [ ] Access to production environment variables
- [ ] Schedule maintenance window

### Step 1: Create New Access Key

**In AWS Console:**
1. Go to IAM → Users → your-user
2. Security credentials tab → Create access key
3. Select "Application running outside AWS"
4. **Save the new key immediately**

**Test new key:**
```bash
# Test new credentials
export AWS_ACCESS_KEY_ID="new-access-key-id"
export AWS_SECRET_ACCESS_KEY="new-secret-key"

# Test S3 access
aws s3 ls s3://your-bucket-name

# Test CloudFront access  
aws cloudfront list-distributions
```

### Step 2: Update Environment Variables

**Development:**
```bash
# Update .env file
S3_ACCESS_KEY_ID=new-access-key-id
S3_SECRET_ACCESS_KEY=new-secret-key
```

**Production:**
- Update your deployment platform's environment variables
- Update CI/CD secrets (GitHub Actions, etc.)

### Step 3: Restart and Test

```bash
# Restart application
make dev-restart    # Development
make prod-restart   # Production

# Test functionality
npm run s3:health
make cf-invalidate-dry-run PATHS="/test/*"
```

### Step 4: Remove Old Key

**Wait 24-48 hours**, then:

```bash
# Deactivate old key first
aws iam update-access-key --user-name your-user --access-key-id old-key-id --status Inactive

# Wait 24 hours, then delete
aws iam delete-access-key --user-name your-user --access-key-id old-key-id
```

## 2. MongoDB Credential Rotation

### Step 1: Create New Database User

```bash
# Connect to MongoDB
docker exec lynx-portfolio-back-mongo mongosh --port 27017

# Create new user
use admin
db.createUser({
  user: 'new_user',
  pwd: 'new_secure_password',
  roles: [
    { role: 'readWrite', db: 'lynx_portfolio' }
  ]
})
```

### Step 2: Update Connection String

```bash
# Update MONGO_URI in .env
MONGO_URI=mongodb://new_user:new_secure_password@localhost:27017/lynx_portfolio?authSource=admin
```

### Step 3: Test and Remove Old User

```bash
# Restart application
make prod-restart

# Test database connection
curl -s http://localhost:6164/health | jq '.database'

# Remove old user (after testing)
use admin
db.dropUser('old_user')
```

## 3. JWT Secret Rotation

### Step 1: Generate New Secret

```bash
# Generate secure random string
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 2: Update and Deploy

```bash
# Update .env
JWT_SECRET=new-generated-secret

# Restart application
make prod-restart
```

**Note**: All users will need to log in again after JWT secret rotation.

## Emergency Rotation

### If Credentials Are Compromised

**Immediate steps:**

1. **Deactivate compromised credentials immediately**
   ```bash
   aws iam update-access-key --user-name your-user --access-key-id compromised-key --status Inactive
   ```

2. **Generate and deploy new credentials quickly**
3. **Monitor for unauthorized access**
4. **Document the incident**

### If Team Member Leaves

1. **Rotate any shared credentials they had access to**
2. **Remove their individual access**
3. **Review access logs**

## Verification Checklist

After any rotation:

- [ ] **AWS Services Working**
  - [ ] S3 access functional
  - [ ] CloudFront invalidation working
  - [ ] No authentication errors in logs

- [ ] **Application Working**
  - [ ] Database connection successful
  - [ ] Authentication working
  - [ ] Health checks passing

- [ ] **Old Credentials Removed**
  - [ ] Old keys deactivated/deleted
  - [ ] No errors from old credential usage

## Troubleshooting

### "AccessDenied" Errors

**Problem**: New credentials don't work

**Solution**:
1. Verify new credentials are correct
2. Check IAM permissions haven't changed
3. Ensure credentials are updated everywhere

### Application Won't Start

**Problem**: Service fails after credential update

**Solution**:
1. Check all environment variables are updated
2. Verify connection strings are correct
3. Restart all dependent services

### Rollback If Needed

If rotation fails:

```bash
# Reactivate old credentials
aws iam update-access-key --user-name your-user --access-key-id old-key --status Active

# Revert environment variables
git checkout HEAD~1 -- .env

# Restart services
make prod-restart
```

## Quick Reference

| Task | Command |
|------|---------|
| Test AWS credentials | `aws sts get-caller-identity` |
| Check S3 access | `aws s3 ls s3://your-bucket` |
| Test app health | `curl http://localhost:6164/health` |
| Restart services | `make prod-restart` |

## Tips

- **Always test new credentials before removing old ones**
- **Keep a 24-48 hour grace period before deleting old credentials**
- **Document when rotations are due**
- **Rotate during low-traffic periods**
- **Have rollback plan ready**

## Getting Help

1. Check application logs for authentication errors
2. Test credentials manually with AWS CLI
3. Verify environment variables are loaded correctly
4. Contact AWS support for service-specific issues
