# MongoDB init scripts moved

The initial MongoDB user/restore scripts now live inside the unified container build context:

- private-projects/mongo-backup-v2/docker/docker-entrypoint-initdb.d/01-create-app-user.js
- private-projects/mongo-backup-v2/docker/docker-entrypoint-initdb.d/02-s3-restore-if-needed.sh

These run automatically during the image's first start when /data/db is empty.

Legacy root-level copies were removed to keep the API root clean. If you need to reference older assets, see:

- private-projects/mongo-backup-v2/archive/pre-unified/mongo-init/