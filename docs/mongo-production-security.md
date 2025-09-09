# MongoDB Production Security & Manual Setup Guide

## 1. Environment Variable Requirements
- **MONGO_INITDB_ROOT_PASSWORD**: Must be a long, random value. Never use defaults in production.
- **MONGO_APP_PASSWORD**: Must be a long, random value. Change for each deployment.
- **MONGO_APP_USER**: Should be unique per environment.
- **MONGO_RESTORE_ON_INIT**: Set to `false` in production unless initial restoration is required.
- **Optional TLS/SSL**:
  - Set `MONGO_TLS_MODE=required` and mount certificate/key files.
  - Use `MONGO_TLS_CERTIFICATE_KEY_FILE`, `MONGO_TLS_CA_FILE`.

## 2. Manual Steps for Secure Setup
- **Secrets Management**:
  - Store all secrets in a secure vault (not in source control).
  - Rotate passwords regularly.
- **TLS/SSL Setup**:
  - Generate certificates for MongoDB server.
  - Mount certs into the container and set TLS envs in Compose.
  - Update Compose to add `--tlsMode=required` and cert paths in `command`.
- **Network Hardening**:
  - Only expose MongoDB to trusted networks.
  - Use firewalls or Docker network isolation.
- **User & Role Management**:
  - Create least-privilege users for app access.
  - Never use root for application connections.
- **Backup/Restore Security**:
  - Restrict access to backup files and S3 credentials.
  - Use IAM roles for S3 if possible.

## 3. Compose & Dockerfile Security Features
- **Authentication enforced**: `--auth` is set in Compose command.
- **REST interface disabled**: `--nohttpinterface` is set.
- **TLS/SSL support**: Documented above; requires manual cert setup.
- **Environment validation**: Compose and Dockerfile require envs for passwords.

## 4. Manual Checklist Before Production Deploy
- [ ] Set strong root/app passwords in `.env` or secret manager
- [ ] Set up TLS/SSL and mount certs
- [ ] Restrict network exposure
- [ ] Create least-privilege app user
- [ ] Set `MONGO_RESTORE_ON_INIT=false` unless restoring
- [ ] Secure backup/restore credentials
- [ ] Test authentication and TLS from client

## 5. How Configuration Interacts
- **Compose envs**: Control passwords, TLS, and restoration toggle
- **Dockerfile**: Documents security best practices, expects envs
- **Backup/restore scripts**: Use S3 credentials, must be secured
- **App connection**: Should use app user, not root, and connect via TLS if enabled

---
For more details, see `env-configuration.md` and `mongodb-backup-s3.md` in this folder.