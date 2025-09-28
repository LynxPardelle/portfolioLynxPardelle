# CloudFront S3 Access Fix

## Problem
CloudFront returns 403 Forbidden errors when trying to access files from S3. This happens when the S3 bucket policy doesn't allow CloudFront's Origin Access Control (OAC) to read files.

## Root Cause
- CloudFront distribution is configured with Origin Access Control (OAC)
- S3 bucket lacks the proper bucket policy to allow CloudFront access
- IAM user may not have permissions to modify bucket policies

## Solution

### Apply S3 Bucket Policy

The most reliable solution is to add a bucket policy that allows CloudFront to access your S3 files.

#### Via AWS Console (Recommended)

1. **Log into AWS Console** with S3 permissions
2. **Navigate to S3** → your bucket (from `S3_BUCKET_NAME` environment variable)
3. **Go to Permissions tab** → Bucket policy section
4. **Add the following bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

**Replace the placeholders:**

- `YOUR_BUCKET_NAME` - Your S3 bucket name
- `YOUR_AWS_ACCOUNT_ID` - Your AWS account ID (12-digit number)
- `YOUR_DISTRIBUTION_ID` - Your CloudFront distribution ID

5. **Save the policy**

#### Via AWS CLI

```bash
# Create policy file (replace placeholders with your values)
cat > bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
EOF

# Apply the policy
aws s3api put-bucket-policy --bucket YOUR_BUCKET_NAME --policy file://bucket-policy.json
```

## Verification

After applying the bucket policy:

1. **Wait 1-2 minutes** for policy propagation
2. **Test CDN access**:

   ```bash
   # Test a CDN URL from your CloudFront domain
   curl -I "https://YOUR_CLOUDFRONT_DOMAIN/uploads/main/sample-file.jpg"
   ```

   Should return `200 OK` instead of `403 Forbidden`

3. **Test via API**:

   ```bash
   # Test file serving endpoint
   curl "http://localhost:6164/api/main/get-file/FILE_ID"
   ```

   Should redirect to CDN URL that now works

4. **Check application health**:

   ```bash
   curl http://localhost:6164/api/main/s3-status
   ```

## Expected Results

- ✅ CloudFront CDN URLs return `200 OK`
- ✅ API redirects work correctly  
- ✅ Files load without 403 errors
- ✅ Improved performance via CDN caching

## How Origin Access Control Works

1. CloudFront presents itself as `cloudfront.amazonaws.com` service principal
2. Request includes source ARN with your distribution ID
3. S3 bucket policy validates the service principal and source ARN
4. If valid, grants `s3:GetObject` permission for files

## Security Benefits

- Files remain private (no public bucket access)
- Only your CloudFront distribution can access files
- Uses modern OAC instead of legacy Origin Access Identity (OAI)
- Specific ARN condition prevents unauthorized access

## Troubleshooting

If CDN still returns 403 after applying policy:

1. **Check policy syntax** - ensure JSON is valid
2. **Verify ARNs** - distribution ID and AWS account ID must match exactly
3. **Wait for propagation** - can take up to 5 minutes
4. **Check CloudFront cache** - may need cache invalidation
5. **Verify file exists** - ensure file is actually in S3

### Cache Invalidation

If needed, invalidate CloudFront cache:

```bash
# Use your distribution ID from CLOUDFRONT_DISTRIBUTION_ID env var
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

Or use the project's npm script:

```bash
npm run cdn:invalidate
```

## Finding Your Values

- **S3 Bucket Name**: Check `S3_BUCKET_NAME` in your `.env` file
- **CloudFront Distribution ID**: Check `CLOUDFRONT_DISTRIBUTION_ID` in your `.env` file  
- **CloudFront Domain**: Check `CLOUDFRONT_DOMAIN` in your `.env` file
- **AWS Account ID**: 12-digit number, found in AWS Console top-right menu

---

*For additional help, consult your AWS administrator or refer to the AWS CloudFront documentation.*
