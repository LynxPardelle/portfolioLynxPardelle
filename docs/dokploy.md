# Dokploy deployment guide

This project provides per-service docker-compose files suited for Dokploy. Each stack joins a shared external Docker network so they can communicate even when deployed separately.

## Shared external network

- Name: lynx-portfolio-network (override via APP_NETWORK)
- Create once on the host:
  - docker network create lynx-portfolio-network

## Files

- docker-compose.mongo.yml — MongoDB database and volume
- docker-compose.prod.yml — Node.js production app (no nginx)
- docker-compose.app.yml — Node.js app (production build) [optional, alt]
- docker-compose.nginx.yml — Standalone Nginx reverse proxy for the app [optional]
- docker-compose.prod-nginx.yml — Single-container image with Node + Nginx [optional]
- docker-compose.mongo-backup.yml — Cron-based Mongo backups to S3

## Recommended deployment for Dokploy (no nginx)

1) Deploy docker-compose.mongo.yml (MongoDB)
2) Deploy docker-compose.prod.yml (Backend app)
3) (Optional) Deploy docker-compose.mongo-backup.yml (Backups)

## Alternatives

- Separate nginx: Deploy mongo -> app -> nginx (use docker-compose.app.yml and docker-compose.nginx.yml)
- Single container (Node+Nginx): Deploy mongo -> prod-nginx (use docker-compose.prod-nginx.yml)
- In both cases, mongo-backup remains optional

## Key environment variables (set in Dokploy)

- APP_NETWORK=lynx-portfolio-network
- DEV_PORT=6164
- PROD_PORT=6165
- NGINX_PORT=80
- MONGO_PORT=27017
- MONGO_ROOT_USERNAME, MONGO_ROOT_PASSWORD
- MONGO_APP_DB=lynx_portfolio
- MONGO_APP_TEST_DB=lynx_portfolio_test
- MONGO_APP_USER=portfolio
- MONGO_APP_PASSWORD=portfolio_pass
- MONGO_AUTH_SOURCE=admin
- MONGO_URI=mongodb://${MONGO_APP_USER}:${MONGO_APP_PASSWORD}@mongo:${MONGO_PORT}/${MONGO_APP_DB}?authSource=${MONGO_AUTH_SOURCE}
- JWT_SECRET=your-super-secret
- CORS_ORIGIN=<http://lynxpardelle.com>,<https://www.lynxpardelle.com>
- S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT (for backups)

## Volumes

- Mongo data volume is named via lynx-portfolio-back-mongo-data (default lynx-portfolio-mongo-data) so it can be reused by the backup stack. Create it automatically on first run or manually: docker volume create lynx-portfolio-mongo-data.
- App logs/uploads volumes are defined per stack and retained across updates.

## Health checks

- Mongo: ping via mongosh
- App: GET /health on PORT (6165)
- Nginx: /nginx-status and /health upstream

## Notes

- Dokploy deployment does not require nginx. The app service exposes ${PROD_PORT} on the host and listens internally on 6165.
- If you choose to use nginx variants, ensure nginx.conf upstream points to app:6165.
- When changing ports, update PORT, DEV_PORT/PROD_PORT, and nginx.conf upstream accordingly.
- For local dev or Docker Compose non-Dokploy use, the original docker-compose.yml remains available.

## Troubleshooting

- If nginx returns 502, check that the app’s /health endpoint returns 200 and that the containers are on the same network (docker inspect).
- If the app cannot reach Mongo, verify MONGO_URI host is mongo with the correct port and credentials, and that the mongo stack is up.
