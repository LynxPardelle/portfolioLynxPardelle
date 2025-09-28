#!/bin/bash
# LocalStack Initialization Script
# Sets up S3 buckets, CloudFront distributions, and IAM policies for testing

set -e

echo "🚀 Initializing LocalStack AWS services for testing..."

# Wait for LocalStack to be ready
echo "⏳ Waiting for LocalStack to be ready..."
while ! curl -f http://localhost:4566/health > /dev/null 2>&1; do
  sleep 2
done

# Configure AWS CLI for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Create S3 bucket for testing
echo "📦 Creating S3 bucket: test-portfolio-bucket"
aws --endpoint-url=http://localhost:4566 s3 mb s3://test-portfolio-bucket

# Enable versioning on the bucket
echo "🔄 Enabling S3 bucket versioning"
aws --endpoint-url=http://localhost:4566 s3api put-bucket-versioning \
  --bucket test-portfolio-bucket \
  --versioning-configuration Status=Enabled

# Set bucket CORS configuration for testing
echo "🌐 Setting CORS configuration"
aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors \
  --bucket test-portfolio-bucket \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

# Create some test objects in the bucket
echo "📄 Creating test objects in S3 bucket"
echo "Test content for file 1" | aws --endpoint-url=http://localhost:4566 s3 cp - s3://test-portfolio-bucket/uploads/test/file1.txt
echo "Test content for file 2" | aws --endpoint-url=http://localhost:4566 s3 cp - s3://test-portfolio-bucket/uploads/albums/file2.txt
echo "Test image content" | aws --endpoint-url=http://localhost:4566 s3 cp - s3://test-portfolio-bucket/uploads/main/image1.jpg

# Create CloudFront distribution (basic simulation)
echo "☁️ Creating CloudFront distribution"
DISTRIBUTION_CONFIG='{
  "CallerReference": "test-distribution-'$(date +%s)'",
  "Comment": "Test distribution for portfolio testing",
  "DefaultCacheBehavior": {
    "TargetOriginId": "test-s3-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    }
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "test-s3-origin",
        "DomainName": "test-portfolio-bucket.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All"
}'

DISTRIBUTION_ID=$(aws --endpoint-url=http://localhost:4566 cloudfront create-distribution \
  --distribution-config "$DISTRIBUTION_CONFIG" \
  --query 'Distribution.Id' \
  --output text 2>/dev/null || echo "TEST-DISTRIBUTION-ID")

echo "📊 CloudFront Distribution ID: $DISTRIBUTION_ID"

# Create IAM role for testing
echo "🔐 Creating IAM role for testing"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

aws --endpoint-url=http://localhost:4566 iam create-role \
  --role-name TestPortfolioRole \
  --assume-role-policy-document "$TRUST_POLICY" \
  2>/dev/null || echo "IAM role already exists"

# Create IAM policy for S3 access
echo "📋 Creating IAM policy for S3 access"
S3_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::test-portfolio-bucket",
        "arn:aws:s3:::test-portfolio-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetDistribution"
      ],
      "Resource": "*"
    }
  ]
}'

aws --endpoint-url=http://localhost:4566 iam create-policy \
  --policy-name TestS3CloudFrontPolicy \
  --policy-document "$S3_POLICY" \
  2>/dev/null || echo "IAM policy already exists"

# Attach policy to role
aws --endpoint-url=http://localhost:4566 iam attach-role-policy \
  --role-name TestPortfolioRole \
  --policy-arn arn:aws:iam::000000000000:policy/TestS3CloudFrontPolicy \
  2>/dev/null || echo "Policy already attached"

# Create CloudWatch log group for testing
echo "📊 Creating CloudWatch log group"
aws --endpoint-url=http://localhost:4566 logs create-log-group \
  --log-group-name /test/portfolio/s3-migration \
  2>/dev/null || echo "Log group already exists"

# List created resources for verification
echo "✅ LocalStack initialization complete!"
echo ""
echo "📦 S3 Buckets:"
aws --endpoint-url=http://localhost:4566 s3 ls

echo ""
echo "📄 S3 Objects in test-portfolio-bucket:"
aws --endpoint-url=http://localhost:4566 s3 ls s3://test-portfolio-bucket --recursive

echo ""
echo "☁️ CloudFront Distributions:"
aws --endpoint-url=http://localhost:4566 cloudfront list-distributions \
  --query 'DistributionList.Items[*].{Id:Id,DomainName:DomainName,Status:Status}' \
  --output table 2>/dev/null || echo "No distributions found"

echo ""
echo "🔐 IAM Roles:"
aws --endpoint-url=http://localhost:4566 iam list-roles \
  --query 'Roles[*].RoleName' \
  --output table

echo ""
echo "🚀 LocalStack is ready for testing!"
echo "   S3 Endpoint: http://localhost:4566"
echo "   S3 Bucket: test-portfolio-bucket"
echo "   CloudFront Distribution: $DISTRIBUTION_ID"
echo "   Test credentials: test/test"