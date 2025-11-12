# MongoDB Backup to S3

Automated MongoDB backup system that stores compressed database dumps to Amazon S3 with configurable retention policies.

## How It Works

**Backup Process:**

- Unified `mongo-unified` container runs scheduled backups (managed by supervisor/cron inside the container)
- Creates compressed MongoDB dumps using `mongodump`
- Uploads backups to S3 bucket under `backups/` folder
- Maintains local copies in `mongo_backups/` directory
- Automatic cleanup of old backups (local and S3)

**Scheduling:**

- Default: Daily at 2 AM and Weekly on Sunday at 3 AM (configurable via BACKUP_SCHEDULE_* envs)
- Configurable via `BACKUP_SCHEDULE_DAILY` and `BACKUP_SCHEDULE_WEEKLY`
- Manual backup execution available

## Required Configuration

**S3 Storage:**

- `S3_BUCKET_NAME` - S3 bucket name for backup storage
- `S3_REGION` - AWS region (e.g., `us-east-1`)
- `S3_ACCESS_KEY_ID` - AWS access key with S3 permissions
- `S3_SECRET_ACCESS_KEY` - AWS secret key

**Backup Settings:**

- `MONGO_BACKUP_KEEP` - Number of backups to retain (default: 4)
- `MONGO_BACKUP_CRON` - Cron schedule (default: weekly)

**Optional:**

- `S3_ENDPOINT` - Custom endpoint for S3-compatible services (MinIO, Wasabi)

All MongoDB connection details are automatically configured from the main database settings.

## AWS S3 Setup

**Create S3 Bucket:**

1. Go to AWS Console > S3 > Create bucket
2. Choose a globally unique name and region
3. Enable versioning for backup protection (recommended)

**Create IAM User:**

1. Go to AWS Console > IAM > Users > Create user
2. Select "Programmatic access"
3. Attach the following policy (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/backups/*"
    }
  ]
}
```

1. Save the Access Key ID and Secret Access Key securely
2. Add them to your `.env` file

## Manual Operations

**Start Unified Service:**

```powershell
# Start unified MongoDB + backup service
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml up -d --build

# View container logs
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml logs -f mongo-unified
```

**Manual Backup:**

```powershell
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml exec mongo-unified /opt/mongo-unified/scripts/backup_mongo_to_s3.sh manual
```

**Restore from S3:**

```powershell
docker compose -f private-projects/mongo-backup-v2/docker/docker-compose.unified.yml exec mongo-unified /opt/mongo-unified/scripts/restore_mongo_from_s3.sh
```

**Note:** Manual operations require the backup container to be running.

## Deployment Options

**With Main Application:**

- Use `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml` alongside the app compose
- Unified service runs alongside the app; app connects via `mongo-unified:27017`

**Standalone (Dokploy):**

- Use `private-projects/mongo-backup-v2/docker/docker-compose.unified.yml`
- Deploy as a dedicated Dokploy service (the container includes MongoDB + backups)

## Troubleshooting

**Backup Fails:**

- Verify S3 credentials are correct
- Check AWS permissions for bucket access
- Ensure MongoDB connection from backup container
- Review logs: `make backup-logs`

**Restore Issues:**

- Confirm backups exist in S3 bucket under `backups/` folder
- Verify MongoDB service is running and accessible
- Check database user permissions

## Security Best Practices

**Credentials:**

- Store AWS keys securely (never commit to version control)
- Use IAM roles instead of access keys when possible
- Rotate credentials regularly
- Apply least-privilege access policies

**S3 Configuration:**

- Enable bucket versioning for additional protection
- Configure lifecycle policies for cost optimization
- Enable server-side encryption
- Restrict bucket access to backup operations only
